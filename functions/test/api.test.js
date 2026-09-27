// End-to-end API tests. Run with `npm test` in functions/ (starts the Functions + Firestore emulators
// for the offline "demo-auratap" project, whose test settings live in functions/.env.demo-auratap).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

const PROJECT = 'demo-auratap'
const API = `http://127.0.0.1:5001/${PROJECT}/us-central1/api`
const FIRESTORE = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`
const run = crypto.randomBytes(4).toString('hex')

async function call(method, path, { body, token, headers = {} } = {}) {
  const response = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
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

// Sign-ups are limited per visitor IP, so each test sign-up presents its own address.
let fakeIp = 0
async function register(name, overrides = {}) {
  fakeIp += 1
  return call('POST', '/api/member/register', {
    body: { email: `${name}-${run}@test.dev`, password: 'correct horse battery', displayName: 'Test Person', slug: `${name}-${run}`, ...overrides },
    headers: { 'X-Forwarded-For': `198.51.100.${fakeIp}` },
  })
}

const baseProfile = { displayName: 'Jordan Rivera', links: [] }

test('registration validates input and reserves site paths', async () => {
  const ok = await register('reg')
  assert.equal(ok.status, 200)
  assert.ok(ok.json.token)
  assert.equal(ok.json.slug, `reg-${run}`)

  assert.equal((await register('dupe-email', { email: `reg-${run}@test.dev` })).status, 409)
  assert.equal((await register('dupe-slug', { slug: `reg-${run}` })).status, 409)

  const reserved = await register('reserved', { slug: 'pricing' })
  assert.equal(reserved.status, 400)
  assert.match(reserved.json.error, /reserved/)

  assert.equal((await register('short-pass', { password: 'short' })).status, 400)
  assert.equal((await register('bad-email', { email: 'not-an-email' })).status, 400)
})

test('login, session, and logout', async () => {
  await register('login')
  const email = `login-${run}@test.dev`

  const wrong = await call('POST', '/api/member/login', { body: { email, password: 'wrong password' } })
  assert.equal(wrong.status, 401)
  assert.equal(wrong.json.error, 'Incorrect email or password.')

  const unknown = await call('POST', '/api/member/login', { body: { email: `nobody-${run}@test.dev`, password: 'whatever123' } })
  assert.equal(unknown.status, 401)

  const login = await call('POST', '/api/member/login', { body: { email: email.toUpperCase(), password: 'correct horse battery' } })
  assert.equal(login.status, 200)
  const { token } = login.json

  assert.equal((await call('GET', '/api/member/session', { token })).status, 200)
  assert.equal((await call('POST', '/api/member/logout', { token })).status, 200)
  assert.equal((await call('GET', '/api/member/session', { token })).status, 401)
})

test('profile saves realistic photos and validates fields and links', async () => {
  const { token } = (await register('profile')).json

  const photo = 'data:image/jpeg;base64,' + crypto.randomBytes(150 * 1024).toString('base64')
  const saved = await call('PUT', '/api/member/profile', {
    token,
    body: {
      ...baseProfile,
      headline: 'Realtor',
      phone: '(805) 555-1234',
      contactEmail: 'jordan@example.com',
      company: 'Coastal Homes',
      jobTitle: 'Agent',
      avatarSrc: photo,
      links: [
        { label: 'Instagram', href: 'instagram.com/jordan' },
        { label: 'Call', href: 'tel:8055551234' },
        { label: 'Listings', href: '/pricing' },
      ],
    },
  })
  assert.equal(saved.status, 200, saved.text)
  assert.equal(saved.json.profile.avatarSrc.length, photo.length)
  assert.deepEqual(saved.json.profile.links.map((l) => l.href), ['https://instagram.com/jordan', 'tel:8055551234', '/pricing'])

  for (const href of ['javascript:alert(1)', 'data:text/html,<b>x</b>', '//evil.example']) {
    const bad = await call('PUT', '/api/member/profile', { token, body: { ...baseProfile, links: [{ label: 'Bad', href }] } })
    assert.equal(bad.status, 400, `${href} should be rejected`)
  }

  const longName = await call('PUT', '/api/member/profile', { token, body: { ...baseProfile, displayName: 'A'.repeat(20000) } })
  assert.equal(longName.status, 400)

  const tooMany = await call('PUT', '/api/member/profile', {
    token,
    body: { ...baseProfile, links: Array.from({ length: 9 }, (_, i) => ({ label: `L${i}`, href: 'https://a.co' })) },
  })
  assert.equal(tooMany.status, 400)

  const huge = await call('PUT', '/api/member/profile', {
    token,
    body: { ...baseProfile, avatarSrc: 'data:image/jpeg;base64,' + 'A'.repeat(600 * 1024) },
  })
  // Cloud Functions parses request bodies itself (up to 10MB), so size is enforced by photo validation.
  assert.equal(huge.status, 400)
  assert.match(huge.json.error, /too large/)
})

test('public profile hides the login email and offers a contact card', async () => {
  const { token } = (await register('public')).json
  await call('PUT', '/api/member/profile', {
    token,
    body: { ...baseProfile, phone: '805-555-9876', contactEmail: 'hello@example.com', company: 'Acme; Inc', jobTitle: 'Owner' },
  })

  const profile = await call('GET', `/api/public/profile/public-${run}`)
  assert.equal(profile.status, 200)
  assert.equal(profile.json.email, undefined)
  assert.equal(profile.json.id, undefined)
  assert.equal(profile.json.phone, '805-555-9876')

  const vcard = await call('GET', `/api/public/profile/public-${run}/vcard`)
  assert.equal(vcard.status, 200)
  assert.match(vcard.headers.get('content-type'), /text\/vcard/)
  assert.match(vcard.text, /FN:Jordan Rivera/)
  assert.match(vcard.text, /TEL;TYPE=CELL:805-555-9876/)
  assert.match(vcard.text, /ORG:Acme\\; Inc/)

  assert.equal((await call('GET', '/api/public/profile/does-not-exist-anywhere')).status, 404)
})

test('changing the link keeps the old link working', async () => {
  const { token } = (await register('oldlink')).json
  const changed = await call('PUT', '/api/member/slug', { token, body: { slug: `newlink-${run}` } })
  assert.equal(changed.status, 200, changed.text)
  assert.equal(changed.json.profile.slug, `newlink-${run}`)

  const viaOld = await call('GET', `/api/public/profile/oldlink-${run}`)
  assert.equal(viaOld.status, 200)
  assert.equal(viaOld.json.slug, `newlink-${run}`)

  const taken = await call('PUT', '/api/member/slug', { token, body: { slug: `reg-${run}` } })
  assert.equal(taken.status, 409)
  assert.equal((await call('PUT', '/api/member/slug', { token, body: { slug: 'admin' } })).status, 400)
})

test('password reset replaces the password and signs out old sessions', async () => {
  const { token: oldToken } = (await register('reset')).json
  const email = `reset-${run}@test.dev`

  // Unknown and known emails get the same answer.
  assert.equal((await call('POST', '/api/member/password-reset/request', { body: { email: `ghost-${run}@test.dev` } })).status, 200)
  assert.equal((await call('POST', '/api/member/password-reset/request', { body: { email } })).status, 200)

  // The real token only exists in the email, so plant a known one directly in Firestore.
  const memberId = (await call('GET', '/api/member/profile', { token: oldToken })).json.id
  assert.ok(memberId)
  const resetToken = crypto.randomBytes(32).toString('hex')
  const docId = crypto.createHash('sha256').update(resetToken).digest('hex')
  const planted = await fetch(`${FIRESTORE}/passwordResets/${docId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({
      fields: {
        memberId: { stringValue: memberId },
        expiresAt: { timestampValue: new Date(Date.now() + 60_000).toISOString() },
      },
    }),
  })
  assert.equal(planted.status, 200)

  const bad = await call('POST', '/api/member/password-reset/confirm', { body: { token: 'nope', password: 'a brand new password' } })
  assert.equal(bad.status, 400)

  const confirmed = await call('POST', '/api/member/password-reset/confirm', { body: { token: resetToken, password: 'a brand new password' } })
  assert.equal(confirmed.status, 200, confirmed.text)
  assert.ok(confirmed.json.token)

  assert.equal((await call('GET', '/api/member/session', { token: oldToken })).status, 401)
  assert.equal((await call('POST', '/api/member/password-reset/confirm', { body: { token: resetToken, password: 'another password!' } })).status, 400)
  assert.equal((await call('POST', '/api/member/login', { body: { email, password: 'a brand new password' } })).status, 200)
})

