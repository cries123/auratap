import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { ValidationError, hashToken, newToken } from './validation.js'
import { MAX_SLUG_ALIASES } from './config.js'

if (!getApps().length) {
  initializeApp()
}

export const db = getFirestore()

// Collections:
//   members/{memberId}          profile, password hash, contact card fields, buttons
//   emails/{email}              { memberId } keeps emails unique
//   slugs/{slug}                { memberId } current link plus old links, so printed cards keep working
//   sessions/{sha256(token)}    { type: 'member' | 'admin', memberId, expiresAt }
//   passwordResets/{sha256(t)}  { memberId, expiresAt }
//   messages/{id}               chat + contact form threads, replies in messages/{id}/responses
//   rateLimits/{sha256(key)}    { count, windowStart }
const members = db.collection('members')
const emails = db.collection('emails')
const slugs = db.collection('slugs')
const sessions = db.collection('sessions')
const passwordResets = db.collection('passwordResets')
const messages = db.collection('messages')
const rateLimits = db.collection('rateLimits')

const toIso = (value) => (value instanceof Timestamp ? value.toDate().toISOString() : value || null)

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

export async function clearRateLimit(key) {
  await rateLimits.doc(hashToken(key)).delete()
}

// ─── Members ───

function toPrivateProfile(id, data) {
  return {
    id,
    email: data.email,
    slug: data.slug,
    displayName: data.displayName || '',
    headline: data.headline || '',
    subheadline: data.subheadline || '',
    avatarSrc: data.avatarSrc || '',
    phone: data.phone || '',
    contactEmail: data.contactEmail || '',
    company: data.company || '',
    jobTitle: data.jobTitle || '',
    links: Array.isArray(data.links) ? data.links : [],
  }
}

function toPublicProfile(data) {
  const { id: _id, email: _email, ...profile } = toPrivateProfile('', data)
  return profile
}

export async function createMember({ email, passwordHash, passwordSalt, slug, displayName }) {
  const memberRef = members.doc()
  await db.runTransaction(async (tx) => {
    const [emailSnap, slugSnap] = await Promise.all([tx.get(emails.doc(email)), tx.get(slugs.doc(slug))])
    if (emailSnap.exists) {
      throw new ValidationError('An account with this email already exists. Try logging in instead.', 409)
    }
    if (slugSnap.exists) {
      throw new ValidationError('That link is already taken. Please choose another.', 409)
    }
    tx.set(memberRef, {
      email,
      passwordHash,
      passwordSalt,
      slug,
      displayName,
      headline: '',
      subheadline: '',
      avatarSrc: '',
      phone: '',
      contactEmail: email,
      company: '',
      jobTitle: '',
      links: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    tx.set(emails.doc(email), { memberId: memberRef.id })
    tx.set(slugs.doc(slug), { memberId: memberRef.id, createdAt: FieldValue.serverTimestamp() })
  })
  return { id: memberRef.id }
}

export async function findMemberByEmail(email) {
  const emailSnap = await emails.doc(email).get()
  if (!emailSnap.exists) return null
  const memberSnap = await members.doc(emailSnap.data().memberId).get()
  return memberSnap.exists ? { id: memberSnap.id, ...memberSnap.data() } : null
}

export async function getMemberProfile(memberId) {
  const snap = await members.doc(memberId).get()
  return snap.exists ? toPrivateProfile(snap.id, snap.data()) : null
}

export async function updateMemberProfile(memberId, fields) {
  await members.doc(memberId).update({ ...fields, updatedAt: FieldValue.serverTimestamp() })
  return getMemberProfile(memberId)
}

export async function updateMemberPassword(memberId, { passwordHash, passwordSalt }) {
  await members.doc(memberId).update({ passwordHash, passwordSalt, updatedAt: FieldValue.serverTimestamp() })
}

// The old link stays pointed at the member so cards already programmed with it keep working.
export async function changeMemberSlug(memberId, newSlug) {
  const memberRef = members.doc(memberId)
  await db.runTransaction(async (tx) => {
    const [memberSnap, slugSnap, ownedSnap] = await Promise.all([
      tx.get(memberRef),
      tx.get(slugs.doc(newSlug)),
      tx.get(slugs.where('memberId', '==', memberId)),
    ])
    if (!memberSnap.exists) throw new ValidationError('Account not found.', 404)
    if (memberSnap.data().slug === newSlug) return
    const ownsSlug = slugSnap.exists && slugSnap.data().memberId === memberId
    if (slugSnap.exists && !ownsSlug) {
      throw new ValidationError('That link is already taken. Please choose another.', 409)
    }
    if (!ownsSlug && ownedSnap.size >= MAX_SLUG_ALIASES) {
      throw new ValidationError('You have changed your link too many times. Contact support for help.', 429)
    }
    if (!ownsSlug) {
      tx.set(slugs.doc(newSlug), { memberId, createdAt: FieldValue.serverTimestamp() })
    }
    tx.update(memberRef, { slug: newSlug, updatedAt: FieldValue.serverTimestamp() })
  })
  return getMemberProfile(memberId)
}

export async function getPublicProfileBySlug(slug) {
  const slugSnap = await slugs.doc(slug).get()
  if (!slugSnap.exists) return null
  const memberSnap = await members.doc(slugSnap.data().memberId).get()
  return memberSnap.exists ? toPublicProfile(memberSnap.data()) : null
}

// ─── Sessions ───

export async function createSession({ type, memberId = null, ttlMs }) {
  const token = newToken()
  await sessions.doc(hashToken(token)).set({
    type,
    memberId,
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

export async function deleteMemberSessions(memberId) {
  const snap = await sessions.where('memberId', '==', memberId).get()
  const batch = db.batch()
  snap.forEach((doc) => batch.delete(doc.ref))
  await batch.commit()
}

// ─── Password resets ───

export async function createPasswordReset(memberId, ttlMs) {
  const token = newToken()
  await passwordResets.doc(hashToken(token)).set({
    memberId,
    expiresAt: Timestamp.fromMillis(Date.now() + ttlMs),
  })
  return token
}

// Returns the member id and deletes the token, so each reset link works once.
export async function consumePasswordReset(token) {
  const ref = passwordResets.doc(hashToken(token))
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) return null
    tx.delete(ref)
    const { memberId, expiresAt } = snap.data()
    return expiresAt.toMillis() > Date.now() ? memberId : null
  })
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
