import { useEffect, useRef, useState } from 'react'
import { CONTACT_EMAIL, PUBLIC_SITE_HOST } from '../config'
import { ProfileCard } from './ProfileCard'

// The example on the marketing pages is the real tap page, drawn at phone size inside a phone
// frame, so it always matches what people see when they tap a card.
const EXAMPLE_PROFILE = {
  username: 'example',
  displayName: 'Jay',
  jobTitle: 'CEO, Aura Tap',
  bio: 'Tap to connect. Share your best links instantly.',
  avatarUrl: '/auralogo.png',
  links: [
    { type: 'website', label: 'Book a consultation', value: `${PUBLIC_SITE_HOST}/contact` },
    { type: 'email', label: 'Email me', value: CONTACT_EMAIL },
    { type: 'website', label: 'Buy an Aura Tap card', value: `${PUBLIC_SITE_HOST}/pricing` },
  ],
}

function StatusBar() {
  return (
    <div className="tap-mockup-status">
      <span className="tap-mockup-time">9:41</span>
      <span className="tap-mockup-island" />
      <span className="tap-mockup-indicators">
        <svg viewBox="0 0 18 12" width="18" height="12" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg viewBox="0 0 16 12" width="16" height="12" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
          <path d="M1.4 4.3a9.6 9.6 0 0 1 13.2 0" />
          <path d="M4 7.1a5.9 5.9 0 0 1 8 0" />
          <circle cx="8" cy="10.2" r="1.3" fill="currentColor" stroke="none" />
        </svg>
        <svg viewBox="0 0 27 13" width="27" height="13" fill="currentColor">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.8" fill="none" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="18" height="9" rx="2.3" />
          <path d="M25 4.4v4.2a2.1 2.1 0 0 0 0-4.2Z" opacity="0.45" />
        </svg>
      </span>
    </div>
  )
}

export function TapPageMockup() {
  const frameRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  // Play the page's entrance animation when the phone scrolls into view, like opening the link.
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(frameRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={frameRef} className={`tap-mockup${isVisible ? ' is-visible' : ''}`} aria-hidden="true">
      <div className="tap-mockup-screen">
        <div className="tap-mockup-viewport">
          <StatusBar />
          <div className="profile-page-shell">
            <ProfileCard profile={EXAMPLE_PROFILE} vcardHref="#" isPreview headingLevel={3} />
          </div>
          <div className="tap-mockup-urlbar">
            <svg viewBox="0 0 12 14" width="11" height="13" fill="currentColor">
              <path d="M6 .8a3.7 3.7 0 0 0-3.7 3.7V6H2a1.6 1.6 0 0 0-1.6 1.6v4.8A1.6 1.6 0 0 0 2 14h8a1.6 1.6 0 0 0 1.6-1.6V7.6A1.6 1.6 0 0 0 10 6h-.3V4.5A3.7 3.7 0 0 0 6 .8Zm2.2 5.2H3.8V4.5a2.2 2.2 0 0 1 4.4 0Z" />
            </svg>
            {PUBLIC_SITE_HOST}
          </div>
          <span className="tap-mockup-home" />
        </div>
      </div>
    </div>
  )
}
