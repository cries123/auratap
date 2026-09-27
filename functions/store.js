import { initializeApp, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { ValidationError, hashToken, newToken } from './validation.js'
import { MAX_SLUG_ALIASES } from './config.js'

if (!getApps().length) {
  initializeApp()
}

export const db = getFirestore()
export const auth = getAuth()

// Collections:
//   users/{uid}                 member profiles (Aura platform format; accounts live in Firebase Auth)
//   usernames/{handle}          { uid, claimedAt } tap links; old links stay pointed at the member
//   sessions/{sha256(token)}    { type: 'admin', expiresAt } admin panel logins
//   messages/{id}               chat + contact form threads, replies in messages/{id}/responses
//   rateLimits/{sha256(key)}    { count, windowStart, expiresAt }
const users = db.collection('users')
const usernames = db.collection('usernames')
const sessions = db.collection('sessions')
const messages = db.collection('messages')
const rateLimits = db.collection('rateLimits')

const toIso = (value) => (value instanceof Timestamp ? value.toDate().toISOString() : value || null)
const nowIso = () => new Date().toISOString()

// ─── Rate limiting (shared across all function instances) ───

export async function hitRateLimit(key, { max, windowMs }) {
  const ref = rateLimits.doc(hashToken(key))
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const now = Date.now()
    const data = snap.exists ? snap.data() : null
    if (!data || now - data.windowStart >= windowMs) {
      tx.set(ref, { count: 1, windowStart: now, expiresAt: Timestamp.fromMillis(now + windowMs) })
      return false
    }
    if (data.count >= max) {
      return true
    }
    tx.update(ref, { count: data.count + 1 })
    return false
  })
}

// ─── Member profiles (users/{uid}) ───

// Fields shown on a public tap page. Everything else on the user document (email, role,
// affiliate data, ...) stays private and is never overwritten by the new portal.
function toPublicProfile(data) {
  return {
    username: data.username || '',
    displayName: data.displayName || '',
    jobTitle: data.jobTitle || '',
    location: data.location || '',
    bio: data.bio || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    avatarUrl: data.avatarUrl || '',
    bannerUrl: data.bannerUrl || '',
    links: Array.isArray(data.links) ? data.links : [],
  }
}

function toOwnProfile(uid, data) {
  return { uid, email: data.email || '', ...toPublicProfile(data) }
}

// Members who signed up on the original Aura app may not have a profile document yet.
// Create the same starter document that app created on first login.
export async function ensureUserDoc(uid, email) {
  const ref = users.doc(uid)
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) {
      tx.set(ref, { uid, email: email || '', role: 'user', createdAt: nowIso() })
    }
  })
  return getUserProfile(uid)
}

export async function getUserProfile(uid) {
  const snap = await users.doc(uid).get()
  return snap.exists ? toOwnProfile(uid, snap.data()) : null
}

export async function updateUserProfile(uid, fields) {
  await users.doc(uid).update({ ...fields, updatedAt: nowIso() })
  return getUserProfile(uid)
}

// A handle is free if nobody holds it, or if its owner's profile no longer exists
// (the original app treated those as stale and let them be reclaimed).
async function handleOwner(tx, handle) {
  const snap = await tx.get(usernames.doc(handle))
  if (!snap.exists) return null
  const ownerUid = snap.data().uid
  const ownerSnap = ownerUid ? await tx.get(users.doc(ownerUid)) : null
  return ownerSnap?.exists ? ownerUid : null
}

export async function isUsernameAvailable(handle) {
  return db.runTransaction(async (tx) => (await handleOwner(tx, handle)) === null)
}

