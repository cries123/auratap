export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'sales@auratap.com'

export const BOOKING_URL = import.meta.env.VITE_BOOKING_URL || '/contact'

export const BUSINESS_ADDRESS = import.meta.env.VITE_BUSINESS_ADDRESS || 'Nationwide'

export const CHAT_API_BASE = import.meta.env.VITE_CHAT_API_BASE || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3001')

export const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_BASE || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3001')

export const MEMBER_API_BASE = import.meta.env.VITE_MEMBER_API_BASE || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3001')

export const ADMIN_TOKEN_KEY = 'auratap_admin_token'

const CURRENT_ORIGIN = typeof window !== 'undefined' ? window.location.origin : ''
const CONFIGURED_SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL || '').replace(/\/$/, '')

// The address customers' tap links are shown with. Placeholder values from .env.example
// are ignored so a half-configured build never prints example.com links for customers.
export const PUBLIC_SITE_URL = /^https?:\/\/(www\.)?(example\.com|your-domain\.com)$/i.test(CONFIGURED_SITE_URL) || !CONFIGURED_SITE_URL
  ? CURRENT_ORIGIN
  : CONFIGURED_SITE_URL

export const PUBLIC_SITE_HOST = PUBLIC_SITE_URL.replace(/^https?:\/\//, '')

// Top-level paths the site uses itself, so they can never be a member's tap link.
// The server keeps a longer list (functions/config.js RESERVED_SLUGS) that includes these.
export const RESERVED_PATHS = new Set([
  '',
  'how-it-works',
  'testimonials',
  'pricing',
  'contact',
  'privacy',
  'terms',
  'warranty',
  'admin',
  'member',
  'reset-password',
  'setup',
])

export const IS_EXTERNAL_BOOKING = /^https?:\/\//.test(BOOKING_URL)
