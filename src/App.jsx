import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import './App.css'

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'sales@auratap.com'
const PHONE_NUMBER = import.meta.env.VITE_PHONE_NUMBER || '8059033231'
const BOOKING_URL = import.meta.env.VITE_BOOKING_URL || '/contact'
const BUSINESS_ADDRESS = import.meta.env.VITE_BUSINESS_ADDRESS || 'Nationwide'
const CHAT_API_BASE = import.meta.env.VITE_CHAT_API_BASE || 'http://localhost:3001'
const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_BASE || 'http://localhost:3001'
const MEMBER_API_BASE = import.meta.env.VITE_MEMBER_API_BASE || 'http://localhost:3001'
const ADMIN_TOKEN_KEY = 'auratap_admin_token'
const MEMBER_TOKEN_KEY = 'auratap_member_token'

const RESERVED_PATHS = new Set([
  '',
  'how-it-works',
  'testimonials',
  'pricing',
  'contact',
  'privacy',
  'terms',
  'warranty',
  'admin',
  'member',
])

const AURA_PROFILE_PAGES = {
  jay: {
    name: 'Jay',
    headline: 'Founder of Aura Taps',
    subheadline: 'Tap to connect.',
    avatarSrc: '/product-test.png',
    links: [
      { label: 'Book a Consultation', href: '/contact' },
      { label: 'Buy an Aura Tap Card', href: '/pricing' },
      { label: 'My Portfolio', href: 'https://aurataps.net' },
      { label: 'Leave a Google Review', href: 'https://g.page/r/Cf0V3l8f8jY7EAE/review' },
    ],
  },
  placeholder: {
    name: 'Your Name',
    headline: 'Aura Tap Profile',
    subheadline: 'Add your links and contact buttons here.',
    avatarSrc: '/auralogo.png',
    links: [
      { label: 'Book a Consultation', href: '/contact' },
      { label: 'Buy an Aura Tap Card', href: '/pricing' },
      { label: 'My Portfolio', href: 'https://aurataps.net' },
      { label: 'Leave a Google Review', href: 'https://g.page/r/Cf0V3l8f8jY7EAE/review' },
    ],
  },
}

function getAdminAuthHeaders() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  return token
    ? { Authorization: `Bearer ${token}` }
    : {}
}

function getMemberAuthHeaders() {
  const token = localStorage.getItem(MEMBER_TOKEN_KEY)
  return token
    ? { Authorization: `Bearer ${token}` }
    : {}
}

function trackEvent(eventName, payload = {}) {
  if (typeof window === 'undefined') {
    return
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, payload)
  }

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event: eventName, ...payload })
}

function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)

  return (
    <header className="top-nav panel">
      <p className="brand" aria-label="Aura Tap">
        <img src="/auralogo.png" alt="Aura Tap" className="brand-logo" />
        <span className="brand-wordmark">AURA TAP</span>
        <span className="sr-only">Aura Tap</span>
      </p>

      {/* Desktop nav */}
      <div className="top-nav-right top-nav-desktop">
        <a className="top-phone" href={`tel:${PHONE_NUMBER}`}>
          Prefer to talk? {PHONE_NUMBER}
        </a>
        <nav>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/how-it-works">How It Works</NavLink>
          <NavLink to="/testimonials">Testimonials</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
          <NavLink to="/warranty">Warranty</NavLink>
          <NavLink to="/member">Member Portal</NavLink>
          <NavLink to="/contact" onClick={() => trackEvent('contact_click', { source: 'top_nav' })}>
            Contact Us
          </NavLink>
        </nav>
      </div>

      {/* Mobile hamburger button */}
      <button
        className="nav-hamburger"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <span className={`ham-line${menuOpen ? ' open' : ''}`} />
        <span className={`ham-line${menuOpen ? ' open' : ''}`} />
        <span className={`ham-line${menuOpen ? ' open' : ''}`} />
      </button>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav className="mobile-nav-menu" onClick={close}>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/how-it-works">How It Works</NavLink>
          <NavLink to="/testimonials">Testimonials</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
          <NavLink to="/warranty">Warranty</NavLink>
          <NavLink to="/member">Member Portal</NavLink>
          <NavLink to="/contact" onClick={() => trackEvent('contact_click', { source: 'top_nav' })}>
            Contact Us
          </NavLink>
          <a className="top-phone mobile-phone-link" href={`tel:${PHONE_NUMBER}`}>
            📞 {PHONE_NUMBER}
          </a>
        </nav>
      )}
    </header>
  )
}

