// End-to-end API tests. Run with `npm test` in functions/ (starts the Auth, Functions, and Firestore
// emulators for the offline "demo-auratap" project, whose test settings live in functions/.env.demo-auratap).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

const PROJECT = 'demo-auratap'
const API = `http://127.0.0.1:5001/${PROJECT}/us-central1/apiV2`
const FIRESTORE = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`
const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1'
const run = crypto.randomBytes(4).toString('hex')

async function call(method, path, { body, token, headers = {} } = {}) {
  const response = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }
  return { status: response.status, json, text, headers: response.headers }
}

// Creates a Firebase Auth user in the emulator and returns { uid, token }.
async function firebaseUser(name) {
  const response = await fetch(`${AUTH}/accounts:signUp?key=fake-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `${name}-${run}@test.dev`, password: 'correct horse battery', returnSecureToken: true }),
  })
  const data = await response.json()
  assert.ok(data.idToken, JSON.stringify(data))
  return { uid: data.localId, token: data.idToken, email: `${name}-${run}@test.dev` }
}

// Writes a document straight into the Firestore emulator (bypassing rules), like data the
// original Aura app already stored.
function toFirestoreValue(value) {
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } }
  if (value && typeof value === 'object') {
    return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toFirestoreValue(v)])) } }
  }
  if (typeof value === 'number') return { integerValue: String(value) }
  return { stringValue: String(value) }
}
async function seed(path, data) {
  const response = await fetch(`${FIRESTORE}/${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, toFirestoreValue(v)])) }),
  })
  assert.equal(response.status, 200, await response.text())
}
async function readDoc(path) {
  const response = await fetch(`${FIRESTORE}/${path}`, { headers: { Authorization: 'Bearer owner' } })
  return response.status === 200 ? (await response.json()).fields : null
}

// Each setup call presents its own visitor address so the per-address limit doesn't interfere.
let fakeIp = 0
const setup = (user, body) => {
  fakeIp += 1
  return call('POST', '/api/member/setup', { token: user.token, body, headers: { 'X-Forwarded-For': `198.51.100.${fakeIp}` } })
}

test('username availability checks format, reserved names, and taken links', async () => {
  const reserved = await call('GET', '/api/public/username/pricing')
  assert.equal(reserved.json.available, false)
  assert.match(reserved.json.reason, /reserved/)
  assert.equal((await call('GET', '/api/public/username/has%20space')).json.available, false)
  assert.equal((await call('GET', `/api/public/username/free-${run}`)).json.available, true)
})

test('new members sign up with Firebase, then claim a link', async () => {
  const user = await firebaseUser('newbie')
  const done = await setup(user, { displayName: 'New Member', username: `newbie-${run}` })
  assert.equal(done.status, 200, done.text)
  assert.equal(done.json.profile.username, `newbie-${run}`)
  assert.equal(done.json.profile.displayName, 'New Member')

  const stored = await readDoc(`users/${user.uid}`)
  assert.equal(stored.role.stringValue, 'user')
  assert.equal(stored.email.stringValue, user.email)

  const other = await firebaseUser('copycat')
  assert.equal((await setup(other, { displayName: 'Copy Cat', username: `newbie-${run}` })).status, 409)
  assert.equal((await call('GET', `/api/public/username/newbie-${run}`)).json.available, false)

  assert.equal((await call('GET', '/api/member/profile', { token: 'not-a-real-token' })).status, 401)
  assert.equal((await call('GET', '/api/member/profile')).status, 401)
})

test("existing Aura members' tap pages, contact cards, and data keep working", async () => {
  const user = await firebaseUser('legacy')
  const handle = `legacy_${run}`
  await seed(`users/${user.uid}`, {
    uid: user.uid,
    email: user.email,
    role: 'affiliate',
    createdAt: '2026-05-22T22:30:03.243Z',
    username: handle,
    displayName: 'Legacy Member',
    jobTitle: 'Broker',
    location: 'San Luis Obispo',
    bio: 'Old bio',
    tags: ['realtor', 'slo'],
    // Values the original app allowed but the new portal wouldn't accept as new input.
    avatarUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
    bannerUrl: 'data:image/jpeg;base64,/9j/BBBB',
    discountCode: 'WX7A9VC',
    links: [
      { type: 'phone', label: 'Call', value: '805-555-0101' },
      { type: 'email', label: 'Email', value: 'legacy@example.com' },
      { type: 'instagram', label: 'Instagram', value: 'instagram.com/legacy' },
      { type: 'phone', label: 'Office', value: 'ext 2 at front desk' },
    ],
  })
  await seed(`usernames/${handle}`, { uid: user.uid, claimedAt: '2026-05-22T18:54:06.960Z' })

  const profile = await call('GET', `/api/public/profile/${handle.toUpperCase()}`)
  assert.equal(profile.status, 200, profile.text)
  assert.equal(profile.json.displayName, 'Legacy Member')
  assert.deepEqual(profile.json.tags, ['realtor', 'slo'])
  assert.equal(profile.json.links.length, 4)
  for (const hidden of ['email', 'role', 'uid', 'discountCode']) assert.equal(profile.json[hidden], undefined)

  const vcard = await call('GET', `/api/public/profile/${handle}/vcard`)
  assert.match(vcard.headers.get('content-type'), /text\/vcard/)
  assert.match(vcard.text, /FN:Legacy Member/)
  assert.match(vcard.text, /TEL;TYPE=CELL:805-555-0101/)
  assert.match(vcard.text, /EMAIL;TYPE=INTERNET:legacy@example.com/)
  assert.match(vcard.text, /URL:https:\/\/instagram.com\/legacy/)

  // The member logs in to the new portal with their existing Firebase account and saves.
  const mine = await call('GET', '/api/member/profile', { token: user.token })
  assert.equal(mine.json.username, handle)
  const saved = await call('PUT', '/api/member/profile', {
    token: user.token,
    body: { ...mine.json, bio: 'New bio', links: [...mine.json.links, { type: 'website', label: 'Site', value: 'example.com' }] },
  })
  assert.equal(saved.status, 200, saved.text)
  const stored = await readDoc(`users/${user.uid}`)
  assert.equal(stored.bio.stringValue, 'New bio')
  assert.equal(stored.role.stringValue, 'affiliate')
  assert.equal(stored.discountCode.stringValue, 'WX7A9VC')
  assert.equal(stored.createdAt.stringValue, '2026-05-22T22:30:03.243Z')
  // Unchanged legacy values were kept as-is; the new button was added.
  assert.equal(stored.avatarUrl.stringValue, 'data:image/svg+xml;base64,PHN2Zy8+')
  assert.equal(stored.links.arrayValue.values.length, 5)

  // New input still gets validated.
  const newSvg = await call('PUT', '/api/member/profile', { token: user.token, body: { ...saved.json.profile, avatarUrl: 'data:image/svg+xml;base64,PHN2ZyAvPg==' } })
  assert.equal(newSvg.status, 400)
})

test('first portal visit creates the starter profile the original app would have', async () => {
  const user = await firebaseUser('firstvisit')
  const profile = await call('GET', '/api/member/profile', { token: user.token })
  assert.equal(profile.status, 200, profile.text)
  assert.equal(profile.json.username, '')
  const stored = await readDoc(`users/${user.uid}`)
  assert.equal(stored.role.stringValue, 'user')
  assert.ok(stored.createdAt.stringValue)
})

test('profile validation rejects unsafe links and oversized photos', async () => {
  const user = await firebaseUser('validate')
  await setup(user, { displayName: 'Val Idate', username: `validate-${run}` })
  const base = { displayName: 'Val Idate', links: [] }

  for (const value of ['javascript:alert(1)', 'data:text/html,<b>x</b>']) {
    const bad = await call('PUT', '/api/member/profile', { token: user.token, body: { ...base, links: [{ type: 'website', label: 'Bad', value }] } })
    assert.equal(bad.status, 400, `${value} should be rejected`)
  }
  const badPhone = await call('PUT', '/api/member/profile', { token: user.token, body: { ...base, links: [{ type: 'phone', label: 'Call', value: 'call me maybe' }] } })
  assert.equal(badPhone.status, 400)
  const tooMany = await call('PUT', '/api/member/profile', {
    token: user.token,
    body: { ...base, links: Array.from({ length: 13 }, (_, i) => ({ type: 'website', label: `L${i}`, value: 'a.co' })) },
  })
  assert.equal(tooMany.status, 400)
  const bigPhoto = await call('PUT', '/api/member/profile', { token: user.token, body: { ...base, avatarUrl: 'data:image/jpeg;base64,' + 'A'.repeat(400_000) } })
  assert.equal(bigPhoto.status, 400)
  assert.match(bigPhoto.json.error, /too large/)
  assert.equal((await call('PUT', '/api/member/profile', { token: user.token, body: { ...base, displayName: 'A'.repeat(500) } })).status, 400)
})

test('changing the link keeps the old one working, and stale handles can be reclaimed', async () => {
  const user = await firebaseUser('mover')
  await setup(user, { displayName: 'Mo Ver', username: `oldlink-${run}` })
  const moved = await call('PUT', '/api/member/username', { token: user.token, body: { username: `newlink-${run}` } })
  assert.equal(moved.status, 200, moved.text)
  assert.equal(moved.json.profile.username, `newlink-${run}`)

  const viaOld = await call('GET', `/api/public/profile/oldlink-${run}`)
  assert.equal(viaOld.status, 200)
  assert.equal(viaOld.json.username, `newlink-${run}`)

  // A handle whose owner's profile no longer exists is free again.
  await seed(`usernames/stale-${run}`, { uid: 'deleted-user', claimedAt: '2026-01-01T00:00:00.000Z' })
  assert.equal((await call('PUT', '/api/member/username', { token: user.token, body: { username: `stale-${run}` } })).status, 200)
  assert.equal((await call('PUT', '/api/member/username', { token: user.token, body: { username: 'admin' } })).status, 400)
})

test('link setups from one address are rate limited, including through Netlify', async () => {
  const users = await Promise.all(Array.from({ length: 32 }, (_, i) => firebaseUser(`bulk${i}`)))
  const statuses = []
  for (let i = 0; i < 31; i++) {
    const res = await call('POST', '/api/member/setup', {
      token: users[i].token,
      body: { displayName: 'Bulk', username: `bulk${i}-${run}` },
      headers: { 'X-Nf-Client-Connection-Ip': '203.0.113.7', 'X-Forwarded-For': '10.0.0.1' },
    })
    statuses.push(res.status)
  }
  assert.equal(statuses.filter((status) => status === 200).length, 30)
  assert.equal(statuses.at(-1), 429)
  const other = await call('POST', '/api/member/setup', {
    token: users[31].token,
    body: { displayName: 'Bulk', username: `bulk31-${run}` },
    headers: { 'X-Nf-Client-Connection-Ip': '203.0.113.8', 'X-Forwarded-For': '10.0.0.1' },
  })
  assert.equal(other.status, 200)
})

test('chat threads, admin replies, and the Telegram webhook', async () => {
  const sent = await call('POST', '/api/chat/message', {
    body: { visitorName: 'Visitor <b>', visitorEmail: 'visitor@example.com', visitorMessage: 'Hi there' },
  })
  assert.equal(sent.status, 200)
  const { messageId } = sent.json
  assert.equal(typeof messageId, 'string')

  const publicThread = await call('GET', `/api/chat/message/${messageId}`)
  assert.equal(publicThread.status, 200)
  assert.equal(publicThread.json.visitorEmail, undefined)

  assert.equal((await call('POST', '/api/admin/login', { body: { password: 'wrong' } })).status, 401)
  const admin = await call('POST', '/api/admin/login', { body: { password: 'test-admin-password' } })
  assert.equal(admin.status, 200)
  const adminToken = admin.json.token

  const list = await call('GET', '/api/admin/messages', { token: adminToken })
  assert.ok(list.json.some((m) => m.id === messageId && m.visitorEmail === 'visitor@example.com'))

  assert.equal((await call('POST', '/api/admin/response', { token: adminToken, body: { messageId, adminResponse: 'Hello!' } })).status, 200)

  const webhookUpdate = {
    message: {
      chat: { id: 424242 },
      text: 'Replying from Telegram',
      reply_to_message: { chat: { id: 424242 }, text: `New website chat\n\nMessageID: ${messageId}` },
    },
  }
  assert.equal((await call('POST', '/api/telegram/webhook', { body: webhookUpdate })).status, 404)
  const hook = await call('POST', '/api/telegram/webhook', {
    body: webhookUpdate,
    headers: { 'X-Telegram-Bot-Api-Secret-Token': 'test-webhook-secret' },
  })
  assert.equal(hook.status, 200)

  const thread = await call('GET', `/api/chat/message/${messageId}`)
  assert.deepEqual(thread.json.responses.map((r) => r.adminResponse), ['Hello!', 'Replying from Telegram'])

  assert.equal((await call('DELETE', `/api/admin/message/${messageId}`, { token: adminToken })).status, 200)
  assert.equal((await call('GET', `/api/chat/message/${messageId}`)).status, 404)

  assert.equal((await call('POST', '/api/admin/logout', { token: adminToken })).status, 200)
  assert.equal((await call('GET', '/api/admin/session', { token: adminToken })).status, 401)
})
