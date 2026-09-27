// Resolves the public site address used in SEO files, index.html meta tags, and the tap links
// shown in the member portal. Unset values and the placeholders from .env.example fall back to
// aurataps.net, so a build can never publish example.com links.
export const DEFAULT_SITE_URL = 'https://aurataps.net'

const PLACEHOLDER = /^https?:\/\/(www\.)?(example\.com|your-domain\.com)\/?$/i

export function resolveSiteUrl(value) {
  const url = String(value || '').trim().replace(/\/$/, '')
  if (!url || PLACEHOLDER.test(url)) {
    return { url: DEFAULT_SITE_URL, usedFallback: true }
  }
  return { url, usedFallback: false }
}
