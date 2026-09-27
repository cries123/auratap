import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MEMBER_API_BASE, RESERVED_PATHS } from '../config'
import { usePageMeta } from '../hooks/usePageMeta'
import { AURA_PROFILE_PAGES } from '../data/content'

export function AuraProfilePage() {
  const { profileSlug = '' } = useParams()
  const key = profileSlug.toLowerCase()
  const isReservedPath = RESERVED_PATHS.has(key)
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('loading')

  usePageMeta(
    profile ? profile.name : 'Profile',
    profile ? `${profile.name}: ${profile.headline}` : undefined,
  )

  useEffect(() => {
    if (isReservedPath) {
      return undefined
    }

    let isMounted = true

    async function loadProfile() {
      try {
        const response = await fetch(`${MEMBER_API_BASE}/api/public/profile/${encodeURIComponent(key)}`)
        if (!isMounted) {
          return
        }

        if (response.ok) {
          const data = await response.json()
          setProfile({
            name: data.displayName,
            headline: data.headline,
            subheadline: data.subheadline,
            avatarSrc: data.avatarSrc || '/auralogo.png',
            links: Array.isArray(data.links) ? data.links : [],
          })
          setStatus('ready')
          return
        }
      } catch (error) {
        console.error('Unable to load public profile:', error)
      }

      const fallback = AURA_PROFILE_PAGES[key]
      if (fallback) {
        setProfile(fallback)
        setStatus('ready')
      } else {
        setStatus('not-found')
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [key, isReservedPath])

  if (status === 'loading' && !isReservedPath) {
    return (
      <main className="profile-page-shell">
        <section className="profile-page-card">
          <p>Loading profile...</p>
        </section>
      </main>
    )
  }

  if (isReservedPath || !profile || status === 'not-found') {
    return (
      <main className="profile-page-shell">
        <section className="profile-page-card">
          <h1>Profile not found</h1>
          <p>This Aura Tap page is not active yet.</p>
          <Link to="/" className="profile-home-link">
            Return to Aura Tap
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="profile-page-shell">
      <section className="profile-page-content" aria-label={`${profile.name} profile links`}>
        <img
          src={profile.avatarSrc}
          alt={`${profile.name} profile avatar`}
          className="profile-avatar"
        />
        <h1 className="profile-name">{profile.name}</h1>
        <p className="profile-headline">{profile.headline} <span aria-hidden="true">⚡</span></p>
        <p className="profile-subheadline">{profile.subheadline}</p>

        <div className="profile-link-list">
          {profile.links.map((item) => {
            const isExternal = item.href.startsWith('http')
            return isExternal ? (
              <a
                key={item.label}
                className="profile-link-button"
                href={item.href}
                target="_blank"
                rel="noreferrer"
              >
                {item.label}
              </a>
            ) : (
              <Link key={item.label} className="profile-link-button" to={item.href}>
                {item.label}
              </Link>
            )
          })}
        </div>

        <p className="profile-powered-by">
          <span aria-hidden="true">⚡</span>
          {' '}
          Powered by Aura Taps
        </p>
      </section>
    </main>
  )
}
