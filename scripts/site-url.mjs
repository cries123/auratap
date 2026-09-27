// Resolves the public site address used in SEO files and index.html meta tags.
// Unset values and the placeholders from .env.example fall back to the live Firebase address,
// so a build can never publish example.com links.
export const DEFAULT_SITE_URL = 'https://auratap-ee8a0.web.app'

const PLACEHOLDER = /^https?:\/\/(www\.)?(example\.com|your-domain\.com)\/?$/i

export function resolveSiteUrl(value) {
  const url = String(value || '').trim().replace(/\/$/, '')
  if (!url || PLACEHOLDER.test(url)) {
    return { url: DEFAULT_SITE_URL, usedFallback: true }
  }
  return { url, usedFallback: false }
}
