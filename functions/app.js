import express from 'express'
import cors from 'cors'
import {
  ADMIN_PASSWORD,
  ADMIN_SESSION_TTL_MS,
  ALLOWED_ORIGINS,
  FRONTEND_URL,
  TELEGRAM_WEBHOOK_SECRET,
} from './config.js'
import {
  LIMITS,
  ValidationError,
  cleanAvatar,
  cleanBanner,
  cleanLinks,
  cleanTags,
  cleanText,
  handleForLookup,
  safeEqual,
  validateEmail,
  validateNewUsername,
} from './validation.js'
import * as store from './store.js'
import { sendAdminResponseEmail, sendNewMessageNotification } from './emails.js'
import { newChatAlert, parseAdminReply, sendTelegramMessage } from './telegram.js'
import { buildVCard } from './vcard.js'

export const app = express()

// Requests arrive through Firebase Hosting and Google's front end, so the visitor's
// address is in the forwarded headers rather than the socket.
app.set('trust proxy', true)

app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || ALLOWED_ORIGINS.includes(origin))
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
// Profile photos and banners are resized in the browser, well under this limit.
app.use(express.json({ limit: '1mb' }))

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

// The visitor's address, used only for best-effort per-visitor rate limits.
// Requests to aurataps.net pass through Netlify and then Firebase Hosting, so the connecting
// address is a proxy; Netlify's client header or the first X-Forwarded-For entry (req.ip,
// since trust proxy is on) is the visitor. Callers can forge these headers; member sign-in
// and password resets are protected by Firebase Authentication itself.
function clientIp(req) {
  return String(req.headers['x-nf-client-connection-ip'] || req.ip || 'unknown').split(',')[0].trim()
}

function bearerToken(req) {
  const header = req.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7) : ''
}

// Wraps async handlers so thrown errors reach the error handler below.
const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)

function rateLimit(name, { max, windowMs }, keyFor = clientIp) {
  return route(async (req, res, next) => {
    const key = keyFor(req)
    if (key && (await store.hitRateLimit(`${name}:${key}`, { max, windowMs }))) {
      res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' })
      return
    }
    next()
  })
}

// Members sign in with Firebase Authentication in the browser and send their ID token.
const requireMember = route(async (req, res, next) => {
  const token = bearerToken(req)
  let decoded = null
  if (token) {
    try {
      decoded = await store.auth.verifyIdToken(token)
    } catch {
      decoded = null
    }
  }
  if (!decoded) {
    res.status(401).json({ error: 'Your session has expired. Please log in again.' })
    return
  }
  req.uid = decoded.uid
  req.email = decoded.email || ''
  next()
})

const requireAdmin = route(async (req, res, next) => {
  const token = bearerToken(req)
  if (!(await store.getSession(token, 'admin'))) {
    res.status(401).json({ error: 'Invalid or expired admin token' })
    return
  }
  req.sessionToken = token
  next()
})

// ─── Chat widget + contact form ───

app.post(
  '/api/chat/message',
  rateLimit('chat', { max: 10, windowMs: 10 * MINUTE }),
  route(async (req, res) => {
    const visitorName = cleanText(req.body.visitorName, 80, 'Name', { required: true })
    const visitorEmail = validateEmail(req.body.visitorEmail)
    const visitorMessage = String(req.body.visitorMessage || '').trim().slice(0, 2000)
    if (!visitorMessage) throw new ValidationError('Please enter a message.')

    const result = await store.saveMessage(visitorName, visitorEmail, visitorMessage)
    await sendTelegramMessage(newChatAlert({ visitorName, visitorMessage, messageId: result.id }))
    res.json({ success: true, messageId: result.id })
  }),
)

// The chat widget polls this for replies. It only returns replies, never contact details.
app.get(
  '/api/chat/message/:messageId',
  route(async (req, res) => {
    const thread = await store.getMessageWithResponses(req.params.messageId)
    if (!thread) {
      res.status(404).json({ error: 'Message not found' })
      return
    }
    res.json({ id: thread.id, status: thread.status, createdAt: thread.createdAt, responses: thread.responses })
  }),
)

