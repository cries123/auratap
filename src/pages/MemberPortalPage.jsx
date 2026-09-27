import { useState, useEffect, useRef, useCallback } from 'react'
import { PUBLIC_SITE_HOST, PUBLIC_SITE_URL, RESERVED_PATHS } from '../config'
import { usePageMeta } from '../hooks/usePageMeta'
import { memberApi } from '../lib/api'
import { authErrorMessage, getMemberAuth } from '../lib/firebase'
import { resizeBanner, resizeProfilePhoto } from '../lib/image'
import { LINK_TYPES, linkTypeInfo } from '../lib/links'
import { ProfileCard } from '../components/ProfileCard'
import { CardSetupSteps } from '../components/CardSetupSteps'

const MAX_BUTTONS = 12

// Tap links (usernames) are lowercase letters, numbers, "-" and "_". Tidies input as it's typed
// without fighting the user: spaces become hyphens, and a trailing hyphen is kept until blur.
function formatHandleInput(value) {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-/, '')
}

const finishHandle = (value) => formatHandleInput(value).replace(/-$/, '')

function handleProblem(handle) {
  if (!handle) return ''
  if (handle.length < 3) return 'Use at least 3 characters.'
  if (RESERVED_PATHS.has(handle)) return 'That link is reserved. Please choose another.'
  return ''
}

const errorText = (error) => (error?.code ? authErrorMessage(error) : error?.message || 'Something went wrong. Please try again.')

// Sends Firebase's password reset email. The link returns people to the portal when the site's
// domain is authorized in Firebase; otherwise Firebase's own "password changed" page is shown.
async function sendResetEmail(email) {
  const { auth, sendPasswordResetEmail } = await getMemberAuth()
  try {
    await sendPasswordResetEmail(auth, email, { url: `${PUBLIC_SITE_URL}/member` })
  } catch (error) {
    if (!/continue-uri|unauthorized-domain/.test(error?.code || '')) throw error
    await sendPasswordResetEmail(auth, email)
  }
}

