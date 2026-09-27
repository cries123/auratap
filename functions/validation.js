import crypto from 'node:crypto'
import { RESERVED_SLUGS } from './config.js'

export class ValidationError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

// Member profiles use the Aura platform's existing Firestore format (users/{uid}):
// displayName, username, jobTitle, location, bio, tags[], avatarUrl, bannerUrl, and
// links[] of { type, label, value }.
export const LINK_TYPES = ['website', 'instagram', 'twitter', 'linkedin', 'phone', 'email', 'other']

export const LIMITS = {
  displayName: 80,
  jobTitle: 80,
  location: 80,
  bio: 300,
  tags: 10,
  tag: 30,
  linkLabel: 40,
  linkValue: 500,
  links: 12,
  avatarChars: 300_000,
  bannerChars: 600_000,
  email: 254,
  username: { min: 3, max: 30 },
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

// Existing handles (usernames/{handle}) are lowercase letters, numbers, "_" and "-".
// Returns '' for anything that can't be a handle, so lookups simply find nothing.
export function handleForLookup(value) {
  const handle = String(value || '').trim().toLowerCase()
  return /^[a-z0-9_-]{1,64}$/.test(handle) ? handle : ''
}

export function validateNewUsername(value) {
  const username = String(value || '').trim().toLowerCase()
  if (!/^[a-z0-9_-]+$/.test(username)) {
    throw new ValidationError('Your link can only use letters, numbers, hyphens, and underscores.')
  }
  if (username.length < LIMITS.username.min) {
    throw new ValidationError(`Your link must be at least ${LIMITS.username.min} characters.`)
  }
  if (username.length > LIMITS.username.max) {
    throw new ValidationError(`Your link can be at most ${LIMITS.username.max} characters.`)
  }
  if (RESERVED_SLUGS.has(username)) {
    throw new ValidationError('That link is reserved. Please choose another.')
  }
  return username
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

export function cleanText(value, max, label, { required = false, multiline = false } = {}) {
  const text = multiline
    ? String(value ?? '').replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
    : String(value ?? '').replace(/\s+/g, ' ').trim()
  if (required && !text) {
    throw new ValidationError(`${label} is required.`)
  }
  if (text.length > max) {
    throw new ValidationError(`${label} can be at most ${max} characters.`)
  }
  return text
}

export function cleanTags(value) {
  const tags = (Array.isArray(value) ? value : String(value || '').split(','))
    .map((tag) => String(tag).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  if (tags.length > LIMITS.tags) {
    throw new ValidationError(`You can add up to ${LIMITS.tags} tags.`)
  }
  for (const tag of tags) {
    if (tag.length > LIMITS.tag) throw new ValidationError(`Tags can be at most ${LIMITS.tag} characters each.`)
  }
  return tags
}

const DEFAULT_LABELS = {
  website: 'Website',
  instagram: 'Instagram',
  twitter: 'X (Twitter)',
  linkedin: 'LinkedIn',
  phone: 'Call me',
  email: 'Email me',
  other: 'Link',
}

// Validates one button's value for its type. Web links may be written without https://
// (the profile page adds it); anything with another scheme (javascript:, data:, ...) is refused.
function cleanLinkValue(type, value, label) {
  const text = String(value || '').trim()
  if (!text) throw new ValidationError(`Add a value for the "${label}" button.`)
  if (text.length > LIMITS.linkValue) throw new ValidationError(`The "${label}" button's link is too long.`)
  if (type === 'phone') {
    const phone = text.replace(/^tel:/i, '')
    if (!/^[+()\d\s.-]{7,30}$/.test(phone)) throw new ValidationError(`"${label}" needs a valid phone number.`)
    return phone
  }
  if (type === 'email') {
    return validateEmail(text.replace(/^mailto:/i, ''), { field: `email for "${label}"` })
  }
  if (/\s/.test(text)) throw new ValidationError(`"${label}" needs a web address without spaces.`)
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(text)
  if (scheme && !/^https?:\/\//i.test(text) && !/^(mailto|tel):/i.test(text)) {
    throw new ValidationError(`The link for "${label}" isn't supported. Use a web address.`)
  }
  return text
}

// `storedLinks` are the member's current buttons: any button sent back unchanged is kept exactly
// as stored (the original app didn't validate them), and only new or edited buttons are checked.
export function cleanLinks(links, storedLinks = []) {
  if (!Array.isArray(links)) {
    throw new ValidationError('Buttons must be a list.')
  }
  const stored = new Map((Array.isArray(storedLinks) ? storedLinks : []).map((link) => [JSON.stringify([link?.type, link?.label, link?.value]), link]))
  const cleaned = links.filter((link) => String(link?.label || '').trim() || String(link?.value || '').trim())
  if (cleaned.length > Math.max(LIMITS.links, stored.size)) {
    throw new ValidationError(`You can add up to ${LIMITS.links} buttons.`)
  }
  return cleaned.map((link) => {
    const unchanged = stored.get(JSON.stringify([link?.type, link?.label, link?.value]))
    if (unchanged) return unchanged
    const type = LINK_TYPES.includes(link?.type) ? link.type : 'other'
    const label = cleanText(String(link?.label || '').trim() || DEFAULT_LABELS[type], LIMITS.linkLabel, 'Button text', { required: true })
    return { type, label, value: cleanLinkValue(type, link?.value, label) }
  })
}

function cleanImage(value, maxChars, what) {
  const image = String(value || '').trim()
  if (!image) return ''
  if (image.startsWith('data:')) {
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image)) {
      throw new ValidationError(`Your ${what} must be a JPG, PNG, or WebP image.`)
    }
    if (image.length > maxChars) {
      throw new ValidationError(`Your ${what} is too large. Please choose a smaller image.`)
    }
    return image
  }
  if (/^https:\/\/[^\s]+$/i.test(image) && image.length <= LIMITS.linkValue) {
    return image
  }
  throw new ValidationError(`Your ${what} must be an uploaded image or an https:// link.`)
}

export const cleanAvatar = (value) => cleanImage(value, LIMITS.avatarChars, 'photo')
export const cleanBanner = (value) => cleanImage(value, LIMITS.bannerChars, 'banner')
