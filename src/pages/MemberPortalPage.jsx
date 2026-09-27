import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MEMBER_API_BASE, MEMBER_TOKEN_KEY } from '../config'
import { getMemberAuthHeaders } from '../lib/auth'
import { usePageMeta } from '../hooks/usePageMeta'

function MemberAuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
    slug: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    if (name === 'slug') {
      const normalized = value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      setForm((current) => ({ ...current, [name]: normalized }))
      return
    }

    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const endpoint = mode === 'login' ? '/api/member/login' : '/api/member/register'
    const payload = mode === 'login'
      ? { email: form.email, password: form.password }
      : {
        email: form.email,
        password: form.password,
        displayName: form.displayName,
        slug: form.slug,
      }

    try {
      const response = await fetch(`${MEMBER_API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Unable to continue')
      }

      localStorage.setItem(MEMBER_TOKEN_KEY, data.token)
      onAuthenticated()
    } catch (submitError) {
      console.error('Member auth error:', submitError)
      const message = (submitError && submitError.message) ? submitError.message : 'Unable to continue'
      if (message.toLowerCase().includes('failed to fetch')) {
        setError('Unable to reach member server. Start backend API on port 3001, then try again.')
      } else {
        setError(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app-shell member-page">
      <section className="panel member-auth-card">
        <p className="eyebrow">Aura Tap Member Portal</p>
        <h1>{mode === 'login' ? 'Member Login' : 'Create Member Account'}</h1>
        <p>{mode === 'login' ? 'Sign in to edit your tap profile.' : 'Create an account to manage your tap page.'}</p>
        {mode === 'register' && (
          <p className="member-auth-helper">Choose a slug like jason-smith to create your public tap link.</p>
        )}
        <form className="member-auth-form" onSubmit={handleSubmit}>
          <label htmlFor="member-email">Email</label>
          <input id="member-email" name="email" type="email" value={form.email} onChange={updateField} required />

          <label htmlFor="member-password">Password</label>
          <input id="member-password" name="password" type="password" minLength="8" value={form.password} onChange={updateField} required />

          {mode === 'register' && (
            <>
              <label htmlFor="member-displayName">Display Name</label>
              <input id="member-displayName" name="displayName" value={form.displayName} onChange={updateField} required />

              <label htmlFor="member-slug">Profile URL Slug</label>
              <div className="member-slug-input-wrap">
                <span className="member-slug-prefix">aurataps.net/</span>
                <input
                  id="member-slug"
                  name="slug"
                  className="member-slug-input"
                  placeholder="your-name"
                  value={form.slug}
                  onChange={updateField}
                  required
                />
              </div>
              <p className="member-slug-preview">
                Public link: aurataps.net/{form.slug || 'your-name'}
              </p>
            </>
          )}

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn btn-primary member-btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        <button
          type="button"
          className="btn btn-secondary member-auth-switch"
          onClick={() => {
            setError('')
            setMode((current) => (current === 'login' ? 'register' : 'login'))
          }}
        >
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>
      </section>
    </div>
  )
}

function MemberDashboard({ onLogout }) {
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState('')
  const avatarFileInputRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      try {
        const response = await fetch(`${MEMBER_API_BASE}/api/member/profile`, {
          headers: getMemberAuthHeaders(),
        })

        if (response.status === 401) {
          onLogout()
          return
        }

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Unable to load profile')
        }

        if (isMounted) {
          setProfile({
            ...data,
            links: Array.isArray(data.links) ? data.links : [],
          })
        }
      } catch (error) {
        console.error('Failed to load member profile:', error)
        if (isMounted) {
          setStatus('Unable to load your profile right now.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()
    return () => {
      isMounted = false
    }
  }, [onLogout])

  function updateProfileField(event) {
    const { name, value } = event.target
    setProfile((current) => ({ ...current, [name]: value }))
  }

  function handleAvatarFileChange(event) {
    const file = event.target.files && event.target.files[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setStatus('Please choose an image file.')
      event.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatus('Please choose an image smaller than 2MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result) {
        setStatus('Could not read the selected image.')
        return
      }

      setProfile((current) => ({ ...current, avatarSrc: result }))
      setStatus('Photo selected. Click Save Profile to publish it.')
    }
    reader.onerror = () => {
      setStatus('Could not read the selected image.')
    }

    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function updateLink(index, field, value) {
    setProfile((current) => ({
      ...current,
      links: current.links.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    }))
  }

  function addLink() {
    setProfile((current) => ({
      ...current,
      links: [...current.links, { label: '', href: '' }],
    }))
  }

  function removeLink(index) {
    setProfile((current) => ({
      ...current,
      links: current.links.filter((_, i) => i !== index),
    }))
  }

  async function handleSave(event) {
    event.preventDefault()
    if (!profile) {
      return
    }

    setStatus('')
    setIsSaving(true)

    try {
      const response = await fetch(`${MEMBER_API_BASE}/api/member/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getMemberAuthHeaders(),
        },
        body: JSON.stringify({
          displayName: profile.displayName,
          headline: profile.headline,
          subheadline: profile.subheadline,
          avatarSrc: profile.avatarSrc,
          links: profile.links,
        }),
      })

      if (response.status === 401) {
        onLogout()
        return
      }

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Unable to save profile')
      }

      setProfile(data.profile)
      setStatus('Saved successfully. Your card link is now updated.')
    } catch (saveError) {
      console.error('Failed to save profile:', saveError)
      setStatus(saveError.message || 'Unable to save your profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !profile) {
    return (
      <div className="app-shell member-page">
        <section className="panel member-auth-card">
          <p>Loading member profile...</p>
        </section>
      </div>
    )
  }

  const publicUrl = `${window.location.origin}/${profile.slug}`

  return (
    <div className="app-shell member-page">
      <section className="panel member-dashboard-card">
        <div className="member-dashboard-header">
          <div>
            <p className="eyebrow">Member Portal</p>
            <h1>Edit Your Tap Page</h1>
            <p>Public URL: <a href={publicUrl} target="_blank" rel="noreferrer">{publicUrl}</a></p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={onLogout}>Logout</button>
        </div>

        <form className="member-profile-form" onSubmit={handleSave}>
          <label htmlFor="member-display">Display Name</label>
          <input id="member-display" name="displayName" value={profile.displayName || ''} onChange={updateProfileField} required />

          <label htmlFor="member-headline">Headline</label>
          <input id="member-headline" name="headline" value={profile.headline || ''} onChange={updateProfileField} />

          <label htmlFor="member-subheadline">Subheadline</label>
          <input id="member-subheadline" name="subheadline" value={profile.subheadline || ''} onChange={updateProfileField} />

          <label htmlFor="member-avatar">Avatar Image URL</label>
          <div className="member-avatar-row">
            <input id="member-avatar" name="avatarSrc" value={profile.avatarSrc || ''} onChange={updateProfileField} placeholder="/auralogo.png or https://..." />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => avatarFileInputRef.current && avatarFileInputRef.current.click()}
            >
              Upload Photo
            </button>
            <input
              ref={avatarFileInputRef}
              type="file"
              accept="image/*"
              className="member-avatar-file-input"
              onChange={handleAvatarFileChange}
            />
          </div>

          <div className="member-links-editor">
            <div className="member-links-head">
              <h2>Profile Buttons</h2>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addLink}>Add Link</button>
            </div>
            {profile.links.map((link, index) => (
              <div className="member-link-row" key={`link-${index}`}>
                <input
                  value={link.label || ''}
                  onChange={(event) => updateLink(index, 'label', event.target.value)}
                  placeholder="Button label"
                />
                <input
                  value={link.href || ''}
                  onChange={(event) => updateLink(index, 'href', event.target.value)}
                  placeholder="https://... or /contact"
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeLink(index)}>Remove</button>
              </div>
            ))}
          </div>

          {status && <p className="form-status">{status}</p>}

          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </section>
    </div>
  )
}

