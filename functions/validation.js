import crypto from 'node:crypto'
import { promisify } from 'node:util'
import { RESERVED_SLUGS } from './config.js'

const scrypt = promisify(crypto.scrypt)

export class ValidationError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

export const LIMITS = {
  displayName: 80,
  headline: 120,
  subheadline: 160,
  company: 80,
  jobTitle: 80,
  phone: 30,
  email: 254,
  linkLabel: 40,
  linkHref: 500,
  links: 8,
  avatarChars: 300_000,
  password: { min: 8, max: 128 },
  slug: { min: 3, max: 40 },
}

export async function hashPassword(password, salt) {
  const key = await scrypt(password, salt, 64)
  return key.toString('hex')
}

export async function verifyPassword(password, salt, expectedHash) {
  const actual = Buffer.from(await hashPassword(password, salt), 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
}

export function safeEqual(a, b) {
  const left = crypto.createHash('sha256').update(String(a)).digest()
  const right = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(left, right)
}

export function newToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function normalizeSlug(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function validateSlug(value) {
  const slug = normalizeSlug(value)
  if (slug.length < LIMITS.slug.min) {
    throw new ValidationError(`Your link must be at least ${LIMITS.slug.min} characters.`)
  }
  if (slug.length > LIMITS.slug.max) {
    throw new ValidationError(`Your link can be at most ${LIMITS.slug.max} characters.`)
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw new ValidationError('That link is reserved. Please choose another.')
  }
  return slug
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function validateEmail(value, { optional = false, field = 'email address' } = {}) {
  const email = normalizeEmail(value)
  if (!email && optional) return ''
  if (!EMAIL_PATTERN.test(email) || email.length > LIMITS.email) {
    throw new ValidationError(`Please enter a valid ${field}.`)
  }
  return email
}

export function validatePassword(value) {
  const password = String(value || '')
  if (password.length < LIMITS.password.min) {
    throw new ValidationError(`Password must be at least ${LIMITS.password.min} characters.`)
  }
  if (password.length > LIMITS.password.max) {
    throw new ValidationError(`Password can be at most ${LIMITS.password.max} characters.`)
  }
  return password
}

export function cleanText(value, max, label, { required = false } = {}) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  if (required && !text) {
    throw new ValidationError(`${label} is required.`)
  }
  if (text.length > max) {
    throw new ValidationError(`${label} can be at most ${max} characters.`)
  }
  return text
}

export function cleanPhone(value) {
  const phone = cleanText(value, LIMITS.phone, 'Phone number')
  if (phone && !/^[+()\d\s.-]{7,}$/.test(phone)) {
    throw new ValidationError('Please enter a valid phone number.')
  }
  return phone
}

// Buttons may point to web pages, email, phone/SMS, or a page on this site.
// Bare domains like "instagram.com/me" get https:// added.
export function cleanHref(value, label) {
  let href = String(value || '').trim()
  if (!href) {
    throw new ValidationError(`Add a link for the "${label}" button.`)
  }
  if (!/^[a-z][a-z0-9+.-]*:/i.test(href) && !href.startsWith('/') && /^[\w-]+(\.[\w-]+)+(\/|\?|#|$)/.test(href)) {
    href = `https://${href}`
  }
  const allowed = /^https?:\/\/[^\s]+$/i.test(href)
    || /^(mailto|tel|sms):[^\s]+$/i.test(href)
    || /^\/(?!\/)[^\s]*$/.test(href)
  if (!allowed) {
    throw new ValidationError(`The link for "${label}" isn't supported. Use a web address, email, or phone number.`)
  }
  if (href.length > LIMITS.linkHref) {
    throw new ValidationError(`The link for "${label}" is too long.`)
  }
  return href
}

export function cleanLinks(links) {
  if (!Array.isArray(links)) {
    throw new ValidationError('Buttons must be a list.')
  }
  const cleaned = links
    .map((link) => ({ label: String(link?.label || '').trim(), href: String(link?.href || '').trim() }))
    .filter((link) => link.label || link.href)
  if (cleaned.length > LIMITS.links) {
    throw new ValidationError(`You can add up to ${LIMITS.links} buttons.`)
  }
  return cleaned.map((link) => {
    const label = cleanText(link.label, LIMITS.linkLabel, 'Button text', { required: true })
    return { label, href: cleanHref(link.href, label) }
  })
}

export function cleanAvatar(value) {
  const avatar = String(value || '').trim()
  if (!avatar) return ''
  if (avatar.startsWith('data:')) {
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(avatar)) {
      throw new ValidationError('Your photo must be a JPG, PNG, or WebP image.')
    }
    if (avatar.length > LIMITS.avatarChars) {
      throw new ValidationError('Your photo is too large. Please choose a smaller image.')
    }
    return avatar
  }
  if (/^https:\/\/[^\s]+$/i.test(avatar) || /^\/(?!\/)[^\s]*$/.test(avatar)) {
    return avatar.slice(0, LIMITS.linkHref)
  }
  throw new ValidationError('Your photo must be an uploaded image or an https:// link.')
}
