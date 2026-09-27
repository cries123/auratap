import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'
import {
  ADMIN_PASSWORD,
  ADMIN_SESSION_TTL_MS,
  ALLOWED_ORIGINS,
  FRONTEND_URL,
  MEMBER_SESSION_TTL_MS,
  PASSWORD_RESET_TTL_MS,
  TELEGRAM_WEBHOOK_SECRET,
} from './config.js'
import {
  LIMITS,
  ValidationError,
  cleanAvatar,
  cleanLinks,
  cleanPhone,
  cleanText,
  hashPassword,
  normalizeEmail,
  normalizeSlug,
  safeEqual,
  validateEmail,
  validatePassword,
  validateSlug,
  verifyPassword,
} from './validation.js'
import * as store from './store.js'
import { sendAdminResponseEmail, sendNewMessageNotification, sendPasswordResetEmail } from './emails.js'
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
// Profile photos are resized in the browser to ~400px, well under this limit.
app.use(express.json({ limit: '400kb' }))

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

// The visitor's address, used only for best-effort per-visitor rate limits.
// Requests to aurataps.net pass through Netlify and then Firebase Hosting, so the connecting
// address is a proxy; Netlify's client header or the first X-Forwarded-For entry (req.ip,
// since trust proxy is on) is the visitor. Callers can forge these headers, which is why
// logins and password resets are also limited per email address.
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

