// Builds a vCard 3.0 contact file, the format iPhone and Android "Add to Contacts" both understand.

const escapeValue = (value) =>
  String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/([,;])/g, '\\$1')

// vCard lines longer than 75 characters must be folded onto continuation lines starting with a space.
function fold(line) {
  const chunks = []
  for (let i = 0; i < line.length; i += 74) {
    chunks.push((i === 0 ? '' : ' ') + line.slice(i, i + 74))
  }
  return chunks.join('\r\n')
}

// Same rule the tap page uses: web links written without a scheme get https:// added.
export function linkHref(link) {
  const value = String(link.value || '').trim()
  if (link.type === 'phone') return `tel:${value.replace(/^tel:/i, '')}`
  if (link.type === 'email') return `mailto:${value.replace(/^mailto:/i, '')}`
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value
  return `https://${value.replace(/^\/+/, '')}`
}

export function buildVCard(profile, profileUrl) {
  const name = profile.displayName || profile.username || 'Aura Tap Contact'
  const parts = name.trim().split(/\s+/)
  const lastName = parts.length > 1 ? parts.pop() : ''
  const firstName = parts.join(' ')
  const links = profile.links || []

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeValue(lastName)};${escapeValue(firstName)};;;`,
    `FN:${escapeValue(name)}`,
  ]
  if (profile.jobTitle) lines.push(`TITLE:${escapeValue(profile.jobTitle)}`)
  for (const link of links.filter((l) => l.type === 'phone')) {
    lines.push(`TEL;TYPE=CELL:${escapeValue(String(link.value).replace(/^tel:/i, ''))}`)
  }
  for (const link of links.filter((l) => l.type === 'email')) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeValue(String(link.value).replace(/^mailto:/i, ''))}`)
  }
  if (profile.location) lines.push(`ADR;TYPE=WORK:;;;${escapeValue(profile.location)};;;`)
  lines.push(`URL:${escapeValue(profileUrl)}`)
  for (const link of links.filter((l) => l.type !== 'phone' && l.type !== 'email')) {
    lines.push(`URL:${escapeValue(linkHref(link))}`)
  }
  if (profile.bio) lines.push(`NOTE:${escapeValue(profile.bio)}`)

  const photo = /^data:image\/(jpeg|png);base64,(.+)$/.exec(profile.avatarUrl || '')
  if (photo) {
    lines.push(`PHOTO;ENCODING=b;TYPE=${photo[1] === 'png' ? 'PNG' : 'JPEG'}:${photo[2]}`)
  }

  lines.push('END:VCARD')
  return lines.map(fold).join('\r\n') + '\r\n'
}
