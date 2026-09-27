// Profile buttons use the Aura platform's format: { type, label, value }.
export const LINK_TYPES = [
  { type: 'website', name: 'Website', label: 'Website', placeholder: 'yourwebsite.com' },
  { type: 'instagram', name: 'Instagram', label: 'Instagram', placeholder: 'instagram.com/yourname' },
  { type: 'linkedin', name: 'LinkedIn', label: 'LinkedIn', placeholder: 'linkedin.com/in/yourname' },
  { type: 'twitter', name: 'X (Twitter)', label: 'X (Twitter)', placeholder: 'x.com/yourname' },
  { type: 'phone', name: 'Phone', label: 'Call me', placeholder: '(805) 555-0123' },
  { type: 'email', name: 'Email', label: 'Email me', placeholder: 'you@example.com' },
  { type: 'other', name: 'Other link', label: 'Link', placeholder: 'example.com/page' },
]

export const linkTypeInfo = (type) => LINK_TYPES.find((item) => item.type === type) || LINK_TYPES.at(-1)

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '')
  return digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : value
}

// The small line under a button's label: a tidy phone number, email, @handle, or bare domain.
export function linkDetail(link) {
  const value = String(link?.value || '').trim()
  if (!value) return ''
  if (link.type === 'phone') return formatPhone(value.replace(/^tel:/i, ''))
  // Email addresses and domains aren't case-sensitive, so show them in lowercase; paths stay as typed.
  if (link.type === 'email') return value.replace(/^mailto:/i, '').split('?')[0].toLowerCase()
  const bare = value.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '')
  const host = bare.split(/[/?#]/, 1)[0]
  const tidy = host.toLowerCase() + bare.slice(host.length)
  const handle = /^(?:instagram\.com|x\.com|twitter\.com)\/@?([\w.]+)/i.exec(tidy)?.[1]
  if (handle && (link.type === 'instagram' || link.type === 'twitter')) return `@${handle}`
  return tidy
}

// Same rule the original app and the server use: phone and email become tel:/mailto:, and web
// links written without https:// get it added.
export function linkHref(link) {
  const value = String(link?.value || '').trim()
  if (link?.type === 'phone') return `tel:${value.replace(/^tel:/i, '').replace(/[^\d+]/g, '')}`
  if (link?.type === 'email') return `mailto:${value.replace(/^mailto:/i, '')}`
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value
  return `https://${value.replace(/^\/+/, '')}`
}
