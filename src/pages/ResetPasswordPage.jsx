import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import { memberApi, setMemberToken } from '../lib/api'

export function ResetPasswordPage() {
  usePageMeta('Reset Password', 'Choose a new password for your Aura Tap account.')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (password !== confirm) {
      setError("Those passwords don't match.")
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      const data = await memberApi('/api/member/password-reset/confirm', { method: 'POST', body: { token, password } })
      setMemberToken(data.token)
      navigate('/member', { replace: true })
    } catch (submitError) {
      setError(submitError.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app-shell member-page">
      <section className="panel member-auth-card">
        <p className="eyebrow">Aura Tap member portal</p>
        <h1>Choose a new password</h1>

        {!token ? (
          <>
            <p>This reset link is incomplete. Request a new one from the log in page.</p>
            <Link className="btn btn-primary member-btn-primary" to="/member">Go to log in</Link>
          </>
        ) : (
          <form className="member-auth-form" onSubmit={handleSubmit}>
            <label htmlFor="reset-password">New password</label>
            <input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              minLength="8"
              aria-describedby="reset-password-hint"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <p id="reset-password-hint" className="field-hint">At least 8 characters. You&apos;ll be signed out on other devices.</p>

            <label htmlFor="reset-password-confirm">Confirm new password</label>
            <input
              id="reset-password-confirm"
              type="password"
              autoComplete="new-password"
              minLength="8"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              required
            />

            {error && (
              <p className="login-error" role="alert">
                {error}{' '}
                {/expired|invalid/i.test(error) && <Link to="/member">Request a new link</Link>}
              </p>
            )}

            <button type="submit" className="btn btn-primary member-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save new password'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
