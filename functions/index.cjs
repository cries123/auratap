const functions = require('firebase-functions')
const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const fetch = require('node-fetch')
const {
  initializeDatabase,
  saveMessage,
  getUnreadMessages,
  getAllMessages,
  getMessageWithResponses,
  saveResponse,
  markMessageAsRead,
  deleteMessageThread,
  createMember,
  findMemberByEmail,
  findMemberBySlug,
  getMemberProfileById,
  getPublicProfileBySlug,
  updateMemberProfile,
  replaceMemberLinks,
} = require('./db.cjs')
const { sendNewMessageNotification } = require('./emails.cjs')
const { sendTelegramMessage } = require('./telegram.cjs')

const app = express()
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'aurataps2026'
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://auratap-ee8a0.web.app'

const allowedOrigins = [
  'https://auratap-ee8a0.web.app',
  'https://www.aurataps.net',
  'https://aurataps.net',
  'http://localhost:5173',
  FRONTEND_URL,
].filter(Boolean)

const sessionTokens = new Map()
const memberSessionTokens = new Map()
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8

function pruneExpiredSessions() {
  const now = Date.now()
  for (const [token, expiresAt] of sessionTokens.entries()) {
    if (expiresAt <= now) {
      sessionTokens.delete(token)
    }
  }

  for (const [token, session] of memberSessionTokens.entries()) {
    if (!session || session.expiresAt <= now) {
      memberSessionTokens.delete(token)
    }
  }
}

setInterval(pruneExpiredSessions, 1000 * 60 * 10)

function createRateLimiter({ windowMs, max, keyPrefix }) {
  const hits = new Map()

  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const key = `${keyPrefix}:${ip}`
    const now = Date.now()
    const entry = hits.get(key)

    if (!entry || now - entry.windowStart >= windowMs) {
      hits.set(key, { count: 1, windowStart: now })
      return next()
    }

    if (entry.count >= max) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' })
    }

    entry.count += 1
    hits.set(key, entry)
    return next()
  }
}

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    return res.status(401).json({ error: 'Missing admin token' })
  }

  pruneExpiredSessions()

  const expiresAt = sessionTokens.get(token)
  if (!expiresAt || expiresAt <= Date.now()) {
    sessionTokens.delete(token)
    return res.status(401).json({ error: 'Invalid or expired admin token' })
  }

  return next()
}

function normalizeSlug(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex')
}

function authenticateMember(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    return res.status(401).json({ error: 'Missing member token' })
  }

  pruneExpiredSessions()
  const session = memberSessionTokens.get(token)
  if (!session || session.expiresAt <= Date.now()) {
    memberSessionTokens.delete(token)
    return res.status(401).json({ error: 'Invalid or expired member token' })
  }

  req.memberId = session.memberId
  return next()
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Origin not allowed by CORS'))
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(express.json({ limit: '50kb' }))

let dbInitialized = false

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase()
    dbInitialized = true
  }
}

app.use(async (req, res, next) => {
  await ensureDbInitialized()
  next()
})

const chatMessageLimiter = createRateLimiter({
  windowMs: 1000 * 60 * 10,
  max: 10,
  keyPrefix: 'chat-message',
})

const adminLoginLimiter = createRateLimiter({
  windowMs: 1000 * 60 * 15,
  max: 8,
  keyPrefix: 'admin-login',
})

const contactFormLimiter = createRateLimiter({
  windowMs: 1000 * 60 * 10,
  max: 8,
  keyPrefix: 'contact-form',
})

const memberAuthLimiter = createRateLimiter({
  windowMs: 1000 * 60 * 15,
  max: 12,
  keyPrefix: 'member-auth',
})

