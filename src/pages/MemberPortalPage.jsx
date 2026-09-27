import { useState, useEffect, useRef, useCallback } from 'react'
import { PUBLIC_SITE_HOST, PUBLIC_SITE_URL, RESERVED_PATHS } from '../config'
import { usePageMeta } from '../hooks/usePageMeta'
import { memberApi, getMemberToken, setMemberToken } from '../lib/api'
import { resizeImageToDataUrl } from '../lib/image'
import { ProfileCard } from '../components/ProfileCard'
import { CardSetupSteps } from '../components/CardSetupSteps'

const MAX_BUTTONS = 8

// Tidies a link as it's typed without fighting the user: spaces become hyphens,
// but a trailing hyphen is kept until the field loses focus.
function formatSlugInput(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
}

const finishSlug = (value) => formatSlugInput(value).replace(/-$/, '')

function slugProblem(slug) {
  if (!slug) return ''
  if (slug.length < 3) return 'Use at least 3 characters.'
  if (RESERVED_PATHS.has(slug)) return 'That link is reserved. Please choose another.'
  return ''
}

function MemberAuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', displayName: '', slug: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  function switchMode(nextMode) {
    setMode(nextMode)
    setError('')
    setNotice('')
  }

  function updateField(event) {
    const { name, value } = event.target
    if (name === 'slug') {
      setSlugTouched(true)
      setForm((current) => ({ ...current, slug: formatSlugInput(value) }))
      return
    }
    setForm((current) => {
      const next = { ...current, [name]: value }
      // Suggest a link from the name until the member types their own.
      if (name === 'displayName' && !slugTouched) {
        next.slug = finishSlug(value)
      }
      return next
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsSubmitting(true)

    try {
      if (mode === 'forgot') {
        await memberApi('/api/member/password-reset/request', { method: 'POST', body: { email: form.email } })
        setNotice("If there's an account for that email, we've sent a link to reset your password. Check your inbox.")
        return
      }

      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, displayName: form.displayName, slug: finishSlug(form.slug) }
      const data = await memberApi(mode === 'login' ? '/api/member/login' : '/api/member/register', { method: 'POST', body })
      setMemberToken(data.token)
      onAuthenticated()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const headings = {
    login: ['Log in', 'Edit your tap page and contact card.'],
    register: ['Create your account', 'Set up the page people see when they tap your Aura card.'],
    forgot: ['Reset your password', "Enter your account email and we'll send you a reset link."],
  }
  const slugHint = slugProblem(finishSlug(form.slug))

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
                minLength="8"
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
                required
              />

              <label htmlFor="member-slug">Your tap link</label>
              <div className="member-slug-input-wrap">
                <span className="member-slug-prefix">{PUBLIC_SITE_HOST}/</span>
                <input
                  id="member-slug"
                  name="slug"
                  className="member-slug-input"
                  placeholder="your-name"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  aria-describedby="member-slug-hint"
                  value={form.slug}
                  onChange={updateField}
                  onBlur={() => setForm((current) => ({ ...current, slug: finishSlug(current.slug) }))}
                  required
                />
              </div>
              <p id="member-slug-hint" className={`field-hint${slugHint ? ' field-hint-error' : ''}`}>
                {slugHint || 'Letters, numbers, and hyphens. This is the link on your card.'}
              </p>
            </>
          )}

          {error && <p className="login-error" role="alert">{error}</p>}
          {notice && <p className="form-status" role="status">{notice}</p>}

          <button
            type="submit"
            className="btn btn-primary member-btn-primary"
            disabled={isSubmitting || (mode === 'register' && Boolean(slugHint))}
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

function LinkPanel({ slug, onSlugChanged }) {
  const publicUrl = `${PUBLIC_SITE_URL}/${slug}`
  const [qrCode, setQrCode] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [newSlug, setNewSlug] = useState(slug)
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function toggleQrCode() {
    if (qrCode) {
      setQrCode('')
      return
    }
    const QRCode = await import('qrcode')
    setQrCode(await QRCode.toDataURL(publicUrl, { width: 512, margin: 1 }))
  }

  async function saveSlug(event) {
    event.preventDefault()
    const slugToSave = finishSlug(newSlug)
    const problem = slugProblem(slugToSave)
    if (problem) {
      setMessage(problem)
      return
    }
    setIsSaving(true)
    setMessage('')
    try {
      const data = await memberApi('/api/member/slug', { method: 'PUT', auth: true, body: { slug: slugToSave } })
      onSlugChanged(data.profile.slug)
      setIsEditing(false)
      setQrCode('')
      setMessage(`Your link is now ${PUBLIC_SITE_HOST}/${data.profile.slug}. Your old link still works.`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="member-section" aria-labelledby="member-link-heading">
      <h2 id="member-link-heading">Your tap link</h2>
      <div className="member-link-display">
        <a href={publicUrl} target="_blank" rel="noopener noreferrer">{PUBLIC_SITE_HOST}/{slug}</a>
        <div className="member-link-actions">
          <CopyButton text={publicUrl} />
          <button type="button" className="btn btn-secondary btn-sm" onClick={toggleQrCode}>{qrCode ? 'Hide QR code' : 'QR code'}</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setIsEditing((open) => !open); setNewSlug(slug); setMessage('') }}>
            Change link
          </button>
        </div>
      </div>

      {qrCode && (
        <div className="member-qr">
          <img src={qrCode} alt={`QR code for ${PUBLIC_SITE_HOST}/${slug}`} width="160" height="160" />
          <a className="btn btn-secondary btn-sm" href={qrCode} download={`${slug}-qr-code.png`}>Download PNG</a>
        </div>
      )}

      {isEditing && (
        <form className="member-slug-form" onSubmit={saveSlug}>
          <label htmlFor="member-new-slug">New link</label>
          <div className="member-slug-input-wrap">
            <span className="member-slug-prefix">{PUBLIC_SITE_HOST}/</span>
            <input
              id="member-new-slug"
              className="member-slug-input"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              value={newSlug}
              onChange={(event) => setNewSlug(formatSlugInput(event.target.value))}
              onBlur={() => setNewSlug((current) => finishSlug(current))}
            />
          </div>
          <p className="field-hint">Your current link keeps working, so cards you&apos;ve already handed out won&apos;t break.</p>
          <div className="button-row">
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save new link'}</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </form>
      )}

      {message && <p className="form-status" role="status">{message}</p>}
    </section>
  )
}

const EDITABLE_FIELDS = ['displayName', 'headline', 'subheadline', 'avatarSrc', 'phone', 'contactEmail', 'company', 'jobTitle', 'links']

function pickEditable(profile) {
  return Object.fromEntries(EDITABLE_FIELDS.map((field) => [field, field === 'links' ? profile.links || [] : profile[field] || '']))
}

function MemberDashboard({ onSessionExpired, onLogout }) {
  const [saved, setSaved] = useState(null)
  const [draft, setDraft] = useState(null)
  const [slug, setSlug] = useState('')
  const [loadError, setLoadError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState({ tone: '', text: '' })
  const photoInputRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    memberApi('/api/member/profile', { auth: true })
      .then((profile) => {
        if (!isMounted) return
        setSlug(profile.slug)
        setSaved(pickEditable(profile))
        setDraft(pickEditable(profile))
      })
      .catch((error) => {
        if (!isMounted) return
        if (error.status === 401) onSessionExpired()
        else setLoadError(error.message)
      })
    return () => {
      isMounted = false
    }
  }, [onSessionExpired])

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
      links: current.links.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
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

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setStatus({ tone: 'error', text: 'Please choose a photo.' })
      return
    }
    try {
      const avatarSrc = await resizeImageToDataUrl(file)
      changeDraft((current) => ({ ...current, avatarSrc }))
      setStatus({ tone: '', text: 'Photo added. Save your changes to publish it.' })
    } catch {
      setStatus({ tone: 'error', text: "We couldn't read that photo. Try a different one." })
    }
  }

  async function handleSave(event) {
    event.preventDefault()
    setIsSaving(true)
    setStatus({ tone: '', text: '' })
    try {
      const data = await memberApi('/api/member/profile', { method: 'PUT', auth: true, body: draft })
      setSaved(pickEditable(data.profile))
      setDraft(pickEditable(data.profile))
      setStatus({ tone: 'success', text: 'Saved. Your tap page is up to date.' })
    } catch (error) {
      if (error.status === 401) {
        onSessionExpired()
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
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onLogout}>Log out</button>
        </header>

        <div className="member-dashboard-grid">
          <div className="member-editor">
            <LinkPanel slug={slug} onSlugChanged={setSlug} />

            <details className="member-section member-setup">
              <summary>
                <h2>Program your card</h2>
                <span className="field-hint">Write your link onto your Aura card with the free NFC Tools app.</span>
              </summary>
              <CardSetupSteps
                link={`${PUBLIC_SITE_HOST}/${slug}`}
                linkAction={<CopyButton text={`${PUBLIC_SITE_URL}/${slug}`} label="Copy" />}
              />
            </details>

            <form className="member-profile-form" onSubmit={handleSave}>
              <section className="member-section" aria-labelledby="member-profile-heading">
                <h2 id="member-profile-heading">Profile</h2>
                <div className="member-photo-row">
                  {draft.avatarSrc ? (
                    <img src={draft.avatarSrc} alt="Your profile photo" className="member-photo" />
                  ) : (
                    <span className="member-photo member-photo-empty" aria-hidden="true" />
                  )}
                  <div className="button-row">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => photoInputRef.current?.click()}>
                      {draft.avatarSrc ? 'Change photo' : 'Upload photo'}
                    </button>
                    {draft.avatarSrc && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => changeDraft((current) => ({ ...current, avatarSrc: '' }))}>
                        Remove
                      </button>
                    )}
                  </div>
                  <input ref={photoInputRef} type="file" accept="image/*" className="member-avatar-file-input" onChange={handlePhotoChange} />
                </div>

                <label htmlFor="member-display">Name</label>
                <input id="member-display" name="displayName" value={draft.displayName} onChange={updateField} maxLength="80" required />

                <label htmlFor="member-headline">Headline</label>
                <input id="member-headline" name="headline" value={draft.headline} onChange={updateField} maxLength="120" placeholder="Realtor serving the Central Coast" />

                <label htmlFor="member-subheadline">Short bio</label>
                <input id="member-subheadline" name="subheadline" value={draft.subheadline} onChange={updateField} maxLength="160" placeholder="Helping families find their next home since 2015." />
              </section>

              <section className="member-section" aria-labelledby="member-contact-heading">
                <h2 id="member-contact-heading">Contact card</h2>
                <p className="field-hint">Saved straight to people&apos;s phones when they tap &ldquo;Save Contact.&rdquo;</p>
                <div className="member-field-grid">
                  <div>
                    <label htmlFor="member-phone">Phone</label>
                    <input id="member-phone" name="phone" type="tel" autoComplete="tel" value={draft.phone} onChange={updateField} maxLength="30" />
                  </div>
                  <div>
                    <label htmlFor="member-contact-email">Email</label>
                    <input id="member-contact-email" name="contactEmail" type="email" value={draft.contactEmail} onChange={updateField} />
                  </div>
                  <div>
                    <label htmlFor="member-company">Company</label>
                    <input id="member-company" name="company" autoComplete="organization" value={draft.company} onChange={updateField} maxLength="80" />
                  </div>
                  <div>
                    <label htmlFor="member-job">Job title</label>
                    <input id="member-job" name="jobTitle" autoComplete="organization-title" value={draft.jobTitle} onChange={updateField} maxLength="80" />
                  </div>
                </div>
              </section>

              <section className="member-section" aria-labelledby="member-buttons-heading">
                <div className="member-section-head">
                  <h2 id="member-buttons-heading">Buttons</h2>
                  <span className="field-hint">{draft.links.length} of {MAX_BUTTONS}</span>
                </div>
                <p className="field-hint">Links to your website, socials, booking page, reviews, and more.</p>

                {draft.links.map((link, index) => (
                  <fieldset className="member-button-row" key={index}>
                    <legend className="sr-only">Button {index + 1}</legend>
                    <div>
                      <label htmlFor={`member-link-label-${index}`}>Button text</label>
                      <input
                        id={`member-link-label-${index}`}
                        value={link.label}
                        maxLength="40"
                        placeholder="Instagram"
                        onChange={(event) => updateButton(index, 'label', event.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`member-link-href-${index}`}>Link</label>
                      <input
                        id={`member-link-href-${index}`}
                        value={link.href}
                        placeholder="instagram.com/yourname"
                        autoCapitalize="none"
                        autoCorrect="off"
                        onChange={(event) => updateButton(index, 'href', event.target.value)}
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
                ))}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={draft.links.length >= MAX_BUTTONS}
                  onClick={() => changeDraft((current) => ({ ...current, links: [...current.links, { label: '', href: '' }] }))}
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
              <ProfileCard profile={draft} vcardHref="#" isPreview headingLevel={2} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export function MemberPortalPage() {
  const [authState, setAuthState] = useState(() => (getMemberToken() ? 'checking' : 'unauthenticated'))

  usePageMeta(
    authState === 'authenticated' ? 'Your Tap Page' : 'Member Log In',
    'Log in to edit your Aura Tap profile page.',
  )

  useEffect(() => {
    if (authState !== 'checking') {
      return undefined
    }
    let isMounted = true
    memberApi('/api/member/session', { auth: true })
      .then(() => isMounted && setAuthState('authenticated'))
      .catch((error) => {
        if (!isMounted) return
        // Only a rejected session logs the member out; a network blip shouldn't.
        if (error.status === 401) setMemberToken('')
        setAuthState(error.status === 401 ? 'unauthenticated' : 'authenticated')
      })
    return () => {
      isMounted = false
    }
  }, [authState])

  const handleSessionExpired = useCallback(() => {
    setMemberToken('')
    setAuthState('unauthenticated')
  }, [])

  function handleLogout() {
    memberApi('/api/member/logout', { method: 'POST', auth: true }).catch(() => {})
    handleSessionExpired()
  }

  if (authState === 'checking') {
    return (
      <div className="app-shell member-page">
        <p className="member-loading" role="status">Loading…</p>
      </div>
    )
  }

  if (authState !== 'authenticated') {
    return <MemberAuthPage onAuthenticated={() => setAuthState('authenticated')} />
  }

  return <MemberDashboard onSessionExpired={handleSessionExpired} onLogout={handleLogout} />
}