function MemberAuthPage({ onRegisterStart, onRegisterEnd }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', displayName: '', username: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [usernameTouched, setUsernameTouched] = useState(false)

  function switchMode(nextMode) {
    setMode(nextMode)
    setError('')
    setNotice('')
  }

  function updateField(event) {
    const { name, value } = event.target
    if (name === 'username') {
      setUsernameTouched(true)
      setForm((current) => ({ ...current, username: formatHandleInput(value) }))
      return
    }
    setForm((current) => {
      const next = { ...current, [name]: value }
      // Suggest a link from the name until the member types their own.
      if (name === 'displayName' && !usernameTouched) {
        next.username = finishHandle(value)
      }
      return next
    })
  }

  async function register() {
    const username = finishHandle(form.username)
    const problem = handleProblem(username)
    if (problem) throw new Error(problem)
    const check = await memberApi(`/api/public/username/${encodeURIComponent(username)}`)
    if (!check.available) throw new Error(check.reason || 'That link is already taken. Please choose another.')

    const { auth, createUserWithEmailAndPassword } = await getMemberAuth()
    onRegisterStart()
    let setupError = ''
    try {
      await createUserWithEmailAndPassword(auth, form.email.trim(), form.password)
      try {
        await memberApi('/api/member/setup', { method: 'POST', auth: true, body: { displayName: form.displayName, username } })
      } catch (err) {
        // The account exists; the dashboard asks for a link again.
        setupError = `Your account was created, but we couldn't save your link: ${errorText(err)}`
      }
    } finally {
      onRegisterEnd(setupError)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsSubmitting(true)

    try {
      if (mode === 'forgot') {
        await sendResetEmail(form.email.trim())
        setNotice("If there's an account for that email, we've sent a link to reset your password. Check your inbox and spam folder.")
      } else if (mode === 'login') {
        const { auth, signInWithEmailAndPassword } = await getMemberAuth()
        await signInWithEmailAndPassword(auth, form.email.trim(), form.password)
      } else {
        await register()
      }
    } catch (submitError) {
      setError(errorText(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const headings = {
    login: ['Log in', 'Edit your tap page and contact card.'],
    register: ['Create your account', 'Set up the page people see when they tap your Aura card.'],
    forgot: ['Reset your password', "Enter your account email and we'll send you a reset link."],
  }
  const usernameHint = handleProblem(finishHandle(form.username))

  return (
    <div className="app-shell member-page">
      <section className="panel member-auth-card">
        <p className="eyebrow">Aura Tap member portal</p>
        <h1>{headings[mode][0]}</h1>
        <p>{headings[mode][1]}</p>

        <form className="member-auth-form" onSubmit={handleSubmit}>
          <label htmlFor="member-email">Email</label>
          <input
            id="member-email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={updateField}
            required
          />

          {mode !== 'forgot' && (
            <>
              <label htmlFor="member-password">Password</label>
              <input
                id="member-password"
                name="password"
                type="password"
                minLength={mode === 'register' ? 8 : undefined}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                aria-describedby={mode === 'register' ? 'member-password-hint' : undefined}
                value={form.password}
                onChange={updateField}
                required
              />
              {mode === 'register' && <p id="member-password-hint" className="field-hint">At least 8 characters.</p>}
            </>
          )}

          {mode === 'login' && (
            <button type="button" className="text-button member-forgot" onClick={() => switchMode('forgot')}>
              Forgot password?
            </button>
          )}

          {mode === 'register' && (
            <>
              <label htmlFor="member-displayName">Your name</label>
              <input
                id="member-displayName"
                name="displayName"
                autoComplete="name"
                value={form.displayName}
                onChange={updateField}
                maxLength="80"
                required
              />

              <label htmlFor="member-username">Your tap link</label>
              <div className="member-slug-input-wrap">
                <span className="member-slug-prefix">{PUBLIC_SITE_HOST}/</span>
                <input
                  id="member-username"
                  name="username"
                  className="member-slug-input"
                  placeholder="your-name"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  aria-describedby="member-username-hint"
                  value={form.username}
                  onChange={updateField}
                  onBlur={() => setForm((current) => ({ ...current, username: finishHandle(current.username) }))}
                  maxLength="30"
                  required
                />
              </div>
              <p id="member-username-hint" className={`field-hint${usernameHint ? ' field-hint-error' : ''}`}>
                {usernameHint || 'Letters, numbers, hyphens, and underscores. This is the link on your card.'}
              </p>
            </>
          )}

          {error && <p className="login-error" role="alert">{error}</p>}
          {notice && <p className="form-status" role="status">{notice}</p>}

          <button
            type="submit"
            className="btn btn-primary member-btn-primary"
            disabled={isSubmitting || (mode === 'register' && Boolean(usernameHint))}
          >
            {isSubmitting
              ? 'Please wait…'
              : { login: 'Log in', register: 'Create account', forgot: 'Send reset link' }[mode]}
          </button>
        </form>

        <p className="member-auth-switch-text">
          {mode === 'login' ? (
            <>
              New to Aura Tap?{' '}
              <button type="button" className="text-button" onClick={() => switchMode('register')}>Create an account</button>
            </>
          ) : (
            <>
              {mode === 'register' ? 'Already have an account?' : 'Remembered it?'}{' '}
              <button type="button" className="text-button" onClick={() => switchMode('login')}>Log in</button>
            </>
          )}
        </p>
      </section>
    </div>
  )
}

function CopyButton({ text, label = 'Copy link' }) {
  const [state, setState] = useState('idle')

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
    } catch {
      setState('blocked')
    }
    setTimeout(() => setState('idle'), 2500)
  }

  return (
    <button type="button" className="btn btn-secondary btn-sm" onClick={copy}>
      {{ idle: label, copied: 'Copied!', blocked: 'Copy blocked, select the link' }[state]}
    </button>
  )
}

// Lets a member claim their first link, or change it (the previous link keeps working).
function UsernameForm({ current, onSaved, onCancel, submitLabel }) {
  const [value, setValue] = useState(current || '')
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function save(event) {
    event.preventDefault()
    const handle = finishHandle(value)
    const problem = handleProblem(handle) || (!handle ? 'Choose a link.' : '')
    if (problem) {
      setMessage(problem)
      return
    }
    setIsSaving(true)
    setMessage('')
    try {
      const data = await memberApi('/api/member/username', { method: 'PUT', auth: true, body: { username: handle } })
      onSaved(data.profile.username)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="member-slug-form" onSubmit={save}>
      <label htmlFor="member-new-username">{current ? 'New link' : 'Your tap link'}</label>
      <div className="member-slug-input-wrap">
        <span className="member-slug-prefix">{PUBLIC_SITE_HOST}/</span>
        <input
          id="member-new-username"
          className="member-slug-input"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          placeholder="your-name"
          maxLength="30"
          value={value}
          onChange={(event) => setValue(formatHandleInput(event.target.value))}
          onBlur={() => setValue((currentValue) => finishHandle(currentValue))}
        />
      </div>
      {current && (
        <p className="field-hint">Your current link keeps working, so cards you&apos;ve already handed out won&apos;t break.</p>
      )}
      <div className="button-row">
        <button type="submit" className="btn btn-primary btn-sm" disabled={isSaving}>{isSaving ? 'Saving…' : submitLabel}</button>
        {onCancel && <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>}
      </div>
      {message && <p className="form-status field-hint-error" role="alert">{message}</p>}
    </form>
  )
}

function LinkPanel({ username, onUsernameChanged }) {
  const publicUrl = `${PUBLIC_SITE_URL}/${username}`
  const [qrCode, setQrCode] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState('')

  async function toggleQrCode() {
    if (qrCode) {
      setQrCode('')
      return
    }
    const QRCode = await import('qrcode')
    setQrCode(await QRCode.toDataURL(publicUrl, { width: 512, margin: 1 }))
  }

  return (
    <section className="member-section" aria-labelledby="member-link-heading">
      <h2 id="member-link-heading">Your tap link</h2>
      <div className="member-link-display">
        <a href={publicUrl} target="_blank" rel="noopener noreferrer">{PUBLIC_SITE_HOST}/{username}</a>
        <div className="member-link-actions">
          <CopyButton text={publicUrl} />
          <button type="button" className="btn btn-secondary btn-sm" onClick={toggleQrCode}>{qrCode ? 'Hide QR code' : 'QR code'}</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setIsEditing((open) => !open); setMessage('') }}>
            Change link
          </button>
        </div>
      </div>

      {qrCode && (
        <div className="member-qr">
          <img src={qrCode} alt={`QR code for ${PUBLIC_SITE_HOST}/${username}`} width="160" height="160" />
          <a className="btn btn-secondary btn-sm" href={qrCode} download={`${username}-qr-code.png`}>Download PNG</a>
        </div>
      )}

      {isEditing && (
        <UsernameForm
          current={username}
          submitLabel="Save new link"
          onCancel={() => setIsEditing(false)}
          onSaved={(newUsername) => {
            onUsernameChanged(newUsername)
            setIsEditing(false)
            setQrCode('')
            setMessage(`Your link is now ${PUBLIC_SITE_HOST}/${newUsername}. Your old link still works.`)
          }}
        />
      )}

      {message && <p className="form-status" role="status">{message}</p>}
    </section>
  )
}

function pickEditable(profile) {
  return {
    displayName: profile.displayName || '',
    jobTitle: profile.jobTitle || '',
    location: profile.location || '',
    bio: profile.bio || '',
    tagsText: (profile.tags || []).join(', '),
    avatarUrl: profile.avatarUrl || '',
    bannerUrl: profile.bannerUrl || '',
    links: (profile.links || []).map((link) => ({ type: link.type || 'other', label: link.label || '', value: link.value || '' })),
  }
}

function toPayload(draft) {
  const { tagsText, ...rest } = draft
  return { ...rest, tags: tagsText.split(',').map((tag) => tag.trim()).filter(Boolean) }
}

function MemberDashboard({ user, initialNotice, onLogout }) {
  const [saved, setSaved] = useState(null)
  const [draft, setDraft] = useState(null)
  const [username, setUsername] = useState('')
  const [loadError, setLoadError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState({ tone: initialNotice ? 'error' : '', text: initialNotice || '' })
  const photoInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    memberApi('/api/member/profile', { auth: true })
      .then((profile) => {
        if (!isMounted) return
        setUsername(profile.username || '')
        setSaved(pickEditable(profile))
        setDraft(pickEditable(profile))
      })
      .catch((error) => {
        if (!isMounted) return
        if (error.status === 401) onLogout()
        else setLoadError(error.message)
      })
    return () => {
      isMounted = false
    }
  }, [onLogout])

  const isDirty = Boolean(saved && draft && JSON.stringify(saved) !== JSON.stringify(draft))

  function changeDraft(update) {
    setDraft(update)
    setStatus((current) => (current.tone === 'error' ? { tone: '', text: '' } : current))
  }

  useEffect(() => {
    if (!isDirty) return undefined
    const warn = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  function updateField(event) {
    const { name, value } = event.target
    changeDraft((current) => ({ ...current, [name]: value }))
  }

  function updateButton(index, field, value) {
    changeDraft((current) => ({
      ...current,
      links: current.links.map((link, i) => {
        if (i !== index) return link
        const next = { ...link, [field]: value }
        // Switching type swaps in that type's default label unless the member wrote their own.
        if (field === 'type' && (!link.label || link.label === linkTypeInfo(link.type).label)) {
          next.label = linkTypeInfo(value).label
        }
        return next
      }),
    }))
  }

  function moveButton(index, offset) {
    changeDraft((current) => {
      const links = [...current.links]
      const [moved] = links.splice(index, 1)
      links.splice(index + offset, 0, moved)
      return { ...current, links }
    })
  }

  async function handleImageChange(event, field, resize) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setStatus({ tone: 'error', text: 'Please choose a photo.' })
      return
    }
    try {
      const dataUrl = await resize(file)
      changeDraft((current) => ({ ...current, [field]: dataUrl }))
      setStatus({ tone: '', text: 'Image added. Save your changes to publish it.' })
    } catch {
      setStatus({ tone: 'error', text: "We couldn't read that image. Try a different one." })
    }
  }

  async function handleSave(event) {
    event.preventDefault()
    setIsSaving(true)
    setStatus({ tone: '', text: '' })
    try {
      const data = await memberApi('/api/member/profile', { method: 'PUT', auth: true, body: toPayload(draft) })
      setSaved(pickEditable(data.profile))
      setDraft(pickEditable(data.profile))
      setStatus({ tone: 'success', text: 'Saved. Your tap page is up to date.' })
    } catch (error) {
      if (error.status === 401) {
        onLogout()
        return
      }
      setStatus({ tone: 'error', text: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  if (loadError) {
    return (
      <div className="app-shell member-page">
        <section className="panel member-auth-card">
          <h1>We couldn&apos;t load your page</h1>
          <p>{loadError}</p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Try again</button>
        </section>
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="app-shell member-page">
        <p className="member-loading" role="status">Loading your page…</p>
      </div>
    )
  }

  return (
    <div className="app-shell member-page">
      <div className="member-dashboard">
        <header className="member-dashboard-header">
          <div>
            <p className="eyebrow">Member portal</p>
            <h1>Your tap page</h1>
            <p className="field-hint">Signed in as {user.email}</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onLogout}>Log out</button>
        </header>

        <div className="member-dashboard-grid">
          <div className="member-editor">
            {username ? (
              <LinkPanel username={username} onUsernameChanged={setUsername} />
            ) : (
              <section className="member-section member-claim" aria-labelledby="member-claim-heading">
                <h2 id="member-claim-heading">Choose your tap link</h2>
                <p className="field-hint">This is the address your card opens. You can change it later.</p>
                <UsernameForm submitLabel="Claim link" onSaved={setUsername} />
              </section>
            )}

            {username && (
              <details className="member-section member-setup">
                <summary>
                  <h2>Program your card</h2>
                  <span className="field-hint">Write your link onto your Aura card with the free NFC Tools app.</span>
                </summary>
                <CardSetupSteps
                  link={`${PUBLIC_SITE_HOST}/${username}`}
                  linkAction={<CopyButton text={`${PUBLIC_SITE_URL}/${username}`} label="Copy" />}
                />
              </details>
            )}

            <form className="member-profile-form" onSubmit={handleSave}>
              <section className="member-section" aria-labelledby="member-profile-heading">
                <h2 id="member-profile-heading">Profile</h2>
                <div className="member-photo-row">
                  {draft.avatarUrl ? (
                    <img src={draft.avatarUrl} alt="Your profile photo" className="member-photo" />
                  ) : (
                    <span className="member-photo member-photo-empty" aria-hidden="true" />
                  )}
                  <div className="button-row">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => photoInputRef.current?.click()}>
                      {draft.avatarUrl ? 'Change photo' : 'Upload photo'}
                    </button>
                    {draft.avatarUrl && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => changeDraft((current) => ({ ...current, avatarUrl: '' }))}>
                        Remove
                      </button>
                    )}
                  </div>
                  <input ref={photoInputRef} type="file" accept="image/*" className="member-avatar-file-input" onChange={(event) => handleImageChange(event, 'avatarUrl', resizeProfilePhoto)} />
                </div>

                <div className="member-banner-row">
                  {draft.bannerUrl ? (
                    <img src={draft.bannerUrl} alt="Your banner" className="member-banner" />
                  ) : (
                    <span className="member-banner member-banner-empty">No banner</span>
                  )}
                  <div className="button-row">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => bannerInputRef.current?.click()}>
                      {draft.bannerUrl ? 'Change banner' : 'Add banner'}
                    </button>
                    {draft.bannerUrl && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => changeDraft((current) => ({ ...current, bannerUrl: '' }))}>
                        Remove
                      </button>
                    )}
                  </div>
                  <input ref={bannerInputRef} type="file" accept="image/*" className="member-avatar-file-input" onChange={(event) => handleImageChange(event, 'bannerUrl', resizeBanner)} />
                </div>

                <label htmlFor="member-display">Name</label>
                <input id="member-display" name="displayName" value={draft.displayName} onChange={updateField} maxLength="80" required />

                <div className="member-field-grid">
                  <div>
                    <label htmlFor="member-job">Job title</label>
                    <input id="member-job" name="jobTitle" autoComplete="organization-title" value={draft.jobTitle} onChange={updateField} maxLength="80" placeholder="Realtor" />
                  </div>
                  <div>
                    <label htmlFor="member-location">Location</label>
                    <input id="member-location" name="location" value={draft.location} onChange={updateField} maxLength="80" placeholder="San Luis Obispo, CA" />
                  </div>
                </div>

                <label htmlFor="member-bio">Bio</label>
                <textarea id="member-bio" name="bio" rows="3" value={draft.bio} onChange={updateField} maxLength="300" placeholder="Helping families find their next home since 2015." />

                <label htmlFor="member-tags">Tags</label>
                <input id="member-tags" name="tagsText" value={draft.tagsText} onChange={updateField} placeholder="real estate, central coast" aria-describedby="member-tags-hint" />
                <p id="member-tags-hint" className="field-hint">Separate tags with commas.</p>
              </section>

              <section className="member-section" aria-labelledby="member-buttons-heading">
                <div className="member-section-head">
                  <h2 id="member-buttons-heading">Buttons</h2>
                  <span className="field-hint">{draft.links.length} of {MAX_BUTTONS}</span>
                </div>
                <p className="field-hint">Add a Phone and an Email button so &ldquo;Save Contact&rdquo; puts them in people&apos;s contacts.</p>

                {draft.links.map((link, index) => {
                  const info = linkTypeInfo(link.type)
                  return (
                    <fieldset className="member-button-row" key={index}>
                      <legend className="sr-only">Button {index + 1}</legend>
                      <div>
                        <label htmlFor={`member-link-type-${index}`}>Type</label>
                        <select id={`member-link-type-${index}`} value={link.type} onChange={(event) => updateButton(index, 'type', event.target.value)}>
                          {LINK_TYPES.map((item) => (
                            <option key={item.type} value={item.type}>{item.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`member-link-label-${index}`}>Button text</label>
                        <input
                          id={`member-link-label-${index}`}
                          value={link.label}
                          maxLength="40"
                          placeholder={info.label}
                          onChange={(event) => updateButton(index, 'label', event.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor={`member-link-value-${index}`}>{link.type === 'phone' ? 'Phone number' : link.type === 'email' ? 'Email address' : 'Link'}</label>
                        <input
                          id={`member-link-value-${index}`}
                          value={link.value}
                          type={link.type === 'email' ? 'email' : link.type === 'phone' ? 'tel' : 'text'}
                          placeholder={info.placeholder}
                          autoCapitalize="none"
                          autoCorrect="off"
                          onChange={(event) => updateButton(index, 'value', event.target.value)}
                        />
                      </div>
                      <div className="member-button-controls">
                        <button type="button" className="icon-button" aria-label={`Move button ${index + 1} up`} disabled={index === 0} onClick={() => moveButton(index, -1)}>↑</button>
                        <button type="button" className="icon-button" aria-label={`Move button ${index + 1} down`} disabled={index === draft.links.length - 1} onClick={() => moveButton(index, 1)}>↓</button>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Remove button ${index + 1}`}
                          onClick={() => changeDraft((current) => ({ ...current, links: current.links.filter((_, i) => i !== index) }))}
                        >
                          ✕
                        </button>
                      </div>
                    </fieldset>
                  )
                })}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={draft.links.length >= MAX_BUTTONS}
                  onClick={() => changeDraft((current) => ({ ...current, links: [...current.links, { type: 'website', label: 'Website', value: '' }] }))}
                >
                  Add button
                </button>
              </section>

              <div className={`member-save-bar${isDirty || status.tone === 'error' ? ' is-pinned' : ''}`}>
                <p className={`member-save-status ${status.tone}`} role={status.tone === 'error' ? 'alert' : 'status'}>
                  {status.text || (isDirty ? 'You have unsaved changes.' : 'All changes saved.')}
                </p>
                <button type="submit" className="btn btn-primary" disabled={isSaving || !isDirty}>
                  {isSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>

          <aside className="member-preview" aria-label="Preview of your tap page">
            <p className="member-preview-label">Preview</p>
            <div className="member-preview-phone">
              <ProfileCard profile={{ ...toPayload(draft), username }} vcardHref="#" isPreview headingLevel={2} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export function MemberPortalPage() {
  const [authState, setAuthState] = useState({ status: 'loading', user: null })
  const [registering, setRegistering] = useState(false)
  const [setupNotice, setSetupNotice] = useState('')

  const signedIn = authState.user && !registering
  usePageMeta(signedIn ? 'Your Tap Page' : 'Member Log In', 'Log in to edit your Aura Tap profile page.')

  useEffect(() => {
    let unsubscribe = () => {}
    let cancelled = false
    getMemberAuth()
      .then(({ auth, onAuthStateChanged }) => {
        if (cancelled) return
        unsubscribe = onAuthStateChanged(auth, (user) => setAuthState({ status: 'ready', user }))
      })
      .catch((error) => {
        console.error('Could not start sign-in:', error)
        if (!cancelled) setAuthState({ status: 'error', user: null })
      })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const handleLogout = useCallback(async () => {
    const { auth, signOut } = await getMemberAuth()
    await signOut(auth)
  }, [])

  if (authState.status === 'loading') {
    return (
      <div className="app-shell member-page">
        <p className="member-loading" role="status">Loading…</p>
      </div>
    )
  }

  if (authState.status === 'error') {
    return (
      <div className="app-shell member-page">
        <section className="panel member-auth-card">
          <h1>We couldn&apos;t load sign-in</h1>
          <p>Check your internet connection and try again.</p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Try again</button>
        </section>
      </div>
    )
  }

  if (!signedIn) {
    return (
      <MemberAuthPage
        onRegisterStart={() => {
          setSetupNotice('')
          setRegistering(true)
        }}
        onRegisterEnd={(notice) => {
          setSetupNotice(notice)
          setRegistering(false)
        }}
      />
    )
  }

  return <MemberDashboard key={authState.user.uid} user={authState.user} initialNotice={setupNotice} onLogout={handleLogout} />
}
