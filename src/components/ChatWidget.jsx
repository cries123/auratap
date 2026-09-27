import { useState, useEffect, useRef } from 'react'
import { CHAT_API_BASE } from '../config'
import { trackEvent } from '../lib/analytics'

export function ChatWidget() {
  const CHAT_STORAGE_KEY = 'auratap_chat_state'
  const initialGreeting = {
    id: 1,
    text: "Hi! 👋 Questions about Aura Tap? We're here to help.",
    sender: 'bot',
    timestamp: new Date().toISOString(),
  }

  const [persistedState] = useState(() => {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const raw = window.localStorage.getItem(CHAT_STORAGE_KEY)
      if (!raw) {
        return null
      }

      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch (error) {
      console.error('Unable to restore chat state:', error)
      return null
    }
  })

  const [isOpen, setIsOpen] = useState(() => Boolean(persistedState?.isOpen))
  const [showForm, setShowForm] = useState(() => {
    if (typeof persistedState?.showForm === 'boolean') {
      return persistedState.showForm
    }
    return true
  })
  const [messages, setMessages] = useState(() => {
    const savedMessages = persistedState?.messages
    if (Array.isArray(savedMessages) && savedMessages.length > 0) {
      return savedMessages
    }
    return [initialGreeting]
  })
  const [formData, setFormData] = useState(() => ({
    name: persistedState?.formData?.name || '',
    email: persistedState?.formData?.email || '',
    message: persistedState?.formData?.message || '',
  }))
  const [inputValue, setInputValue] = useState(() => persistedState?.inputValue || '')
  const [isLoading, setIsLoading] = useState(false)
  const messagesRef = useRef(messages)

  const CHAT_API = `${CHAT_API_BASE}/api/chat`

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stateToPersist = {
      isOpen,
      showForm,
      messages,
      formData,
      inputValue,
    }

    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(stateToPersist))
  }, [isOpen, showForm, messages, formData, inputValue])

  useEffect(() => {
    if (showForm) {
      return undefined
    }

    let cancelled = false

    const syncAdminResponses = async () => {
      const currentMessages = messagesRef.current
      const messageIds = [...new Set(
        currentMessages
          .filter((msg) => msg.sender === 'user' && Number.isInteger(msg.id))
          .map((msg) => msg.id)
      )]

      if (!messageIds.length) {
        return
      }

      try {
        const threads = await Promise.all(
          messageIds.map(async (messageId) => {
            const response = await fetch(`${CHAT_API}/message/${messageId}`)
            if (!response.ok) {
              return null
            }
            return response.json()
          })
        )

        if (cancelled) {
          return
        }

        const incoming = []
        threads.forEach((thread, index) => {
          if (!thread || !Array.isArray(thread.responses)) {
            return
          }

          const rootMessageId = messageIds[index]
          thread.responses.forEach((reply) => {
            incoming.push({
              id: `admin-${rootMessageId}-${reply.id}`,
              text: reply.adminResponse,
              sender: 'bot',
              timestamp: reply.createdAt || new Date().toISOString(),
            })
          })
        })

        if (!incoming.length) {
          return
        }

        setMessages((prev) => {
          const existingIds = new Set(prev.map((msg) => String(msg.id)))
          const nextMessages = [...prev]

          incoming.forEach((msg) => {
            if (!existingIds.has(String(msg.id))) {
              existingIds.add(String(msg.id))
              nextMessages.push(msg)
            }
          })

          return nextMessages
        })
      } catch (error) {
        if (!cancelled) {
          console.error('Error syncing chat responses:', error)
        }
      }
    }

    void syncAdminResponses()
    const intervalId = window.setInterval(syncAdminResponses, 3500)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [CHAT_API, showForm])

  function handleFormChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleFormSubmit(e) {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) return

    setIsLoading(true)
    try {
      const response = await fetch(`${CHAT_API}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorName: formData.name,
          visitorEmail: formData.email,
          visitorMessage: formData.message,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const userMessage = {
          id: data.messageId,
          text: formData.message,
          sender: 'user',
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, userMessage])
        trackEvent('chat_message_sent', { source: 'initial_form' })
        setFormData({ ...formData, message: '' })
        setShowForm(false)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
    setIsLoading(false)
  }

  async function handleSendMessage(e) {
    e.preventDefault()
    if (!inputValue.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`${CHAT_API}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorName: formData.name,
          visitorEmail: formData.email,
          visitorMessage: inputValue,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const userMessage = {
          id: data.messageId,
          text: inputValue,
          sender: 'user',
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, userMessage])
        trackEvent('chat_message_sent', { source: 'chat_window' })
        setInputValue('')

        // Simulate bot response
        setTimeout(() => {
          const botResponse = {
            id: Date.now(),
            text: 'Thanks for your message! We\'ll respond shortly right here in this chat.',
            sender: 'bot',
            timestamp: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, botResponse])
        }, 800)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
    setIsLoading(false)
  }

  return (
    <>
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>Aura Tap Support</h3>
            <button
              className="chat-close"
              type="button"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message chat-${msg.sender}`}>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>

          {showForm ? (
            <form className="chat-form" onSubmit={handleFormSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Your name..."
                value={formData.name}
                onChange={handleFormChange}
                required
                className="chat-input"
              />
              <input
                type="email"
                name="email"
                placeholder="Your email..."
                value={formData.email}
                onChange={handleFormChange}
                required
                className="chat-input"
              />
              <textarea
                name="message"
                placeholder="Your message..."
                value={formData.message}
                onChange={handleFormChange}
                required
                className="chat-input chat-textarea"
                rows="3"
              />
              <button
                type="submit"
                className="chat-send"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
          ) : (
            <form className="chat-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Type a message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="chat-input"
              />
              <button
                type="submit"
                className="chat-send"
                disabled={isLoading}
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </form>
          )}
        </div>
      )}
      <button
        className="chat-button"
        type="button"
        onClick={() => {
          trackEvent('chat_opened', { isOpen: !isOpen })
          setIsOpen(!isOpen)
        }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H9l-4.2 3.6a.5.5 0 0 1-.8-.4V5.5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </>
  )
}
