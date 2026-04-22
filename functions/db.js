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
          if (err) {
            reject(err)
            return
          }

          db.run(
            `CREATE TABLE IF NOT EXISTS members (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              email TEXT NOT NULL UNIQUE,
              passwordHash TEXT NOT NULL,
              passwordSalt TEXT NOT NULL,
              slug TEXT NOT NULL UNIQUE,
              displayName TEXT NOT NULL,
              headline TEXT DEFAULT '',
              subheadline TEXT DEFAULT '',
              avatarSrc TEXT DEFAULT '',
              createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
              updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            (memberErr) => {
              if (memberErr) {
                reject(memberErr)
                return
              }

              db.run(
                `CREATE TABLE IF NOT EXISTS member_links (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  memberId INTEGER NOT NULL,
                  label TEXT NOT NULL,
                  href TEXT NOT NULL,
                  sortOrder INTEGER DEFAULT 0,
                  FOREIGN KEY (memberId) REFERENCES members(id)
                )`,
                (linksErr) => {
                  if (linksErr) {
                    reject(linksErr)
                    return
                  }

                  resolve()
                }
              )
            }
          )
        }
      )
    })
  })
}

export function createMember({ email, passwordHash, passwordSalt, slug, displayName }) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `INSERT INTO members (email, passwordHash, passwordSalt, slug, displayName, headline, subheadline, avatarSrc)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          email,
          passwordHash,
          passwordSalt,
          slug,
          displayName,
          'Tap to connect.',
          'Share your best links instantly.',
          '/auralogo.png',
        ],
        function (memberErr) {
          if (memberErr) {
            reject(memberErr)
            return
          }

          const memberId = this.lastID
          const defaults = [
            ['Book a Consultation', '/contact', 0],
            ['Buy an Aura Tap Card', '/pricing', 1],
            ['Visit Aura Tap', 'https://aurataps.net', 2],
          ]

          let completed = 0
          if (defaults.length === 0) {
            resolve({ id: memberId })
            return
          }

          defaults.forEach(([label, href, sortOrder]) => {
            db.run(
              `INSERT INTO member_links (memberId, label, href, sortOrder) VALUES (?, ?, ?, ?)`,
              [memberId, label, href, sortOrder],
              (linkErr) => {
                if (linkErr) {
                  reject(linkErr)
                  return
                }

                completed += 1
                if (completed === defaults.length) {
                  resolve({ id: memberId })
                }
              }
            )
          })
        }
      )
    })
  })
}

export function findMemberByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM members WHERE email = ?`, [email], (err, row) => {
      if (err) reject(err)
      else resolve(row || null)
    })
  })
}

export function findMemberById(memberId) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM members WHERE id = ?`, [memberId], (err, row) => {
      if (err) reject(err)
      else resolve(row || null)
    })
  })
}

export function findMemberBySlug(slug) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM members WHERE slug = ?`, [slug], (err, row) => {
      if (err) reject(err)
      else resolve(row || null)
    })
  })
}

export function getMemberLinks(memberId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, label, href, sortOrder FROM member_links WHERE memberId = ? ORDER BY sortOrder ASC, id ASC`,
      [memberId],
      (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      }
    )
  })
}

export async function getMemberProfileById(memberId) {
  const member = await findMemberById(memberId)
  if (!member) {
    return null
  }

  const links = await getMemberLinks(memberId)
  return {
    id: member.id,
    email: member.email,
    slug: member.slug,
    displayName: member.displayName,
    headline: member.headline || '',
    subheadline: member.subheadline || '',
    avatarSrc: member.avatarSrc || '',
    links,
  }
}

export async function getPublicProfileBySlug(slug) {
  const member = await findMemberBySlug(slug)
  if (!member) {
    return null
  }

  const links = await getMemberLinks(member.id)
  return {
    slug: member.slug,
    displayName: member.displayName,
    headline: member.headline || '',
    subheadline: member.subheadline || '',
    avatarSrc: member.avatarSrc || '/auralogo.png',
    links,
  }
}

export function updateMemberProfile(memberId, profile) {
  const { displayName, headline, subheadline, avatarSrc } = profile

  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE members
       SET displayName = ?, headline = ?, subheadline = ?, avatarSrc = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [displayName, headline, subheadline, avatarSrc, memberId],
      (err) => {
        if (err) reject(err)
        else resolve()
      }
    )
  })
}

export function replaceMemberLinks(memberId, links) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`DELETE FROM member_links WHERE memberId = ?`, [memberId], (deleteErr) => {
        if (deleteErr) {
          reject(deleteErr)
          return
        }

        if (!links.length) {
          resolve()
          return
        }

        let completed = 0
        links.forEach((link, index) => {
          db.run(
            `INSERT INTO member_links (memberId, label, href, sortOrder) VALUES (?, ?, ?, ?)`,
            [memberId, link.label, link.href, index],
            (insertErr) => {
              if (insertErr) {
                reject(insertErr)
                return
              }

              completed += 1
              if (completed === links.length) {
                resolve()
              }
            }
          )
        })
      })
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
