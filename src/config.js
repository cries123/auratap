export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'sales@auratap.com'

export const PHONE_NUMBER = import.meta.env.VITE_PHONE_NUMBER || '8059033231'

export const BOOKING_URL = import.meta.env.VITE_BOOKING_URL || '/contact'

export const BUSINESS_ADDRESS = import.meta.env.VITE_BUSINESS_ADDRESS || 'Nationwide'

export const CHAT_API_BASE = import.meta.env.VITE_CHAT_API_BASE || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3001')

export const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_BASE || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3001')

export const MEMBER_API_BASE = import.meta.env.VITE_MEMBER_API_BASE || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3001')

export const ADMIN_TOKEN_KEY = 'auratap_admin_token'

export const MEMBER_TOKEN_KEY = 'auratap_member_token'

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
])

function formatPhone(value) {
  const digits = String(value).replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '')
  return digits.length === 10
    ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    : value
}

export const PHONE_DISPLAY = formatPhone(PHONE_NUMBER)

export const IS_EXTERNAL_BOOKING = /^https?:\/\//.test(BOOKING_URL)