app.post(
  '/api/contact',
  rateLimit('contact', { max: 8, windowMs: 10 * MINUTE }),
  route(async (req, res) => {
    const name = cleanText(req.body.name, 80, 'Name', { required: true })
    const email = validateEmail(req.body.email)
    const company = cleanText(req.body.company, 120, 'Company')
    const teamSize = cleanText(req.body.teamSize, 40, 'Team size', { required: true })
    const message = String(req.body.message || '').trim().slice(0, 4000)
    if (!message) throw new ValidationError('Please enter a message.')

    const normalizedMessage = [`Company: ${company || 'Not provided'}`, `Team Size: ${teamSize}`, '', message].join('\n')
    const saved = await store.saveMessage(name, email, normalizedMessage)
    await sendNewMessageNotification(name, email, normalizedMessage, saved.id)
    res.json({ success: true })
  }),
)

// ─── Member profiles (accounts are Firebase Authentication users) ───

// Checked before a new account is created, so sign-up can't leave someone without a link.
app.get(
  '/api/public/username/:handle',
  rateLimit('username-check', { max: 120, windowMs: 10 * MINUTE }),
  route(async (req, res) => {
    let handle
    try {
      handle = validateNewUsername(req.params.handle)
    } catch (error) {
      res.json({ available: false, reason: error.message })
      return
    }
    const available = await store.isUsernameAvailable(handle)
    res.json({ available, reason: available ? '' : 'That link is already taken. Please choose another.' })
  }),
)

// Called right after a new Firebase account is created: names the profile and claims its link.
app.post(
  '/api/member/setup',
  requireMember,
  // High enough for a whole team to sign up from one office network.
  rateLimit('setup', { max: 30, windowMs: HOUR }),
  route(async (req, res) => {
    const displayName = cleanText(req.body.displayName, LIMITS.displayName, 'Name', { required: true })
    const username = validateNewUsername(req.body.username)
    await store.ensureUserDoc(req.uid, req.email)
    await store.claimUsername(req.uid, username)
    const profile = await store.updateUserProfile(req.uid, { displayName })
    res.json({ success: true, profile })
  }),
)

app.get(
  '/api/member/profile',
  requireMember,
  route(async (req, res) => {
    res.json(await store.ensureUserDoc(req.uid, req.email))
  }),
)

// Profiles created in the original Aura app were never validated, so a value the member didn't
// change is saved exactly as stored; only new or edited values are checked.
const sameValue = (a, b) => JSON.stringify(a ?? '') === JSON.stringify(b ?? '')
const keepOrClean = (incoming, stored, clean) => (sameValue(incoming, stored) ? stored : clean(incoming))

// Updates only the fields the portal edits; role, email, affiliate data, and anything else
// on the member's document are left untouched.
app.put(
  '/api/member/profile',
  requireMember,
  route(async (req, res) => {
    const body = req.body || {}
    const current = await store.ensureUserDoc(req.uid, req.email)
    const profile = await store.updateUserProfile(req.uid, {
      displayName: keepOrClean(body.displayName, current.displayName, (v) => cleanText(v, LIMITS.displayName, 'Name', { required: true })),
      jobTitle: keepOrClean(body.jobTitle, current.jobTitle, (v) => cleanText(v, LIMITS.jobTitle, 'Job title')),
      location: keepOrClean(body.location, current.location, (v) => cleanText(v, LIMITS.location, 'Location')),
      bio: keepOrClean(body.bio, current.bio, (v) => cleanText(v, LIMITS.bio, 'Bio', { multiline: true })),
      tags: keepOrClean(body.tags, current.tags, cleanTags),
      avatarUrl: keepOrClean(body.avatarUrl, current.avatarUrl, cleanAvatar),
      bannerUrl: keepOrClean(body.bannerUrl, current.bannerUrl, cleanBanner),
      links: cleanLinks(body.links || [], current.links),
    })
    res.json({ success: true, profile })
  }),
)

app.put(
  '/api/member/username',
  requireMember,
  rateLimit('username-change', { max: 10, windowMs: HOUR }, (req) => req.uid),
  route(async (req, res) => {
    await store.ensureUserDoc(req.uid, req.email)
    const profile = await store.claimUsername(req.uid, validateNewUsername(req.body.username))
    res.json({ success: true, profile })
  }),
)

// ─── Public tap profiles ───

async function publicProfileFor(req, res) {
  const handle = handleForLookup(req.params.handle)
  const profile = handle ? await store.getPublicProfileByHandle(handle) : null
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' })
    return null
  }
  return profile
}

app.get(
  '/api/public/profile/:handle',
  route(async (req, res) => {
    const profile = await publicProfileFor(req, res)
    if (profile) res.json(profile)
  }),
)