const requireMember = route(async (req, res, next) => {
  const token = bearerToken(req)
  const session = await store.getSession(token, 'member')
  if (!session) {
    res.status(401).json({ error: 'Your session has expired. Please log in again.' })
    return
  }
  req.memberId = session.memberId
  req.sessionToken = token
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

// ─── Member accounts ───

app.post(
  '/api/member/register',
  // High enough for a whole team to sign up from one office network.
  rateLimit('register', { max: 30, windowMs: HOUR }),
  route(async (req, res) => {
    const email = validateEmail(req.body.email)
    const password = validatePassword(req.body.password)
    const displayName = cleanText(req.body.displayName, LIMITS.displayName, 'Name', { required: true })
    const slug = validateSlug(req.body.slug)

    const passwordSalt = crypto.randomBytes(16).toString('hex')
    const passwordHash = await hashPassword(password, passwordSalt)
    const member = await store.createMember({ email, passwordHash, passwordSalt, slug, displayName })
    const token = await store.createSession({ type: 'member', memberId: member.id, ttlMs: MEMBER_SESSION_TTL_MS })
    res.json({ success: true, token, slug })
  }),
)

// A throwaway hash so a login for an unknown email takes as long as a real one.
const DUMMY_SALT = crypto.randomBytes(16).toString('hex')
const DUMMY_HASH = crypto.scryptSync('not-a-real-password', DUMMY_SALT, 64).toString('hex')

app.post(
  '/api/member/login',
  rateLimit('login-ip', { max: 30, windowMs: 15 * MINUTE }),
  rateLimit('login-email', { max: 10, windowMs: 15 * MINUTE }, (req) => normalizeEmail(req.body.email)),
  route(async (req, res) => {
    const email = normalizeEmail(req.body.email)
    const password = String(req.body.password || '')
    const member = email ? await store.findMemberByEmail(email) : null
    const valid = await verifyPassword(password, member?.passwordSalt || DUMMY_SALT, member?.passwordHash || DUMMY_HASH)

    if (!member || !valid) {
      res.status(401).json({ error: 'Incorrect email or password.' })
      return
    }

    await store.clearRateLimit(`login-email:${email}`)
    const token = await store.createSession({ type: 'member', memberId: member.id, ttlMs: MEMBER_SESSION_TTL_MS })
    res.json({ success: true, token, slug: member.slug })
  }),
)

app.post(
  '/api/member/logout',
  requireMember,
  route(async (req, res) => {
    await store.deleteSession(req.sessionToken)
    res.json({ success: true })
  }),
)

app.get(
  '/api/member/session',
  requireMember,
  route(async (req, res) => {
    const profile = await store.getMemberProfile(req.memberId)
    if (!profile) {
      res.status(401).json({ error: 'Account not found' })
      return
    }
    res.json({ success: true, slug: profile.slug })
  }),
)

app.get(
  '/api/member/profile',
  requireMember,
  route(async (req, res) => {
    const profile = await store.getMemberProfile(req.memberId)
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' })
      return
    }
    res.json(profile)
  }),
)

app.put(
  '/api/member/profile',
  requireMember,
  route(async (req, res) => {
    const body = req.body || {}
    const profile = await store.updateMemberProfile(req.memberId, {
      displayName: cleanText(body.displayName, LIMITS.displayName, 'Name', { required: true }),
      headline: cleanText(body.headline, LIMITS.headline, 'Headline'),
      subheadline: cleanText(body.subheadline, LIMITS.subheadline, 'Short bio'),
      company: cleanText(body.company, LIMITS.company, 'Company'),
      jobTitle: cleanText(body.jobTitle, LIMITS.jobTitle, 'Job title'),
      phone: cleanPhone(body.phone),
      contactEmail: validateEmail(body.contactEmail, { optional: true, field: 'contact email' }),
      avatarSrc: cleanAvatar(body.avatarSrc),
      links: cleanLinks(body.links || []),
    })
    res.json({ success: true, profile })
  }),
)

app.put(
  '/api/member/slug',
  requireMember,
  rateLimit('slug-change', { max: 10, windowMs: HOUR }, (req) => req.memberId),
  route(async (req, res) => {
    const profile = await store.changeMemberSlug(req.memberId, validateSlug(req.body.slug))
    res.json({ success: true, profile })
  }),
)

// Always answers the same way so the form can't be used to find out who has an account.
app.post(
  '/api/member/password-reset/request',
  rateLimit('reset-ip', { max: 10, windowMs: HOUR }),
  rateLimit('reset-email', { max: 3, windowMs: HOUR }, (req) => normalizeEmail(req.body.email)),
  route(async (req, res) => {
    const email = normalizeEmail(req.body.email)
    const member = email ? await store.findMemberByEmail(email) : null
    if (member) {
      const token = await store.createPasswordReset(member.id, PASSWORD_RESET_TTL_MS)
      const sent = await sendPasswordResetEmail(member.email, member.displayName, token)
      if (!sent) {
        console.warn(`Password reset requested for ${member.email}, but no email was sent (check RESEND_API_KEY).`)
      }
    }
    res.json({ success: true })
  }),
)

app.post(
  '/api/member/password-reset/confirm',
  rateLimit('reset-confirm', { max: 20, windowMs: HOUR }),
  route(async (req, res) => {
    const password = validatePassword(req.body.password)
    const memberId = await store.consumePasswordReset(String(req.body.token || ''))
    if (!memberId) {
      throw new ValidationError('This reset link is invalid or has expired. Please request a new one.')
    }

    const passwordSalt = crypto.randomBytes(16).toString('hex')
    await store.updateMemberPassword(memberId, { passwordSalt, passwordHash: await hashPassword(password, passwordSalt) })
    // Sign out every device that was logged in with the old password.
    await store.deleteMemberSessions(memberId)
    const token = await store.createSession({ type: 'member', memberId, ttlMs: MEMBER_SESSION_TTL_MS })
    res.json({ success: true, token })
  }),
)

// ─── Public tap profiles ───

app.get(
  '/api/public/profile/:slug',
  route(async (req, res) => {
    const profile = await store.getPublicProfileBySlug(normalizeSlug(req.params.slug))
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' })
      return
    }
    res.json(profile)
  }),
)

app.get(
  '/api/public/profile/:slug/vcard',
  route(async (req, res) => {
    const profile = await store.getPublicProfileBySlug(normalizeSlug(req.params.slug))
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' })
      return
    }
    res.set('Content-Type', 'text/vcard; charset=utf-8')
    res.set('Content-Disposition', `attachment; filename="${profile.slug}.vcf"`)
    res.send(buildVCard(profile, `${FRONTEND_URL}/${profile.slug}`))
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
