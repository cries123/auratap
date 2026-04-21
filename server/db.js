import sqlite3 from 'sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, 'chat.db')

const db = new sqlite3.Database(dbPath)

export function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Chat messages table
      db.run(
        `CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          visitorName TEXT,
          visitorEmail TEXT,
          visitorMessage TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'unread'
        )`,
        (err) => {
          if (err) reject(err)
        }
      )

      // Admin responses table
      db.run(
        `CREATE TABLE IF NOT EXISTS responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          messageId INTEGER NOT NULL,
          adminResponse TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (messageId) REFERENCES messages(id)
        )`,
        (err) => {
          if (err) reject(err)
          else resolve()
        }
      )
    })
  })
}

export function saveMessage(visitorName, visitorEmail, visitorMessage) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO messages (visitorName, visitorEmail, visitorMessage) VALUES (?, ?, ?)`,
      [visitorName, visitorEmail, visitorMessage],
      function (err) {
        if (err) reject(err)
        else resolve({ id: this.lastID, status: 'unread' })
      }
    )
  })
}

export function getUnreadMessages() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT m.*, COUNT(r.id) as responseCount FROM messages m 
       LEFT JOIN responses r ON m.id = r.messageId 
       WHERE m.status = 'unread' 
       GROUP BY m.id 
       ORDER BY m.createdAt DESC`,
      (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      }
    )
  })
}

export function getAllMessages() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT m.*, COUNT(r.id) as responseCount FROM messages m 
       LEFT JOIN responses r ON m.id = r.messageId 
       GROUP BY m.id 
       ORDER BY m.createdAt DESC`,
      (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      }
    )
  })
}

export function getMessageWithResponses(messageId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM messages WHERE id = ?`,
      [messageId],
      (err, message) => {
        if (err) reject(err)
        else {
          if (!message) {
            resolve(null)
            return
          }

          db.all(
            `SELECT * FROM responses WHERE messageId = ? ORDER BY createdAt ASC`,
            [messageId],
            (err, responses) => {
              if (err) reject(err)
              else resolve({ ...message, responses: responses || [] })
            }
          )
        }
      }
    )
  })
}

export function saveResponse(messageId, adminResponse) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO responses (messageId, adminResponse) VALUES (?, ?)`,
      [messageId, adminResponse],
      function (err) {
        if (err) reject(err)
        else {
          // Mark message as read
          db.run(`UPDATE messages SET status = 'responded' WHERE id = ?`, [messageId], (err) => {
            if (err) reject(err)
            else resolve({ id: this.lastID })
          })
        }
      }
    )
  })
}

export function markMessageAsRead(messageId) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE messages SET status = 'read' WHERE id = ?`,
      [messageId],
      (err) => {
        if (err) reject(err)
        else resolve()
      }
    )
  })
}

export function deleteMessageThread(messageId) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`DELETE FROM responses WHERE messageId = ?`, [messageId], (responseErr) => {
        if (responseErr) {
          reject(responseErr)
          return
        }

        db.run(`DELETE FROM messages WHERE id = ?`, [messageId], function (messageErr) {
          if (messageErr) {
            reject(messageErr)
            return
          }

          resolve({ deleted: this.changes > 0 })
        })
      })
    })
  })
}

export default db
