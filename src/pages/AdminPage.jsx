import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ADMIN_API_BASE, ADMIN_TOKEN_KEY } from '../config'
import { getAdminAuthHeaders } from '../lib/auth'
import { usePageMeta } from '../hooks/usePageMeta'

function AdminLoginPage({ onAuthenticated }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')

    try {
      setIsSubmitting(true)
      const response = await fetch(`${ADMIN_API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        setError('Incorrect password or access denied')
        setPassword('')
        return
      }

      const data = await response.json()
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token)
      onAuthenticated()
    } catch (loginError) {
      console.error('Admin login failed:', loginError)
      setError('Unable to reach admin server')
      setPassword('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="admin-login-container">
        <div className="admin-login-box">
          <h1>Aura Tap Admin Access</h1>
          <p>Enter your staff password to access the admin panel</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Staff password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function AdminPageContent({ onSessionExpired }) {
  const [messages, setMessages] = useState([])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [adminResponse, setAdminResponse] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const didOpenLinkedMessage = useRef(false)

  const ADMIN_API = `${ADMIN_API_BASE}/api/admin`

  const handleUnauthorized = useCallback((response) => {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      onSessionExpired()
      return true
    }
    return false
  }, [onSessionExpired])

  async function fetchMessages() {
    try {
      setLoading(true)
      const response = await fetch(`${ADMIN_API}/messages`, {
        headers: getAdminAuthHeaders(),
      })

      if (handleUnauthorized(response)) return

      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
    setLoading(false)
  }

  const handleSelectMessage = useCallback(async (message) => {
    try {
      const response = await fetch(`${ADMIN_API}/message/${message.id}`, {
        headers: getAdminAuthHeaders(),
      })

      if (handleUnauthorized(response)) return

      if (response.ok) {
        const data = await response.json()
        setSelectedMessage(data)
        setAdminResponse('')
      }
    } catch (error) {
      console.error('Error fetching message:', error)
    }
  }, [ADMIN_API, handleUnauthorized])

  async function handleSendResponse() {
    if (!selectedMessage || !adminResponse.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`${ADMIN_API}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          adminResponse: adminResponse,
        }),
      })

      if (handleUnauthorized(response)) return

      if (response.ok) {
        setAdminResponse('')
        fetchMessages()
        handleSelectMessage(selectedMessage)
      }
    } catch (error) {
      console.error('Error sending response:', error)
    }
    setIsSubmitting(false)
  }

  async function handleDeleteMessage() {
    if (!selectedMessage) return

    const confirmed = window.confirm('Delete this ticket and all replies? This cannot be undone.')
    if (!confirmed) return

    try {
      const response = await fetch(`${ADMIN_API}/message/${selectedMessage.id}`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders(),
      })

      if (handleUnauthorized(response)) return

      if (!response.ok) {
        throw new Error('Failed to delete message')
      }

      setSelectedMessage(null)
      fetchMessages()
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  function handleLogout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    onSessionExpired()
  }

  useEffect(() => {
    let isMounted = true

    async function loadInitialMessages() {
      try {
        const response = await fetch(`${ADMIN_API}/messages`, {
          headers: getAdminAuthHeaders(),
        })

        if (handleUnauthorized(response)) return

        if (response.ok && isMounted) {
          const data = await response.json()
          setMessages(data)
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      }

      if (isMounted) {
        setLoading(false)
      }
    }

    loadInitialMessages()

    return () => {
      isMounted = false
    }
  }, [ADMIN_API, handleUnauthorized])

  useEffect(() => {
    if (didOpenLinkedMessage.current || messages.length === 0) {
      return
    }

    const search = typeof window !== 'undefined' ? window.location.search : ''
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const queryString = search.startsWith('?')
      ? search.slice(1)
      : hash.includes('?')
        ? hash.split('?')[1]
        : ''
    const params = new URLSearchParams(queryString)
    const linkedMessageId = params.get('messageId')

    if (!linkedMessageId) {
      didOpenLinkedMessage.current = true
      return
    }

    const matchedMessage = messages.find((message) => String(message.id) === linkedMessageId)

    didOpenLinkedMessage.current = true

    if (matchedMessage) {
      handleSelectMessage(matchedMessage)
    }
  }, [messages, handleSelectMessage])

  return (
    <div className="app-shell admin-page">
      <header className="panel admin-header">
        <p className="brand">Aura Tap Admin Panel</p>
        <div className="admin-header-actions">
          <Link to="/" className="btn btn-secondary btn-sm">
            ← Back to Site
          </Link>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="admin-container">
        <div className="admin-messages-list">
          <h2>Messages ({messages.length})</h2>
          {loading ? (
            <p className="loading">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="empty">No messages yet</p>
          ) : (
            <div className="messages-list">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-item ${selectedMessage?.id === msg.id ? 'active' : ''}`}
                  onClick={() => handleSelectMessage(msg)}
                >
                  <p className="msg-name">{msg.visitorName}</p>
                  <p className="msg-preview">{msg.visitorMessage.substring(0, 60)}...</p>
                  <p className="msg-time">
                    {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                  {msg.responseCount > 0 && <span className="badge">{msg.responseCount} replies</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-message-detail">
          {selectedMessage ? (
            <>
              <div className="detail-header">
                <div>
                  <h2>{selectedMessage.visitorName}</h2>
                  <p>{selectedMessage.visitorEmail}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm btn-danger"
                  onClick={handleDeleteMessage}
                >
                  Delete Ticket
                </button>
              </div>

              <div className="conversation">
                <div className="message-bubble visitor">
                  <p>{selectedMessage.visitorMessage}</p>
                  <span className="msg-time">{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                </div>

                {selectedMessage.responses &&
                  selectedMessage.responses.map((resp) => (
                    <div key={resp.id} className="message-bubble admin">
                      <p>{resp.adminResponse}</p>
                      <span className="msg-time">{new Date(resp.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
              </div>

              <form
                className="response-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendResponse()
                }}
              >
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Type your response..."
                  rows="4"
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || !adminResponse.trim()}
                >
                  {isSubmitting ? 'Sending...' : 'Send Response'}
                </button>
              </form>
            </>
          ) : (
            <div className="detail-placeholder">
              <p>Select a message to view and respond</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function AdminPage() {
  usePageMeta('Admin')
  const [authState, setAuthState] = useState(() =>
    localStorage.getItem(ADMIN_TOKEN_KEY) ? 'checking' : 'unauthenticated',
  )

  function handleAuthenticated() {
    setAuthState('authenticated')
  }

  function handleSessionExpired() {
    setAuthState('unauthenticated')
  }

  useEffect(() => {
    if (authState !== 'checking') {
      return
    }

    let isMounted = true

    async function verifySession() {
      try {
        const response = await fetch(`${ADMIN_API_BASE}/api/admin/session`, {
          headers: getAdminAuthHeaders(),
        })

        if (!isMounted) {
          return
        }

        if (response.ok) {
          setAuthState('authenticated')
        } else {
          localStorage.removeItem(ADMIN_TOKEN_KEY)
          setAuthState('unauthenticated')
        }
      } catch (error) {
        console.error('Unable to verify admin session:', error)
        localStorage.removeItem(ADMIN_TOKEN_KEY)
        if (isMounted) {
          setAuthState('unauthenticated')
        }
      }
    }

    verifySession()

    return () => {
      isMounted = false
    }
  }, [authState])

  if (authState === 'checking') {
    return (
      <div className="app-shell">
        <section className="panel">
          <p>Checking admin session...</p>
        </section>
      </div>
    )
  }

  if (authState !== 'authenticated') {
    return <AdminLoginPage onAuthenticated={handleAuthenticated} />
  }

  return <AdminPageContent onSessionExpired={handleSessionExpired} />
}
