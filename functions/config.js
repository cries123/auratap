// Runtime settings. On Firebase these come from functions/.env (see .env.example).
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''
export const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://auratap-ee8a0.web.app').replace(/\/$/, '')
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
export const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || ''
export const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || ''

export const ALLOWED_ORIGINS = [
  'https://auratap-ee8a0.web.app',
  'https://auratap-ee8a0.firebaseapp.com',
  'https://aurataps.net',
  'https://www.aurataps.net',
  'http://localhost:5173',
  FRONTEND_URL,
  ...(process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()),
].filter(Boolean)

export const MEMBER_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30
export const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 12
export const PASSWORD_RESET_TTL_MS = 1000 * 60 * 60
export const MAX_SLUG_ALIASES = 5

// Paths the website itself uses, plus names we never want a member to claim.
// Keep in sync with RESERVED_PATHS in src/config.js.
export const RESERVED_SLUGS = new Set([
  'admin', 'api', 'assets', 'images', 'member', 'members', 'login', 'logout', 'signup', 'register',
  'account', 'settings', 'reset-password', 'forgot-password', 'how-it-works', 'testimonials', 'reviews',
  'pricing', 'contact', 'privacy', 'terms', 'warranty', 'about', 'help', 'support', 'blog', 'shop',
  'store', 'cart', 'checkout', 'profile', 'profiles', 'dashboard', 'aura', 'auratap', 'aura-tap',
  'aurataps', 'www', 'mail', 'static', 'public', 'favicon', 'robots', 'sitemap',
  'setup', 'guide',
])
