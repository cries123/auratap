import { ADMIN_TOKEN_KEY, MEMBER_TOKEN_KEY } from '../config'

export function getAdminAuthHeaders() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  return token
    ? { Authorization: `Bearer ${token}` }
    : {}
}

export function getMemberAuthHeaders() {
  const token = localStorage.getItem(MEMBER_TOKEN_KEY)
  return token
    ? { Authorization: `Bearer ${token}` }
    : {}
}