export function MemberPortalPage() {
  usePageMeta('Member Log In', 'Log in to edit your Aura Tap profile page.')
  const [authState, setAuthState] = useState(() =>
    localStorage.getItem(MEMBER_TOKEN_KEY) ? 'checking' : 'unauthenticated',
  )

  function handleAuthenticated() {
    setAuthState('authenticated')
  }

  function handleLogout() {
    localStorage.removeItem(MEMBER_TOKEN_KEY)
    setAuthState('unauthenticated')
  }

  useEffect(() => {
    if (authState !== 'checking') {
      return
    }

    let isMounted = true

    async function verifySession() {
      try {
        const response = await fetch(`${MEMBER_API_BASE}/api/member/session`, {
          headers: getMemberAuthHeaders(),
        })

        if (!isMounted) {
          return
        }

        setAuthState(response.ok ? 'authenticated' : 'unauthenticated')
        if (!response.ok) {
          localStorage.removeItem(MEMBER_TOKEN_KEY)
        }
      } catch (error) {
        console.error('Unable to verify member session:', error)
        localStorage.removeItem(MEMBER_TOKEN_KEY)
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
      <div className="app-shell member-page">
        <section className="panel member-auth-card">
          <p>Checking member session...</p>
        </section>
      </div>
    )
  }

  if (authState !== 'authenticated') {
    return <MemberAuthPage onAuthenticated={handleAuthenticated} />
  }

  return <MemberDashboard onLogout={handleLogout} />
}