app.post('/api/chat/message', chatMessageLimiter, async (req, res) => {
  try {
    const { visitorName, visitorEmail, visitorMessage } = req.body

    if (!visitorName || !visitorEmail || !visitorMessage) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const result = await saveMessage(visitorName, visitorEmail, visitorMessage)

    const telegramText = `<b>🚨 New Website Chat!</b>\n\n<b>From:</b> ${visitorName}\n<b>Message:</b> ${visitorMessage}\n\n<i>MessageID: ${result.id}</i>\n\n(Reply directly to this message to text them back on the website)`;
    await sendTelegramMessage(telegramText);

    res.json({ success: true, messageId: result.id })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to save message' })
  }
})

app.get('/api/chat/message/:messageId', async (req, res) => {
  try {
    const data = await getMessageWithResponses(req.params.messageId)
    if (!data) return res.status(404).json({ error: 'Message not found' })
    res.json(data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch message' })
  }
})

app.post('/api/contact', contactFormLimiter, async (req, res) => {
  try {
    const { name, company, email, teamSize, message } = req.body

    if (!name || !company || !email || !teamSize || !message) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const normalizedMessage = [
      `Company: ${company}`,
      `Team Size: ${teamSize}`,
      '',
      message,
    ].join('\n')

    const savedMessage = await saveMessage(name, email, normalizedMessage)
    await sendNewMessageNotification(name, email, normalizedMessage, savedMessage.id)

    return res.json({ success: true })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to submit inquiry' })
  }
})

app.post('/api/member/register', memberAuthLimiter, async (req, res) => {
  try {
    const { email, password, slug, displayName } = req.body

    if (!email || !password || !slug || !displayName) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const normalizedSlug = normalizeSlug(slug)
    const trimmedName = String(displayName).trim()

    if (!normalizedEmail.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    if (!normalizedSlug || normalizedSlug.length < 3) {
      return res.status(400).json({ error: 'Slug must be at least 3 characters' })
    }

    const existingEmail = await findMemberByEmail(normalizedEmail)
    if (existingEmail) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const existingSlug = await findMemberBySlug(normalizedSlug)
    if (existingSlug) {
      return res.status(409).json({ error: 'This slug is already taken' })
    }

    const salt = crypto.randomBytes(16).toString('hex')
    const passwordHash = hashPassword(password, salt)
    const member = await createMember({
      email: normalizedEmail,
      passwordHash,
      passwordSalt: salt,
      slug: normalizedSlug,
      displayName: trimmedName,
    })

    const token = crypto.randomBytes(32).toString('hex')
    memberSessionTokens.set(token, {
      memberId: member.id,
      expiresAt: Date.now() + TOKEN_TTL_MS,
    })

    return res.json({ success: true, token, slug: normalizedSlug, expiresInSeconds: TOKEN_TTL_MS / 1000 })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to create member account' })
  }
})

app.post('/api/member/login', memberAuthLimiter, async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const member = await findMemberByEmail(normalizedEmail)
    if (!member) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const candidateHash = hashPassword(password, member.passwordSalt)
    if (candidateHash !== member.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = crypto.randomBytes(32).toString('hex')
    memberSessionTokens.set(token, {
      memberId: member.id,
      expiresAt: Date.now() + TOKEN_TTL_MS,
    })

    return res.json({ success: true, token, slug: member.slug, expiresInSeconds: TOKEN_TTL_MS / 1000 })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to log in' })
  }
})

app.get('/api/member/session', authenticateMember, async (req, res) => {
  try {
    const profile = await getMemberProfileById(req.memberId)
    if (!profile) {
      return res.status(404).json({ error: 'Member not found' })
    }

    return res.json({ success: true, slug: profile.slug })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to verify member session' })
  }
})

app.get('/api/member/profile', authenticateMember, async (req, res) => {
  try {
    const profile = await getMemberProfileById(req.memberId)
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    return res.json(profile)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

app.put('/api/member/profile', authenticateMember, async (req, res) => {
  try {
    const { displayName, headline, subheadline, avatarSrc, links } = req.body

    if (!displayName || !Array.isArray(links)) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const cleanLinks = links
      .map((link) => ({
        label: String(link.label || '').trim(),
        href: String(link.href || '').trim(),
      }))
      .filter((link) => link.label && link.href)
      .slice(0, 8)

    await updateMemberProfile(req.memberId, {
      displayName: String(displayName).trim(),
      headline: String(headline || '').trim(),
      subheadline: String(subheadline || '').trim(),
      avatarSrc: String(avatarSrc || '').trim() || '/auralogo.png',
    })

    await replaceMemberLinks(req.memberId, cleanLinks)

    const updated = await getMemberProfileById(req.memberId)
    return res.json({ success: true, profile: updated })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to update profile' })
  }
})

app.get('/api/public/profile/:slug', async (req, res) => {
  try {
    const slug = normalizeSlug(req.params.slug)
    if (!slug) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    const profile = await getPublicProfileBySlug(slug)
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    return res.json(profile)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to load public profile' })
  }
})

app.post('/api/admin/login', adminLoginLimiter, async (req, res) => {
  try {
    const { password } = req.body

    if (!ADMIN_PASSWORD) {
      return res.status(503).json({ error: 'Admin login is not configured' })
    }

    if (!password || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid admin credentials' })
    }

    const token = crypto.randomBytes(32).toString('hex')
    sessionTokens.set(token, Date.now() + TOKEN_TTL_MS)

    return res.json({
      success: true,
      token,
      expiresInSeconds: TOKEN_TTL_MS / 1000,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Admin login failed' })
  }
})

app.get('/api/admin/session', authenticateAdmin, (req, res) => {
  res.json({ success: true })
})

app.get('/api/admin/messages/unread', authenticateAdmin, async (req, res) => {
  try {
    const messages = await getUnreadMessages()
    res.json(messages)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

app.get('/api/admin/messages', authenticateAdmin, async (req, res) => {
  try {
    const messages = await getAllMessages()
    res.json(messages)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

app.get('/api/admin/message/:messageId', authenticateAdmin, async (req, res) => {
  try {
    const data = await getMessageWithResponses(req.params.messageId)
    if (!data) return res.status(404).json({ error: 'Message not found' })
    res.json(data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch message' })
  }
})

app.post('/api/admin/response', authenticateAdmin, async (req, res) => {
  try {
    const { messageId, adminResponse } = req.body

    if (!messageId || !adminResponse) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const message = await getMessageWithResponses(messageId)
    if (!message) return res.status(404).json({ error: 'Message not found' })

    await saveResponse(messageId, adminResponse)

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to save response' })
  }
})

app.post('/api/admin/message/:messageId/read', authenticateAdmin, async (req, res) => {
  try {
    await markMessageAsRead(req.params.messageId)
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update message' })
  }
})

app.delete('/api/admin/message/:messageId', authenticateAdmin, async (req, res) => {
  try {
    const result = await deleteMessageThread(req.params.messageId)

    if (!result.deleted) {
      return res.status(404).json({ error: 'Message not found' })
    }

    return res.json({ success: true })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to delete message' })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', allowedOrigins })
})

exports.api = functions.https.onRequest(app)

let telegramPollingStarted = false

async function startTelegramPolling() {
  if (telegramPollingStarted) return
  telegramPollingStarted = true

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  if (!BOT_TOKEN) return
  
  let offset = 0
  console.log('Started Telegram Listener...')

  setInterval(async () => {
    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=10`)
      const data = await res.json()
      
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1
          
          if (update.message && update.message.reply_to_message) {
            const adminReply = update.message.text
            const originalText = update.message.reply_to_message.text
            
            const match = originalText.match(/MessageID: (\d+)/)
            if (match && match[1]) {
              const messageId = parseInt(match[1])
              await saveResponse(messageId, adminReply)
              console.log(`Saved Telegram reply to Database for MessageID: ${messageId}`)
              await sendTelegramMessage(`✅ Reply sent to visitor.`)
            }
          }
        }
      }
    } catch (e) {
      // Ignore network timeouts
    }
  }, 3000)
}

startTelegramPolling()