// aurataps.net traffic arrives through Netlify's proxy, which names the visitor in its own header.
test('sign-ups from one address are rate limited, including through Netlify', async () => {
  const signUp = (i, headers) =>
    call('POST', '/api/member/register', {
      body: { email: `spam${i}-${run}@test.dev`, password: 'correct horse battery', displayName: 'Spam', slug: `spam${i}-${run}` },
      headers,
    })

  const statuses = []
  for (let i = 0; i < 31; i++) {
    statuses.push((await signUp(i, { 'X-Nf-Client-Connection-Ip': '203.0.113.7', 'X-Forwarded-For': '10.0.0.1' })).status)
  }
  assert.equal(statuses.filter((status) => status === 200).length, 30)
  assert.equal(statuses.at(-1), 429)

  // A different visitor behind the same proxy is not blocked.
  assert.equal((await signUp(99, { 'X-Nf-Client-Connection-Ip': '203.0.113.8', 'X-Forwarded-For': '10.0.0.1' })).status, 200)
})

test('login attempts for one email are rate limited', async () => {
  await register('brute')
  let last
  for (let i = 0; i < 11; i++) {
    last = await call('POST', '/api/member/login', { body: { email: `brute-${run}@test.dev`, password: `guess-${i}` } })
  }
  assert.equal(last.status, 429)
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
