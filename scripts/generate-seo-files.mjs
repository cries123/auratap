import fs from 'node:fs'
import path from 'node:path'

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

const siteUrlRaw = process.env.VITE_PUBLIC_SITE_URL || 'https://example.com'
const siteUrl = siteUrlRaw.replace(/\/$/, '')

const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`

const urls = [
  `${siteUrl}/`,
  `${siteUrl}/#/pricing`,
  `${siteUrl}/#/warranty`,
  `${siteUrl}/#/contact`,
  `${siteUrl}/#/privacy`,
  `${siteUrl}/#/terms`,
]

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${urls[0]}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${urls[1]}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${urls[2]}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${urls[3]}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${urls[4]}</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${urls[5]}</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
`

fs.mkdirSync(publicDir, { recursive: true })
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt)
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml)

if (!process.env.VITE_PUBLIC_SITE_URL) {
  console.warn('[seo] VITE_PUBLIC_SITE_URL is not set. Using fallback https://example.com')
}