function AuraProfilePage() {
  const { profileSlug = '' } = useParams()
  const key = profileSlug.toLowerCase()
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let isMounted = true

    if (RESERVED_PATHS.has(key)) {
      setStatus('not-found')
      return () => {
        isMounted = false
      }
    }

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
  }, [key])

  if (status === 'loading') {
    return (
      <main className="profile-page-shell">
        <section className="profile-page-card">
          <p>Loading profile...</p>
        </section>
      </main>
    )
  }

  if (!profile || status === 'not-found') {
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

function HomePage() {
  const [showRoiPage, setShowRoiPage] = useState(false)
  const [isHeroDemoActive, setIsHeroDemoActive] = useState(false)

  const benefits = [
    {
      title: 'Zero Recurring Costs',
      text: 'Stop re-ordering paper cards every time someone gets promoted. Update profiles in seconds, anytime.',
    },
    {
      title: 'Instant Lead Capture',
      text: 'Clients can save you or your team directly to their phone contacts, not lose a card in a stack later.',
    },
    {
      title: 'Brand Authority',
      text: 'A matte black Aura Card or custom NFC wristband signals modern, tech-forward confidence.',
    },
  ]

  const rebuttals = [
    {
      q: 'We already have paper cards.',
      a: 'Most teams do, until they realize they spend $50+ per employee every time details change. Aura Tap is a one-time $20 investment per person.',
    },
    {
      q: 'Is it hard to set up?',
      a: 'No. It takes around 60 seconds to connect each card. Team bundles include onboarding support so everyone is ready immediately.',
    },
    {
      q: 'Why would we want wristbands?',
      a: 'Wristbands are ideal for field teams and events. They are hands-free and built for quick networking while moving.',
    },
  ]

  const testimonials = [
    {
      text: 'Aura Tap transformed how we network at events. Our team closes 40% more leads since we switched from paper cards.',
      author: 'Sarah Martinez',
      company: 'SLO Real Estate Group',
      role: 'Sales Director',
    },
    {
      text: 'Setup was a breeze. Within an hour, all 15 of our team members had their cards configured and ready to go.',
      author: 'James Chen',
      company: '805 Home Services',
      role: 'Owner',
    },
    {
      text: 'The wristbands are perfect for our field crews. Clients can save contact info instantly without fumbling for a card.',
      author: 'Miguel Rodriguez',
      company: 'Central Coast Plumbing',
      role: 'Operations Manager',
    },
    {
      text: 'As a solo photographer, the Aura Card made me look premium and helped me get more callbacks after every shoot.',
      author: 'Alyssa Grant',
      company: 'Independent Creative',
      role: 'Freelance Photographer',
    },
    {
      text: 'I am a solo realtor, and this made sharing my listings and contact details way faster at open houses.',
      author: 'Derrick Sloan',
      company: 'Independent Professional',
      role: 'Solo Realtor',
    },
    {
      text: 'As a one-person mobile detailer, the card helps clients save my info instantly and book repeat services easier.',
      author: 'Nina Lopez',
      company: 'Independent Professional',
      role: 'Mobile Detail Specialist',
    },
  ]

  const clientLogos = [
    'Central Coast Plumbing',
    'SLO Real Estate Group',
    'Pacific Event Pros',
    '805 Home Services',
  ]

  const trustBadges = [
    '12-Month Warranty',
    'Setup Included',
    'No Monthly Fees',
    'Nationwide Support',
  ]

  const howItWorks = [
    {
      step: '01',
      title: 'Tap or scan in seconds',
      text: 'Someone taps your Aura device or scans the QR code and lands on your digital profile instantly.',
    },
    {
      step: '02',
      title: 'Show your best links',
      text: 'Display contact info, social links, listings, booking links, portfolio pages, and more in one clean profile.',
    },
    {
      step: '03',
      title: 'Update without reprinting',
      text: 'Change your details later without buying new cards every time your role, phone, or links change.',
    },
  ]

  const faqs = [
    {
      q: 'Does it work with iPhone and Android?',
      a: 'Yes. Most modern smartphones support NFC tap or QR scan, so people can open your profile without downloading an app.',
    },
    {
      q: 'Can I update my info later?',
      a: 'Yes. Your profile can be updated after setup, so your card or wristband stays useful even if your info changes.',
    },
    {
      q: 'Do I need an app to use Aura Tap?',
      a: 'No app is required for the person receiving your details. The tap opens a profile page directly in their browser.',
    },
    {
      q: 'How long does setup take?',
      a: 'Most individual setups take about a minute. Team bundles include installation support so rollout is fast and consistent.',
    },
    {
      q: 'What happens if my card stops working?',
      a: 'Manufacturing faults are covered under the 12-month warranty. Lost or stolen products are not covered.',
    },
  ]

  return (
    <>
      <header className="hero hero-shell">
        <div className="hero-copy">
          <p className="eyebrow">Aura Tap | NFC Cards + Wristbands</p>
          <p className="local-badge">Serving Clients Nationwide</p>
          <h1>Deliver a professional first impression.</h1>
          <p className="lead">
            Premium NFC cards and wristbands that help you or your team share
            contact info, booking links, portfolios, and socials with one tap.
            No stacks. No waste. No reprints.
          </p>
          <div className="hero-actions">
            <a
              className="btn btn-primary"
              href={BOOKING_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackEvent('book_demo_click', { source: 'hero' })}
            >
              Book a 5-Min Demo
            </a>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                trackEvent('roi_open', { source: 'hero' })
                setShowRoiPage(true)
              }}
            >
              See ROI Math
            </button>
          </div>
          <div className="hero-rating-strip">
            <span>Trusted by local teams</span>
            <strong>15,000+ products sold</strong>
            <span>180+ clients served</span>
          </div>
        </div>

        <div className="hero-visual">
          <div
            className={`hero-tap-demo${isHeroDemoActive ? ' is-active' : ''}`}
            onMouseEnter={() => setIsHeroDemoActive(true)}
            onMouseLeave={() => setIsHeroDemoActive(false)}
            onClick={() => setIsHeroDemoActive((current) => !current)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setIsHeroDemoActive((current) => !current)
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Interactive tap demo"
          >
            <p className="hero-proof-label">Live Tap Preview</p>
            <div className="hero-demo-shell">
              <div className="hero-phone" role="img" aria-label="Phone preview of Aura Tap profile">
                <div className="hero-phone-notch" />
                <div className="hero-phone-screen">
                  <div className="hero-screen-placeholder" aria-hidden="true">
                    <span className="hero-placeholder-avatar" />
                    <span className="hero-placeholder-line hero-placeholder-line-wide" />
                    <span className="hero-placeholder-line" />
                    <span className="hero-placeholder-pill" />
                    <span className="hero-placeholder-pill" />
                    <span className="hero-placeholder-pill" />
                  </div>
                  <img
                    src="/jay-profile-preview.png"
                    alt="Profile page shown after tapping Aura card"
                    className="hero-phone-screen-image"
                  />
                </div>
              </div>

              <div className="hero-nfc-card" aria-hidden="true">
                <span className="hero-nfc-card-label">AURA</span>
              </div>
            </div>

            <p className="hero-demo-hint">Hover over this area to tap ↑</p>
          </div>
        </div>
      </header>

      <section className="panel trust-badges-row" aria-label="Trust badges">
        {trustBadges.map((badge) => (
          <article key={badge} className="trust-badge-card">
            <span className="trust-badge-dot" />
            <p>{badge}</p>
          </article>
        ))}
      </section>

      <section className="benefits">
        {benefits.map((benefit, index) => (
          <article className="panel benefit" key={benefit.title}>
            <p className="index">0{index + 1}</p>
            <h3>{benefit.title}</h3>
            <p>{benefit.text}</p>
          </article>
        ))}
      </section>



      <section className="products panel">
        <h2>Products Designed for Professional Outreach</h2>
        <div className="product-grid">
          <article className="product-card-article">
            <div className="product-img-wrap">
              <img
                src="/product-cards.png"
                alt="Aura NFC Card — matte black card with AURA branding"
                className="product-img product-img-card"
              />
            </div>
            <h3>Aura Card</h3>
            <p className="product-kicker">Best for realtors, photographers, consultants, sales reps</p>
            <p>
              Minimal matte-black NFC card for executives, sales reps, and
              consultants who want premium presentation.
            </p>
            <ul className="product-points">
              <li>Premium matte-black finish</li>
              <li>Instant contact sharing</li>
              <li>Update details without reprinting</li>
            </ul>
          </article>
          <article className="product-wristband-article">
            <div className="product-img-wrap product-img-wrap--light">
              <img
                src="/product-wristband.png"
                alt="Aura NFC Wristband — black silicone wristband with AURA branding"
                className="product-img product-img-wristband"
              />
            </div>
            <h3>Aura Wristband</h3>
            <p className="product-kicker">Best for events, crews, field teams, trade shows</p>
            <p>
              Hands-free NFC sharing for events, field teams, and trade show
              environments where speed matters.
            </p>
            <ul className="product-points">
              <li>Easy to wear all day</li>
              <li>Ideal for fast-paced environments</li>
              <li>Built for repeat taps and demos</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="panel comparison-section">
        <div className="section-intro">
          <p className="eyebrow">Before and After</p>
          <h2>A Clear Advantage Over Paper Cards</h2>
        </div>
        <div className="comparison-grid">
          <article className="comparison-card comparison-card-before">
            <p className="comparison-label">Paper Card</p>
            <ul>
              <li>Gets lost in wallets or stacks</li>
              <li>Needs reprints when info changes</li>
              <li>Only shows one phone number and one email</li>
              <li>Feels forgettable after the meeting ends</li>
            </ul>
          </article>
          <article className="comparison-card comparison-card-after">
            <p className="comparison-label">Aura Tap</p>
            <ul>
              <li>Instant save-to-phone experience</li>
              <li>Update links later without replacing hardware</li>
              <li>Show socials, listings, calendar, and portfolio together</li>
              <li>Feels premium, modern, and memorable</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="panel trust-grid">
        <article>
          <h2>Trusted by Organizations Nationwide</h2>
          <div className="logo-cloud">
            {clientLogos.map((logo) => (
              <span key={logo}>{logo}</span>
            ))}
          </div>
          <p className="note">Trusted by teams and professionals nationwide.</p>
        </article>
        <article>
          <h2>Performance Metrics</h2>
          <ul className="metrics">
            <li>
              <strong>34%</strong> higher follow-up rate after switching from paper cards.
            </li>
            <li>
              <strong>2.4x</strong> faster contact exchange at events.
            </li>
            <li>
              <strong>600+</strong> annual paper-card reorders eliminated for one 30-person team.
            </li>
          </ul>
        </article>
      </section>

      <section className="panel objections">
        <h2>Common Questions and Answers</h2>
        {rebuttals.map((item) => (
          <article key={item.q}>
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </article>
        ))}
      </section>

      <section className="panel faq-section">
        <div className="section-intro">
          <p className="eyebrow">Frequently Asked Questions</p>
          <h2>Questions Decision-Makers Ask Before Purchase</h2>
        </div>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q} className="faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="panel closing-cta" id="demo">
        <div className="closing-copy">
          <p className="eyebrow">Get Started</p>
          <h2>Upgrade from paper cards to a smarter first impression</h2>
          <p>
            Anywhere in the U.S.? We can run a 5-minute remote demo and help
            you choose the right setup, whether you are solo or scaling a team.
          </p>
          <p className="cta-line">Schedule a brief consultation to review your setup options.</p>
          <div className="hero-actions">
            <Link
              className="btn btn-primary"
              to="/contact"
              onClick={() => trackEvent('contact_click', { source: 'cta' })}
            >
              Contact Aura Tap
            </Link>
            <Link className="btn btn-secondary" to="/pricing">
              View Pricing
            </Link>
          </div>
        </div>
        <figure className="closing-visual-placeholder closing-showcase-frame">
          <img
            src="/product-showcase.png"
            alt="Aura Tap product showcase"
            className="closing-showcase-image"
          />
          <figcaption>Professional presentation that closes the conversation.</figcaption>
        </figure>
      </section>

      {showRoiPage && (
        <section className="roi-overlay" aria-labelledby="roi-heading" role="dialog">
          <article className="roi-page panel">
            <div className="roi-top">
              <p className="eyebrow">ROI Analysis</p>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setShowRoiPage(false)}
              >
                Close ROI
              </button>
            </div>
            <h2 id="roi-heading">ROI Snapshot</h2>
            <p className="math">
              Paper: $40 x 10 employees x 2 orders/year =
              <strong> $800/year</strong>
            </p>
            <p className="math">
              Aura Tap: $20 x 10 cards one-time = <strong>$200 total</strong>
            </p>
            <p className="savings">
              Year-one savings: <strong>$600</strong>. Ongoing annual savings:
              <strong> $800</strong>.
            </p>
          </article>
        </section>
      )}

      <section className="panel warranty-disclaimer">
        <p>
          &#127775; All Aura Tap devices come with a <strong>12-month warranty</strong> against manufacturing defects.{' '}
          <Link to="/warranty">View full warranty details &rarr;</Link>
        </p>
      </section>

      <Footer />
    </>
  )
}