app.get(
  '/api/public/profile/:handle/vcard',
  route(async (req, res) => {
    const profile = await publicProfileFor(req, res)
    if (!profile) return
    res.set('Content-Type', 'text/vcard; charset=utf-8')
    res.set('Content-Disposition', `attachment; filename="${profile.username}.vcf"`)
    res.send(buildVCard(profile, `${FRONTEND_URL}/${profile.username}`))
  }),
)

// ─── Admin ───

app.post(
  '/api/admin/login',
  rateLimit('admin-login', { max: 8, windowMs: 15 * MINUTE }),
  route(async (req, res) => {
    if (!ADMIN_PASSWORD) {
      res.status(503).json({ error: 'Admin login is not configured' })
      return
    }
    if (!req.body.password || !safeEqual(req.body.password, ADMIN_PASSWORD)) {
      res.status(401).json({ error: 'Invalid admin credentials' })
      return
    }
    const token = await store.createSession({ type: 'admin', ttlMs: ADMIN_SESSION_TTL_MS })
    res.json({ success: true, token, expiresInSeconds: ADMIN_SESSION_TTL_MS / 1000 })
  }),
)

app.post(
  '/api/admin/logout',
  requireAdmin,
  route(async (req, res) => {
    await store.deleteSession(req.sessionToken)
    res.json({ success: true })
  }),
)

app.get('/api/admin/session', requireAdmin, (req, res) => {
  res.json({ success: true })
})

app.get(
  '/api/admin/messages/unread',
  requireAdmin,
  route(async (req, res) => {
    res.json(await store.getUnreadMessages())
  }),
)

app.get(
  '/api/admin/messages',
  requireAdmin,
  route(async (req, res) => {
    res.json(await store.getAllMessages())
  }),
)

app.get(
  '/api/admin/message/:messageId',
  requireAdmin,
  route(async (req, res) => {
    const thread = await store.getMessageWithResponses(req.params.messageId)
    if (!thread) {
      res.status(404).json({ error: 'Message not found' })
      return
    }
    res.json(thread)
  }),
)

async function replyToMessage(messageId, adminResponse) {
  const thread = await store.getMessageWithResponses(messageId)
  if (!thread) throw new ValidationError('Message not found', 404)
  await store.saveResponse(messageId, adminResponse)
  await sendAdminResponseEmail(thread.visitorEmail, thread.visitorName, adminResponse)
}

app.post(
  '/api/admin/response',
  requireAdmin,
  route(async (req, res) => {
    const { messageId } = req.body
    const adminResponse = String(req.body.adminResponse || '').trim()
    if (!messageId || !adminResponse) throw new ValidationError('Missing required fields')
    await replyToMessage(messageId, adminResponse)
    res.json({ success: true })
  }),
)

app.post(
  '/api/admin/message/:messageId/read',
  requireAdmin,
  route(async (req, res) => {
    await store.markMessageAsRead(req.params.messageId)
    res.json({ success: true })
  }),
)

app.delete(
  '/api/admin/message/:messageId',
  requireAdmin,
  route(async (req, res) => {
    const result = await store.deleteMessageThread(req.params.messageId)
    if (!result.deleted) {
      res.status(404).json({ error: 'Message not found' })
      return
    }
    res.json({ success: true })
  }),
)

// ─── Telegram replies (webhook) ───

app.post(
  '/api/telegram/webhook',
  route(async (req, res) => {
    const secret = req.headers['x-telegram-bot-api-secret-token'] || ''
    if (!TELEGRAM_WEBHOOK_SECRET || !safeEqual(secret, TELEGRAM_WEBHOOK_SECRET)) {
      res.status(404).end()
      return
    }
    const reply = parseAdminReply(req.body)
    if (reply) {
      try {
        await replyToMessage(reply.messageId, reply.text)
        await sendTelegramMessage('Reply sent to the visitor.')
      } catch (error) {
        console.error('Telegram reply failed:', error)
        await sendTelegramMessage('Could not send that reply. The conversation may have been deleted.')
      }
    }
    // Always 200 so Telegram doesn't keep retrying the same update.
    res.json({ ok: true })
  }),
)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by their four arguments.
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    res.status(error.status).json({ error: error.message })
    return
  }
  if (error.type === 'entity.too.large') {
    res.status(413).json({ error: 'That upload is too large. Please choose a smaller photo.' })
    return
  }
  if (error.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid request.' })
    return
  }
  console.error(error)
  res.status(500).json({ error: 'Something went wrong. Please try again.' })
})
