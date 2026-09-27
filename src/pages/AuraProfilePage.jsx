import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MEMBER_API_BASE, RESERVED_PATHS } from '../config'
import { usePageMeta } from '../hooks/usePageMeta'
import { AURA_PROFILE_PAGES } from '../data/content'
import { ProfileCard } from '../components/ProfileCard'

export function AuraProfilePage() {
  const { profileSlug = '' } = useParams()
  const navigate = useNavigate()
  const key = profileSlug.toLowerCase()
  const isReservedPath = RESERVED_PATHS.has(key)
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)

  usePageMeta(
    profile ? profile.displayName : 'Profile',
    profile ? [profile.displayName, profile.headline].filter(Boolean).join(': ') : undefined,
  )

  useEffect(() => {
    if (isReservedPath) {
      return undefined
    }

    let isMounted = true

    async function loadProfile() {
      let response
      try {
        response = await fetch(`${MEMBER_API_BASE}/api/public/profile/${encodeURIComponent(key)}`)
      } catch (error) {
        console.error('Unable to load public profile:', error)
      }
      if (!isMounted) {
        return
      }

      if (response?.ok) {
        const data = await response.json()
        // Old links keep working; show the member's current link in the address bar.
        if (data.slug && data.slug !== key) {
          navigate(`/${data.slug}`, { replace: true })
        }
        setProfile({ ...data, links: Array.isArray(data.links) ? data.links : [] })
        setStatus('ready')
        return
      }

      const fallback = AURA_PROFILE_PAGES[key]
      if (fallback) {
        setProfile(fallback)
        setStatus('ready')
      } else {
        setStatus(response?.status === 404 ? 'not-found' : 'error')
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [key, isReservedPath, navigate, attempt])

  if (status === 'loading' && !isReservedPath) {
    return (
      <main className="profile-page-shell">
        <p className="profile-page-status" role="status">Loading…</p>
      </main>
    )
  }

  if (status === 'error' && !isReservedPath) {
    return (
      <main className="profile-page-shell">
        <section className="profile-page-message">
          <h1>We couldn&apos;t load this page</h1>
          <p>Please check your connection and try again.</p>
          <button
            type="button"
            className="profile-save-contact"
            onClick={() => {
              setStatus('loading')
              setAttempt((current) => current + 1)
            }}
          >
            Try again
          </button>
        </section>
      </main>
    )
  }

  if (isReservedPath || !profile || status === 'not-found') {
    return (
      <main className="profile-page-shell">
        <section className="profile-page-message">
          <h1>Profile not found</h1>
          <p>This Aura Tap page isn&apos;t active yet.</p>
          <Link to="/" className="profile-home-link">
            Visit Aura Tap
          </Link>
        </section>
      </main>
    )
  }

  // Built-in fallback pages have no server record, so they can't offer a contact card download.
  const vcardHref = profile.slug
    ? `${MEMBER_API_BASE}/api/public/profile/${encodeURIComponent(profile.slug)}/vcard`
    : undefined

  return (
    <main className="profile-page-shell">
      <ProfileCard profile={profile} vcardHref={vcardHref} />
    </main>
  )
}
