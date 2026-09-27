import { MEMBER_API_BASE, MEMBER_TOKEN_KEY } from '../config'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export function getMemberToken() {
  try {
    return localStorage.getItem(MEMBER_TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setMemberToken(token) {
  try {
    if (token) localStorage.setItem(MEMBER_TOKEN_KEY, token)
    else localStorage.removeItem(MEMBER_TOKEN_KEY)
  } catch {
    // Private browsing can block storage; the member just stays logged in for this page view.
  }
}

// Calls the member API and returns parsed JSON, or throws an ApiError with a message
// that is safe to show to customers.
export async function memberApi(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) headers.Authorization = `Bearer ${getMemberToken()}`

  let response
  try {
    response = await fetch(`${MEMBER_API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError("We couldn't reach Aura Tap. Check your internet connection and try again.", 0)
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(data.error || 'Something went wrong. Please try again.', response.status)
  }
  return data
}