// Claims `handle` for the member and makes it their current tap link. Previous handles keep
// pointing at the member so cards already programmed with them keep working.
export async function claimUsername(uid, handle) {
  await db.runTransaction(async (tx) => {
    const owner = await handleOwner(tx, handle)
    if (owner && owner !== uid) {
      throw new ValidationError('That link is already taken. Please choose another.', 409)
    }
    if (owner !== uid) {
      const ownedSnap = await tx.get(usernames.where('uid', '==', uid))
      if (ownedSnap.size >= MAX_SLUG_ALIASES) {
        throw new ValidationError('You have changed your link too many times. Contact support for help.', 429)
      }
      tx.set(usernames.doc(handle), { uid, claimedAt: nowIso() })
    }
    tx.update(users.doc(uid), { username: handle, updatedAt: nowIso() })
  })
  return getUserProfile(uid)
}

export async function getPublicProfileByHandle(handle) {
  const handleSnap = await usernames.doc(handle).get()
  if (!handleSnap.exists) return null
  const userSnap = await users.doc(handleSnap.data().uid).get()
  if (!userSnap.exists) return null
  const profile = toPublicProfile(userSnap.data())
  // Profiles whose username field was never filled in still answer on the handle they own.
  return { ...profile, username: profile.username || handle }
}

// ─── Admin sessions ───

export async function createSession({ type, ttlMs }) {
  const token = newToken()
  await sessions.doc(hashToken(token)).set({
    type,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + ttlMs),
  })
  return token
}

export async function getSession(token, type) {
  if (!token) return null
  const ref = sessions.doc(hashToken(token))
  const snap = await ref.get()
  if (!snap.exists) return null
  const session = snap.data()
  if (session.type !== type) return null
  if (session.expiresAt.toMillis() <= Date.now()) {
    await ref.delete()
    return null
  }
  return session
}

export async function deleteSession(token) {
  if (token) await sessions.doc(hashToken(token)).delete()
}

// ─── Chat + contact messages ───

function toMessage(snap) {
  const data = snap.data()
  return {
    id: snap.id,
    visitorName: data.visitorName,
    visitorEmail: data.visitorEmail,
    visitorMessage: data.visitorMessage,
    status: data.status,
    responseCount: data.responseCount || 0,
    createdAt: toIso(data.createdAt),
  }
}

export async function saveMessage(visitorName, visitorEmail, visitorMessage) {
  const ref = await messages.add({
    visitorName,
    visitorEmail,
    visitorMessage,
    status: 'unread',
    responseCount: 0,
    createdAt: FieldValue.serverTimestamp(),
  })
  return { id: ref.id, status: 'unread' }
}

export async function getAllMessages() {
  const snap = await messages.orderBy('createdAt', 'desc').limit(500).get()
  return snap.docs.map(toMessage)
}

export async function getUnreadMessages() {
  const all = await getAllMessages()
  return all.filter((message) => message.status === 'unread')
}

export async function getMessageWithResponses(messageId) {
  const ref = messages.doc(String(messageId))
  const [snap, responsesSnap] = await Promise.all([ref.get(), ref.collection('responses').orderBy('createdAt', 'asc').get()])
  if (!snap.exists) return null
  return {
    ...toMessage(snap),
    responses: responsesSnap.docs.map((doc) => ({
      id: doc.id,
      adminResponse: doc.data().adminResponse,
      createdAt: toIso(doc.data().createdAt),
    })),
  }
}

export async function saveResponse(messageId, adminResponse) {
  const ref = messages.doc(String(messageId))
  const responseRef = ref.collection('responses').doc()
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw new ValidationError('Message not found', 404)
    tx.set(responseRef, { adminResponse, createdAt: FieldValue.serverTimestamp() })
    tx.update(ref, { status: 'responded', responseCount: FieldValue.increment(1) })
  })
  return { id: responseRef.id }
}

export async function markMessageAsRead(messageId) {
  const ref = messages.doc(String(messageId))
  const snap = await ref.get()
  if (snap.exists && snap.data().status === 'unread') {
    await ref.update({ status: 'read' })
  }
}

export async function deleteMessageThread(messageId) {
  const ref = messages.doc(String(messageId))
  const snap = await ref.get()
  if (!snap.exists) return { deleted: false }
  await db.recursiveDelete(ref)
  return { deleted: true }
}
