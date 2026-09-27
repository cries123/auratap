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

export function buildVCard(profile, profileUrl) {
  const name = profile.displayName || 'Aura Tap Contact'
  const parts = name.trim().split(/\s+/)
  const lastName = parts.length > 1 ? parts.pop() : ''
  const firstName = parts.join(' ')

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeValue(lastName)};${escapeValue(firstName)};;;`,
    `FN:${escapeValue(name)}`,
  ]
  if (profile.company) lines.push(`ORG:${escapeValue(profile.company)}`)
  if (profile.jobTitle) lines.push(`TITLE:${escapeValue(profile.jobTitle)}`)
  if (profile.phone) lines.push(`TEL;TYPE=CELL:${escapeValue(profile.phone)}`)
  if (profile.contactEmail) lines.push(`EMAIL;TYPE=INTERNET:${escapeValue(profile.contactEmail)}`)
  lines.push(`URL:${escapeValue(profileUrl)}`)
  for (const link of profile.links || []) {
    if (/^https?:\/\//i.test(link.href)) lines.push(`URL:${escapeValue(link.href)}`)
  }
  if (profile.headline) lines.push(`NOTE:${escapeValue(profile.headline)}`)

  const photo = /^data:image\/(jpeg|png);base64,(.+)$/.exec(profile.avatarSrc || '')
  if (photo) {
    lines.push(`PHOTO;ENCODING=b;TYPE=${photo[1] === 'png' ? 'PNG' : 'JPEG'}:${photo[2]}`)
  }

  lines.push('END:VCARD')
  return lines.map(fold).join('\r\n') + '\r\n'
}
