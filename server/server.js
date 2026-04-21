/* global process */
import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import dotenv from 'dotenv'
import { initializeDatabase, saveMessage, getUnreadMessages, getAllMessages, getMessageWithResponses, saveResponse, markMessageAsRead, deleteMessageThread } from './db.js'
import { sendNewMessageNotification, sendAdminResponseEmail } from './emails.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const sessionTokens = new Map()
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8

function pruneExpiredSessions() {
  const now = Date.now()
  for (const [token, expiresAt] of sessionTokens.entries()) {
    if (expiresAt <= now) {
      sessionTokens.delete(token)
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

// Middleware
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Origin not allowed by CORS'))
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(express.json({ limit: '50kb' }))

// Initialize database on startup
await initializeDatabase()
console.log('Database initialized')

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

// ===== VISITOR ENDPOINTS =====

// Save new chat message from visitor
app.post('/api/chat/message', chatMessageLimiter, async (req, res) => {
  try {
    const { visitorName, visitorEmail, visitorMessage } = req.body

    if (!visitorName || !visitorEmail || !visitorMessage) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const result = await saveMessage(visitorName, visitorEmail, visitorMessage)

    // Send email notification to admin
    await sendNewMessageNotification(visitorName, visitorEmail, visitorMessage, result.id)

    res.json({ success: true, messageId: result.id })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to save message' })
  }
})

// Get message with all responses (for visitor follow-up)
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

// Resend inbound webhook for reply-by-email support.
// ===== ADMIN ENDPOINTS =====

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

// Get all unread messages for admin
app.get('/api/admin/messages/unread', authenticateAdmin, async (req, res) => {
  try {
    const messages = await getUnreadMessages()
    res.json(messages)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// Get all messages for admin
app.get('/api/admin/messages', authenticateAdmin, async (req, res) => {
  try {
    const messages = await getAllMessages()
    res.json(messages)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// Get single message with conversation history
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

// Admin sends response to visitor
app.post('/api/admin/response', authenticateAdmin, async (req, res) => {
  try {
    const { messageId, adminResponse } = req.body

    if (!messageId || !adminResponse) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Get message to find visitor email
    const message = await getMessageWithResponses(messageId)
    if (!message) return res.status(404).json({ error: 'Message not found' })

    // Save response
    await saveResponse(messageId, adminResponse)

    // Send email to visitor
    await sendAdminResponseEmail(message.visitorEmail, message.visitorName, adminResponse)

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to save response' })
  }
})

// Mark message as read
app.post('/api/admin/message/:messageId/read', authenticateAdmin, async (req, res) => {
  try {
    await markMessageAsRead(req.params.messageId)
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update message' })
  }
})

// Delete a message thread (message + all responses)
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', allowedOrigins })
})

app.listen(PORT, () => {
  console.log(`Aura Tap Chat Server running on http://localhost:${PORT}`)
  if (!ADMIN_PASSWORD) {
    console.log('WARNING: ADMIN_PASSWORD is not set. Admin login will be disabled.')
  }
})
