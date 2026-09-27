import fs from 'node:fs'
import path from 'node:path'
import { resolveSiteUrl } from './site-url.mjs'

const rootDir = process.cwd()
const publicDir = path.join(rootDir, 'public')

function loadEnvFromRootFile() {
  const envPath = path.join(rootDir, '.env')
  if (!fs.existsSync(envPath)) {
    return
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const idx = trimmed.indexOf('=')
    if (idx <= 0) {
      continue
    }

    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim()
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

loadEnvFromRootFile()

const { url: siteUrl, usedFallback } = resolveSiteUrl(process.env.VITE_PUBLIC_SITE_URL)

const pages = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/how-it-works', changefreq: 'monthly', priority: '0.8' },
  { path: '/pricing', changefreq: 'weekly', priority: '0.9' },
  { path: '/testimonials', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact', changefreq: 'monthly', priority: '0.8' },
  { path: '/setup', changefreq: 'monthly', priority: '0.6' },
  { path: '/warranty', changefreq: 'yearly', priority: '0.5' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
]

const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /member
Disallow: /reset-password

Sitemap: ${siteUrl}/sitemap.xml
`

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${siteUrl}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

fs.mkdirSync(publicDir, { recursive: true })
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt)
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml)

if (usedFallback) {
  console.warn(`[seo] VITE_PUBLIC_SITE_URL is missing or a placeholder. Using ${siteUrl}`)
}