function HowItWorksPage() {
  const howItWorks = [
    {
      step: '01',
      title: 'Tap or scan in seconds',
      text: 'Someone taps your Aura device or scans the QR code and lands on your digital profile instantly.',
    },
    {
      step: '02',
      title: 'Show your best links',
      text: 'Display contact info, social links, listings, booking links, portfolio pages, and more in one clean profile.',
    },
    {
      step: '03',
      title: 'Update without reprinting',
      text: 'Change your details later without buying new cards every time your role, phone, or links change.',
    },
  ]

  return (
    <>
      <SubpageHero
        eyebrow="How It Works"
        title="A Simple Three-Step Process"
        subtitle="This page outlines the complete user flow from initial tap to profile engagement and ongoing updates."
        chips={['Three simple steps', 'Update anytime', 'No reprinting needed']}
        mediaImageSrc="/products-howto.png"
        mediaImageAlt="Aura NFC cards and wristbands displayed on a wooden surface"
        mediaText=""
      />

      <section className="panel how-it-works">
        <div className="process-grid">
          {howItWorks.map((item) => (
            <article className="process-card" key={item.step}>
              <p className="process-step">{item.step}</p>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel tap-demo">
        <div className="tap-demo-copy">
          <p className="eyebrow">Platform Preview</p>
          <h2>Preview the Post-Tap Experience</h2>
          <p>
            Buyers convert faster when they can picture the result. This mockup
            shows the profile someone sees after tapping your card or wristband.
          </p>
          <ul className="demo-points">
            <li>Save contact in seconds</li>
            <li>Open social and booking links instantly</li>
            <li>Present one polished page instead of five separate links</li>
          </ul>
        </div>
        <figure className="tap-demo-photo-frame" aria-label="Aura Tap profile preview after card tap">
          <img
            src="/jay-profile-preview.png"
            alt="Aura card and phone profile preview after tapping"
            className="tap-demo-photo"
          />
          <figcaption>
            Tap once and your full profile appears instantly.
          </figcaption>
        </figure>
      </section>

      <Footer />
    </>
  )
}

function TestimonialsPage() {
  const testimonials = [
    {
      text: 'Aura Tap transformed how we network at events. Our team closes 40% more leads since we switched from paper cards.',
      author: 'Sarah Martinez',
      company: 'SLO Real Estate Group',
      role: 'Sales Director',
    },
    {
      text: 'Setup was a breeze. Within an hour, all 15 of our team members had their cards configured and ready to go.',
      author: 'James Chen',
      company: '805 Home Services',
      role: 'Owner',
    },
    {
      text: 'The wristbands are perfect for our field crews. Clients can save contact info instantly without fumbling for a card.',
      author: 'Miguel Rodriguez',
      company: 'Central Coast Plumbing',
      role: 'Operations Manager',
    },
    {
      text: 'As a solo photographer, the Aura Card made me look premium and helped me get more callbacks after every shoot.',
      author: 'Alyssa Grant',
      company: 'Independent Creative',
      role: 'Freelance Photographer',
    },
    {
      text: 'I am a solo realtor, and this made sharing my listings and contact details way faster at open houses.',
      author: 'Derrick Sloan',
      company: 'Independent Professional',
      role: 'Solo Realtor',
    },
    {
      text: 'As a one-person mobile detailer, the card helps clients save my info instantly and book repeat services easier.',
      author: 'Nina Lopez',
      company: 'Independent Professional',
      role: 'Mobile Detail Specialist',
    },
  ]

  return (
    <>
      <SubpageHero
        eyebrow="Testimonials"
        title="Client Testimonials"
        subtitle="Verified feedback from professionals, teams, and businesses nationwide using Aura Tap in daily operations."
        chips={['180+ clients served', 'Real customer stories', 'Nationwide service']}
        mediaImageSrc="/product-test.png"
        mediaImageAlt="Aura Tap products used by real clients"
        mediaText=""
      />

      <section className="testimonials">
        <div className="testimonials-grid">
          {testimonials.map((testimonial) => (
            <article key={testimonial.author} className="panel testimonial">
              <p className="testimonial-text">"{testimonial.text}"</p>
              <p className="testimonial-author">{testimonial.author}</p>
              <p className="testimonial-role">
                {testimonial.company} | {testimonial.role}
              </p>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </>
  )
}

function SubpageHero({
  eyebrow,
  title,
  subtitle,
  chips = [],
  mediaLabel = 'Visual Placeholder',
  mediaText = 'Add a relevant image or screenshot here.',
  mediaImageSrc,
  mediaImageAlt = '',
}) {
  return (
    <section className="panel subpage-hero">
      <div className="subpage-hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {chips.length > 0 && (
          <div className="subpage-chip-row">
            {chips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
        )}
      </div>
      <aside className={`subpage-hero-media${mediaImageSrc ? ' has-media-image' : ''}`}>
        {mediaImageSrc ? (
          <figure className="subpage-hero-media-figure">
            <img src={mediaImageSrc} alt={mediaImageAlt} className="subpage-hero-media-image" />
            {mediaText ? <figcaption>{mediaText}</figcaption> : null}
          </figure>
        ) : (
          <>
            <strong>{mediaLabel}</strong>
            <p>{mediaText}</p>
          </>
        )}
      </aside>
    </section>
  )
}

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    teamSize: '',
    message: '',
  })
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const CONTACT_API = `${CHAT_API_BASE}/api/contact`

  function onChange(event) {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    trackEvent('contact_form_submit', { source: 'contact_page' })

    setIsSubmitting(true)
    setStatus('')

    try {
      const response = await fetch(CONTACT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          company: formData.company,
          email: formData.email,
          teamSize: formData.teamSize,
          message: formData.message,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Unable to send inquiry')
      }

      setFormData({
        name: '',
        company: '',
        email: '',
        teamSize: '',
        message: '',
      })
      setStatus('Thanks, your inquiry was sent. We will follow up shortly.')
      trackEvent('contact_form_submit_success', { source: 'contact_page' })
    } catch (submitError) {
      console.error('Contact form submit failed:', submitError)
      setStatus('We could not submit right now. Please email us directly.')
      trackEvent('contact_form_submit_error', { source: 'contact_page' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <SubpageHero
        eyebrow="Get Started"
        title="Contact Aura Tap"
        subtitle="Tell us about your team and goals. We will recommend the right card or wristband setup and guide your rollout."
        chips={[
          'Response in 1 business day',
          'Nationwide support',
          'Setup guidance included',
        ]}
        mediaLabel="Contact visual placeholder"
        mediaText="Drop in a team photo, product demo shot, or behind-the-scenes setup image."
      />

      <section className="panel contact-intro">
        <div className="contact-channels">
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackEvent('book_demo_click', { source: 'contact_page' })}
          >
            Preferred Booking Path
          </a>
          <span className="contact-response-chip">Average response: same day</span>
        </div>
      </section>

      <section className="panel contact-layout">
        <form className="lead-form" onSubmit={onSubmit}>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" value={formData.name} onChange={onChange} required />

          <label htmlFor="company">Company</label>
          <input id="company" name="company" value={formData.company} onChange={onChange} required />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={onChange}
            required
          />

          <label htmlFor="teamSize">Team Size</label>
          <input
            id="teamSize"
            name="teamSize"
            type="number"
            min="1"
            value={formData.teamSize}
            onChange={onChange}
            required
          />

          <label htmlFor="message">Short Message</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={onChange}
            rows="5"
            required
          />

          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Inquiry'}
          </button>
          {status && <p className="form-status">{status}</p>}
        </form>

        <aside className="contact-side-card">
          <h3>What Happens Next</h3>
          <ol>
            <li>We review your goals and team size.</li>
            <li>We recommend your ideal card/wristband mix.</li>
            <li>We schedule setup and activation support.</li>
          </ol>
          <div className="contact-side-placeholder">
            <strong>Media placeholder</strong>
            <p>Add a contact/support image for social proof.</p>
          </div>
        </aside>
      </section>

      <section className="panel contact-next-steps">
        <article>
          <p className="step-kicker">01</p>
          <h3>Discovery Call</h3>
          <p>We clarify your goals, team workflow, and preferred device type.</p>
        </article>
        <article>
          <p className="step-kicker">02</p>
          <h3>Setup Plan</h3>
          <p>We map profile fields, links, and rollout details for your team.</p>
        </article>
        <article>
          <p className="step-kicker">03</p>
          <h3>Launch Support</h3>
          <p>We help your team activate cards and start using them confidently.</p>
        </article>
      </section>

      <Footer />
    </>
  )
}

function PricingPage() {
  return (
    <>
      <SubpageHero
        eyebrow="Pricing"
        title="Clear Pricing. Strong Return on Investment."
        subtitle="Simple one-time pricing designed for solo operators, growing teams, and enterprise deployments."
        chips={['One-time purchase', '$99 setup included with bundles', 'No recurring platform fees']}
        mediaImageSrc="/product-pricing.png"
        mediaImageAlt="Aura Tap pricing showcase"
        mediaText="Professional-grade NFC cards and wristbands prepared for scalable team deployment."
      />

      <section className="panel pricing-value-strip">
        <article>
          <strong>No Monthly Fees</strong>
          <p>Pay once and keep sharing.</p>
        </article>
        <article>
          <strong>Fast Setup</strong>
          <p>Most users are ready in minutes.</p>
        </article>
        <article>
          <strong>Built to Scale</strong>
          <p>From solo pros to multi-location teams.</p>
        </article>
      </section>

      <section className="panel pricing" id="pricing">
        <h2>Individual Pricing</h2>

        <div className="pricing-grid">
          <article>
            <p className="pricing-plan-tag">Popular for solo pros</p>
            <h3>NFC Card</h3>
            <p className="price">$20 each</p>
            <p>One-time setup and unlimited profile edits.</p>
          </article>
          <article>
            <p className="pricing-plan-tag">Best for events</p>
            <h3>NFC Wristband</h3>
            <p className="price">$25 each</p>
            <p>Best for field teams and live-event networking.</p>
          </article>
          <article>
            <p className="pricing-plan-tag">Brand upgrade</p>
            <h3>Custom Branding Add-On</h3>
            <p className="price">$5 per unit</p>
            <p>Logo and brand styling for a stronger first impression.</p>
          </article>
        </div>

        <h2 className="pricing-heading">Enterprise Bundles</h2>
        <div className="pricing-grid">
          <article>
            <p className="pricing-plan-tag">Starter rollout</p>
            <h3>Starter Team</h3>
            <p className="price"><s className="price-was">$299</s> $225 / 10 cards</p>
            <p>Includes onboarding support for your full team rollout.</p>
          </article>
          <article className="pricing-featured">
            <p className="pricing-pill">Most Popular</p>
            <h3>Growth Team</h3>
            <p className="price"><s className="price-was">$599</s> $349 / 25 mixed units</p>
            <p>Mix cards and wristbands for office staff and field reps.</p>
          </article>
          <article>
            <p className="pricing-plan-tag">Scale package</p>
            <h3>Enterprise Rollout</h3>
            <p className="price"><s className="price-was">$1,099</s> $499 / 50 mixed units</p>
            <p>Includes onboarding call, activation support, and priority service.</p>
          </article>
        </div>
        <p className="pricing-note">
          All bundle prices include a $99 one-time installation &amp; setup fee.
        </p>
        <p className="pricing-note">
          Need a larger rollout? Use the Contact Us page and we will tailor pricing
          for your organization.
        </p>
      </section>

      <Footer />
    </>
  )
}

function WarrantyPage() {
  return (
    <>
      <SubpageHero
        eyebrow="Warranty"
        title="Coverage Built for Confidence"
        subtitle="Every Aura Tap device includes a 12-month limited warranty for manufacturing faults."
        chips={['12 months coverage', 'Fast claim review', 'Replacement support']}
        mediaImageSrc="/product-warranty.png"
        mediaImageAlt="Aura Tap product warranty coverage"
        mediaText=""
      />

      <section className="panel warranty-highlight-grid">
        <article>
          <h3>Coverage Window</h3>
          <p>12 months from purchase date for manufacturing faults and hardware issues.</p>
        </article>
        <article>
          <h3>Response Time</h3>
          <p>Most valid claims are reviewed within 2 business days after submission.</p>
        </article>
        <article>
          <h3>Claim Outcome</h3>
          <p>Approved claims receive an equivalent replacement product at no charge.</p>
        </article>
      </section>

      <section className="panel warranty-panel">
        <div className="warranty-badge">12-Month Warranty</div>
        <h1>Simple, Clear Warranty Process</h1>
        <p>
          Every Aura Tap NFC card and wristband includes a <strong>12-month limited warranty</strong>{' '}
          for manufacturing defects. Below is exactly what is covered and how to file a claim.
        </p>

        <div className="warranty-detail-grid">
          <article className="warranty-detail-card">
            <h2>What&apos;s Covered</h2>
            <ul className="warranty-list">
              <li>Defective NFC chip or hardware failure</li>
              <li>Delamination or print defects present on arrival</li>
              <li>Non-responsive device under normal use conditions</li>
            </ul>
          </article>
          <article className="warranty-detail-card">
            <h2>What&apos;s Not Covered</h2>
            <ul className="warranty-list">
              <li>Loss or theft</li>
              <li>Physical damage, punctures, cracks, or bending</li>
              <li>Water damage beyond normal use</li>
              <li>Unauthorized modifications or normal wear and tear</li>
            </ul>
          </article>
        </div>

        <h2>How to File a Claim</h2>
        <p>
          Email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{' '}
          with the following:
        </p>
        <ul className="warranty-list">
          <li>&#10148; Your order number</li>
          <li>&#10148; A brief description of the fault</li>
          <li>&#10148; A photo of the defective device if possible</li>
        </ul>

        <div className="warranty-timeline">
          <article>
            <p className="step-kicker">Step 1</p>
            <h3>Submit Claim</h3>
            <p>Email order number and issue details.</p>
          </article>
          <article>
            <p className="step-kicker">Step 2</p>
            <h3>Review</h3>
            <p>We validate the fault and confirm eligibility.</p>
          </article>
          <article>
            <p className="step-kicker">Step 3</p>
            <h3>Replacement</h3>
            <p>Approved claims receive an equivalent device.</p>
          </article>
        </div>

        <p className="warranty-policy-note">
          Approved claims are replaced with an equivalent product at no charge. Refunds are not issued under warranty.
        </p>
        <p className="warranty-policy-note">
          Coverage starts on the purchase date. Claims submitted after 12 months are not eligible.
        </p>
      </section>
      <Footer />
    </>
  )
}

function PrivacyPage() {
  return (
    <>
      <SubpageHero
        eyebrow="Privacy"
        title="Privacy Policy"
        subtitle="How Aura Tap collects, uses, and protects your information."
        chips={['No data resale', 'Clear retention policy', 'Request access or deletion']}
        mediaLabel="Policy visual placeholder"
        mediaText="Use a trust/security themed image for this area."
      />

      <section className="legal-layout">
        <aside className="panel legal-toc">
          <h3>On This Page</h3>
          <a href="#privacy-who">Who we are</a>
          <a href="#privacy-collect">Information we collect</a>
          <a href="#privacy-use">How we use data</a>
          <a href="#privacy-rights">Your rights</a>
          <a href="#privacy-contact">Contact</a>
        </aside>

        <section className="panel legal-page legal-content-card">
          <p className="legal-updated">Last updated: April 16, 2026</p>

        <h2 id="privacy-who">1. Who We Are</h2>
        <p>
          Aura Tap (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a U.S.-based business that sells
          NFC smart cards and wristbands. Our contact email is{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        <h2 id="privacy-collect">2. Information We Collect</h2>
        <p>We collect information in the following ways:</p>
        <ul>
          <li><strong>Inquiry forms:</strong> name, company, email address, team size, and message content submitted via our contact form or chat widget.</li>
          <li><strong>Order information:</strong> billing/shipping address, phone number, and payment details processed through our payment processor. We do not store full card numbers.</li>
          <li><strong>Usage data:</strong> pages visited, browser type, operating system, and referring URL collected via analytics tools (e.g., Google Analytics). This data is aggregated and non-personally identifiable.</li>
          <li><strong>Cookies:</strong> small files stored in your browser to remember preferences and measure site performance. You may disable cookies in your browser settings.</li>
        </ul>

        <h2 id="privacy-use">3. How We Use Your Information</h2>
        <ul>
          <li>To respond to inquiries and deliver products or services you purchase.</li>
          <li>To send transactional emails (order confirmations, onboarding instructions).</li>
          <li>To improve our website and understand how visitors engage with our content.</li>
          <li>To comply with legal obligations or enforce our Terms of Service.</li>
        </ul>
        <p>We do <strong>not</strong> sell, rent, or trade your personal information to third parties.</p>

        <h2>4. How We Share Your Information</h2>
        <p>
          We share data only with trusted service providers who help us operate our business
          (e.g., payment processors, email delivery services, analytics platforms). These providers
          are contractually required to protect your data and may not use it for their own purposes.
        </p>

        <h2>5. Data Retention</h2>
        <p>
          Inquiry and order data is retained for up to 3 years for business and tax records, or
          until you request deletion, whichever comes first.
        </p>

        <h2 id="privacy-rights">6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you.</li>
          <li>Request correction of inaccurate data.</li>
          <li>Request deletion of your data (subject to legal retention obligations).</li>
          <li>Opt out of marketing communications at any time by replying &quot;unsubscribe.&quot;</li>
        </ul>
        <p>
          To exercise any of these rights, email us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        <h2>7. Security</h2>
        <p>
          We use industry-standard measures (HTTPS, encrypted storage, access controls) to protect
          your information. No transmission over the internet is 100% secure, and we cannot
          guarantee absolute security.
        </p>

        <h2>8. Children&apos;s Privacy</h2>
        <p>
          Our services are not directed to individuals under 13. We do not knowingly collect
          personal information from children.
        </p>

        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this policy periodically. Material changes will be posted on this page
          with an updated &quot;Last updated&quot; date. Continued use of our site after changes
          constitutes acceptance.
        </p>

        <h2 id="privacy-contact">10. Contact</h2>
        <p>
          Questions about this policy? Reach us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or call{' '}
          <a href={`tel:${PHONE_NUMBER}`}>{PHONE_NUMBER}</a>.
        </p>
        </section>
      </section>
      <Footer />
    </>
  )
}

function TermsPage() {
  return (
    <>
      <SubpageHero
        eyebrow="Terms"
        title="Terms of Service"
        subtitle="Clear rules for orders, usage, support, and warranty terms."
        chips={['Transparent policy', 'California governing law', 'Direct support contact']}
        mediaLabel="Terms visual placeholder"
        mediaText="Use a contract/document themed image in this placeholder."
      />

      <section className="legal-layout">
        <aside className="panel legal-toc">
          <h3>On This Page</h3>
          <a href="#terms-acceptance">Acceptance</a>
          <a href="#terms-pricing">Pricing and payment</a>
          <a href="#terms-returns">Returns</a>
          <a href="#terms-warranty">Warranty</a>
          <a href="#terms-contact">Contact</a>
        </aside>

        <section className="panel legal-page legal-content-card">
          <p className="legal-updated">Last updated: April 16, 2026</p>

        <h2 id="terms-acceptance">1. Acceptance of Terms</h2>
        <p>
          By accessing this website or purchasing products from Aura Tap, you agree to be bound
          by these Terms of Service and our Privacy Policy. If you do not agree, please do not
          use our site or services.
        </p>

        <h2>2. Products &amp; Services</h2>
        <p>
          Aura Tap sells NFC smart cards and wristbands for personal and business networking use.
          All products are sold subject to availability. We reserve the right to limit quantities
          or discontinue any product at any time.
        </p>

        <h2 id="terms-pricing">3. Pricing &amp; Payment</h2>
        <ul>
          <li>All prices are listed in USD and are subject to change without notice prior to order confirmation.</li>
          <li>Bundle prices include a one-time $99 installation &amp; setup fee.</li>
          <li>Payment is due in full at the time of purchase. We accept major credit/debit cards.</li>
          <li>Custom branding orders may require a deposit before production begins.</li>
        </ul>

        <h2>4. Orders &amp; Fulfillment</h2>
        <p>
          Orders are processed within 1–3 business days. Estimated delivery times are provided
          at checkout and are not guaranteed. Aura Tap is not responsible for carrier delays.
          Risk of loss transfers to you upon shipment.
        </p>

        <h2>5. Installation &amp; Setup</h2>
        <p>
          The $99 installation &amp; setup fee covers remote or in-person onboarding assistance
          to activate and configure your NFC devices. Setup sessions must be scheduled within
          60 days of purchase. Unused setup sessions are non-refundable after 60 days.
        </p>

        <h2 id="terms-returns">6. Returns &amp; Refunds</h2>
        <ul>
          <li><strong>Unopened/unconfigured items</strong> may be returned within 14 days of delivery for a full product refund (excluding the $99 setup fee and shipping).</li>
          <li><strong>Custom-branded items</strong> are non-refundable once production has begun.</li>
          <li>To initiate a return, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with your order number.</li>
        </ul>

        <h2>7. NFC Profile &amp; Digital Content</h2>
        <p>
          You are solely responsible for the content linked to your NFC device. You agree not to
          link to content that is illegal, harmful, defamatory, or violates third-party rights.
          Aura Tap reserves the right to deactivate a device profile that violates these terms.
        </p>

        <h2>8. Intellectual Property</h2>
        <p>
          All content on this website — including text, graphics, logos, and product designs —
          is the property of Aura Tap and may not be reproduced without written permission.
        </p>

        <h2>9. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Aura Tap shall not be liable for any indirect,
          incidental, special, or consequential damages arising from your use of our products or
          website. Our total liability for any claim shall not exceed the amount you paid for the
          product in question.
        </p>

        <h2 id="terms-warranty">10. Limited Product Warranty</h2>
        <p>
          Aura Tap provides a <strong>12-month limited warranty</strong> on all NFC cards and
          wristbands against manufacturing defects and hardware faults from the date of purchase.
        </p>
        <ul>
          <li>Warranty covers: defective NFC chip, hardware failure, or print/delamination defects present on arrival.</li>
          <li>Warranty does <strong>not</strong> cover: loss, theft, physical damage, water damage, unauthorized modification, or normal wear and tear.</li>
          <li>To make a claim, contact <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with proof of purchase within the warranty period.</li>
          <li>Approved warranty claims will be replaced with an equivalent product at no charge. Refunds are not issued under warranty.</li>
        </ul>

        <h2>11. Disclaimer of Implied Warranties</h2>
        <p>
          Except as stated in Section 10, products are provided &quot;as is.&quot; We make no additional
          warranties, express or implied, regarding compatibility with all devices or
          uninterrupted operation of NFC functionality.
        </p>

        <h2>12. Governing Law</h2>
        <p>
          These Terms are governed by the laws of the State of California. Any disputes shall be
          resolved in the courts of San Luis Obispo County, California.
        </p>

        <h2>13. Changes to Terms</h2>
        <p>
          We reserve the right to update these Terms at any time. Changes are effective upon
          posting to this page. Continued use of our services constitutes acceptance of the
          updated Terms.
        </p>

        <h2 id="terms-contact">14. Contact</h2>
        <p>
          Questions? Reach us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or call{' '}
          <a href={`tel:${PHONE_NUMBER}`}>{PHONE_NUMBER}</a>.
        </p>
        </section>
      </section>
      <Footer />
    </>
  )
}

function ChatWidget() {
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
        aria-label="Open chat"
      >
        💬
      </button>
    </>
  )
}

function Footer() {
  return (
    <footer className="panel footer">
      <div className="footer-brand">
        <p className="footer-mark" aria-label="Aura Tap">
          <img src="/auralogo.png" alt="Aura Tap" className="footer-logo" />
          <span className="footer-wordmark">AURA TAP</span>
          <span className="sr-only">Aura Tap</span>
        </p>
        <p className="footer-blurb">
          Premium NFC cards and wristbands for faster, cleaner networking.
        </p>
        <p>Service Area: {BUSINESS_ADDRESS}</p>
        <div className="footer-chip-row" aria-label="Footer trust highlights">
          <span>No monthly fees</span>
          <span>Fast setup</span>
          <span>12-month warranty</span>
        </div>
      </div>
      <div className="footer-nav-group">
        <div className="footer-links">
          <a href={`mailto:${CONTACT_EMAIL}`}>Email</a>
          <a href={`tel:${PHONE_NUMBER}`}>Call</a>
          <Link to="/pricing">Pricing</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div className="footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/warranty">Warranty</Link>
          <Link to="/member" className="footer-admin-link">Member</Link>
          <Link to="/admin" className="footer-admin-link">Admin</Link>
        </div>
      </div>
    </footer>
  )
}

function MobileStickyCta() {
  return (
    <div className="mobile-sticky-cta" aria-label="Quick actions">
      <a href={`tel:${PHONE_NUMBER}`} className="mobile-sticky-link mobile-sticky-link-secondary">
        Call Now
      </a>
      <a
        href={BOOKING_URL}
        target="_blank"
        rel="noreferrer"
        className="mobile-sticky-link mobile-sticky-link-primary"
      >
        Book Demo
      </a>
    </div>
  )
}

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
    <div className="site-shell">
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

  async function handleSelectMessage(message) {
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
  }

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
  }, [messages])

  return (
    <div className="site-shell admin-page">
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

function AdminPage() {
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
      <div className="site-shell">
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
    <div className="site-shell member-page">
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
      <div className="site-shell member-page">
        <section className="panel member-auth-card">
          <p>Loading member profile...</p>
        </section>
      </div>
    )
  }

  const publicUrl = `${window.location.origin}/${profile.slug}`

  return (
    <div className="site-shell member-page">
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

function MemberPortalPage() {
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
      <div className="site-shell member-page">
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

function App() {
  const location = useLocation()
  const normalizedPath = location.pathname.replace(/^\//, '').split('/')[0] || ''
  const isProfileRoute = !RESERVED_PATHS.has(normalizedPath)

  if (isProfileRoute) {
    return (
      <Routes>
        <Route path="/:profileSlug" element={<AuraProfilePage />} />
      </Routes>
    )
  }

  return (
    <div className="site-shell">
      <SiteHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/testimonials" element={<TestimonialsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/warranty" element={<WarrantyPage />} />
        <Route path="/member" element={<MemberPortalPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/:profileSlug" element={<AuraProfilePage />} />
      </Routes>
      <MobileStickyCta />
      <ChatWidget />
    </div>
  )
}

export default App
