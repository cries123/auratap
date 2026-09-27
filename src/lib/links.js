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

// Same rule the original app and the server use: phone and email become tel:/mailto:, and web
// links written without https:// get it added.
export function linkHref(link) {
  const value = String(link?.value || '').trim()
  if (link?.type === 'phone') return `tel:${value.replace(/^tel:/i, '').replace(/[^\d+]/g, '')}`
  if (link?.type === 'email') return `mailto:${value.replace(/^mailto:/i, '')}`
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value
  return `https://${value.replace(/^\/+/, '')}`
}
