import { MEMBER_API_BASE } from '../config'
import { getMemberAuth } from './firebase'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// Calls the member API and returns parsed JSON, or throws an ApiError with a message that is
// safe to show to customers. `auth` sends the signed-in member's Firebase ID token.
export async function memberApi(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const { auth: firebaseAuth } = await getMemberAuth()
    const token = await firebaseAuth.currentUser?.getIdToken()
    if (!token) throw new ApiError('Please log in again.', 401)
    headers.Authorization = `Bearer ${token}`
  }

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
    // A 5xx without our JSON error body means the API itself is down or unreachable.
    const fallback = response.status >= 500
      ? "We couldn't reach Aura Tap right now. Please try again in a moment."
      : 'Something went wrong. Please try again.'
    throw new ApiError(data.error || fallback, response.status)
  }
  return data
}
