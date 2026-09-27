import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom'
import './App.css'

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'sales@auratap.com'
const PHONE_NUMBER = import.meta.env.VITE_PHONE_NUMBER || '8059033231'
const BOOKING_URL = import.meta.env.VITE_BOOKING_URL || '/contact'
const BUSINESS_ADDRESS = import.meta.env.VITE_BUSINESS_ADDRESS || 'Nationwide'
const CHAT_API_BASE = import.meta.env.VITE_CHAT_API_BASE || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3001')
const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_BASE || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3001')
const MEMBER_API_BASE = import.meta.env.VITE_MEMBER_API_BASE || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3001')
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
    avatarSrc: '/images/product-test.webp',
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

const DEFAULT_TITLE = 'Aura Tap | NFC Cards and Wristbands for Modern Networking'
const DEFAULT_DESCRIPTION =
  'Aura Tap helps professionals and teams share contact info instantly with NFC cards and wristbands. Serving clients nationwide with setup and support.'

function setMetaContent(selector, content) {
  document.querySelector(selector)?.setAttribute('content', content)
}

// Keeps the tab title, description, canonical URL, and social tags in sync with the current page.
function usePageMeta(title, description = DEFAULT_DESCRIPTION) {
  const { pathname } = useLocation()

  useEffect(() => {
    const fullTitle = title ? `${title} | Aura Tap` : DEFAULT_TITLE
    const url = `${window.location.origin}${pathname}`

    document.title = fullTitle
    setMetaContent('meta[name="description"]', description)
    setMetaContent('meta[property="og:title"]', fullTitle)
    setMetaContent('meta[property="og:description"]', description)
    setMetaContent('meta[property="og:url"]', url)
    setMetaContent('meta[name="twitter:title"]', fullTitle)
    setMetaContent('meta[name="twitter:description"]', description)
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', url)
  }, [title, description, pathname])
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

function formatPhone(value) {
  const digits = String(value).replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '')
  return digits.length === 10
    ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    : value
}

const PHONE_DISPLAY = formatPhone(PHONE_NUMBER)
const IS_EXTERNAL_BOOKING = /^https?:\/\//.test(BOOKING_URL)

// Opens the booking page: a new tab for an external scheduler, in-app navigation otherwise.
function BookDemoLink({ source, className, children }) {
  const onClick = () => trackEvent('book_demo_click', { source })

  return IS_EXTERNAL_BOOKING ? (
    <a className={className} href={BOOKING_URL} target="_blank" rel="noreferrer" onClick={onClick}>
      {children}
    </a>
  ) : (
    <Link className={className} to={BOOKING_URL} onClick={onClick}>
      {children}
    </Link>
  )
}

const NAV_LINKS = [
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/testimonials', label: 'Reviews' },
  { to: '/contact', label: 'Contact' },
]

function BrandMark() {
  return (
    <Link to="/" className="brand" aria-label="Aura Tap home">
      <img src="/auralogo.png" alt="" className="brand-logo" />
      <span className="brand-wordmark">AURA TAP</span>
    </Link>
  )
}

function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) {
      return undefined
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <header
      className={`site-header${menuOpen ? ' is-open' : ''}`}
      onClick={(event) => {
        if (event.target.closest('a')) {
          setMenuOpen(false)
        }
      }}
    >
      <div className="container site-header-inner">
        <BrandMark />

        <nav className="site-nav" aria-label="Main">
          {NAV_LINKS.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="site-header-actions">
          <a className="header-phone" href={`tel:${PHONE_NUMBER}`}>
            {PHONE_DISPLAY}
          </a>
          <NavLink to="/member" className="header-login">
            Log in
          </NavLink>
          <BookDemoLink source="top_nav" className="btn btn-primary btn-sm">
            Book a Demo
          </BookDemoLink>
        </div>

        <button
          className="nav-toggle"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile" hidden={!menuOpen}>
        <div className="container">
          {NAV_LINKS.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/member">Member log in</NavLink>
          <div className="mobile-nav-actions">
            <BookDemoLink source="mobile_nav" className="btn btn-primary">
              Book a Demo
            </BookDemoLink>
            <a className="btn btn-secondary" href={`tel:${PHONE_NUMBER}`}>
              Call {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </nav>
    </header>
  )
}

function AuraProfilePage() {
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

const HOW_IT_WORKS_STEPS = [
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

const TESTIMONIALS = [
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

function TestimonialCard({ testimonial }) {
  const initials = testimonial.author
    .split(' ')
    .map((part) => part[0])
    .join('')

  return (
    <figure className="testimonial-card">
      <blockquote>“{testimonial.text}”</blockquote>
      <figcaption>
        <span className="testimonial-avatar" aria-hidden="true">{initials}</span>
        <span>
          <strong>{testimonial.author}</strong>
          <span>{testimonial.role}, {testimonial.company}</span>
        </span>
      </figcaption>
    </figure>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" className="icon-check">
      <path d="M5 10.5l3.2 3.2L15 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" className="icon-cross">
      <path d="M6 6l8 8M14 6l-8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function HomePage() {
  usePageMeta()
  const clientLogos = [
    'Central Coast Plumbing',
    'SLO Real Estate Group',
    'Pacific Event Pros',
    '805 Home Services',
  ]

  const products = [
    {
      name: 'Aura Card',
      price: '$20',
      image: '/images/product-cards.webp',
      alt: 'Matte black Aura NFC card on a wooden desk',
      audience: 'For realtors, photographers, consultants, and sales reps',
      points: ['Premium matte-black finish', 'Instant contact sharing', 'Update details without reprinting'],
    },
    {
      name: 'Aura Wristband',
      price: '$25',
      image: '/images/product-wristband.webp',
      alt: 'Black silicone Aura NFC wristband on a wooden desk',
      audience: 'For events, crews, field teams, and trade shows',
      points: ['Comfortable to wear all day', 'Hands-free sharing on the move', 'Built for repeat taps'],
    },
  ]

  const benefits = [
    {
      title: 'Zero recurring costs',
      text: 'Stop re-ordering paper cards every time someone gets promoted. Update profiles in seconds, anytime.',
    },
    {
      title: 'Instant lead capture',
      text: 'Clients save you or your team directly to their phone contacts instead of losing a card in a stack.',
    },
    {
      title: 'Brand authority',
      text: 'A matte black Aura Card or custom NFC wristband signals a modern, tech-forward business.',
    },
  ]

  const comparison = [
    'Saves straight to phone contacts',
    'Update details without reprinting',
    'Share socials, booking, listings, and portfolio',
    'One-time purchase, no reorders',
  ]

  const stats = [
    { value: '15,000+', label: 'Products sold' },
    { value: '180+', label: 'Clients served' },
    { value: '34%', label: 'Higher follow-up rate than paper cards' },
    { value: '2.4x', label: 'Faster contact exchange at events' },
  ]

  const faqs = [
    {
      q: 'Does it work with iPhone and Android?',
      a: 'Yes. Most modern smartphones support NFC tap or QR scan, so people can open your profile without downloading an app.',
    },
    {
      q: 'Does the other person need an app?',
      a: 'No. The tap opens your profile page directly in their browser, and they can save your contact with one button.',
    },
    {
      q: 'Can I update my info later?',
      a: 'Yes. Your profile can be updated after setup, so your card or wristband stays useful even if your info changes.',
    },
    {
      q: 'How long does setup take?',
      a: 'About 60 seconds per card. Team bundles include onboarding support so everyone is ready on day one.',
    },
    {
      q: 'We already have paper cards. Why switch?',
      a: 'Most teams spend $50+ per employee every time details change. Aura Tap is a one-time $20 investment per person.',
    },
    {
      q: 'When should we choose wristbands?',
      a: 'Wristbands are ideal for field teams and events. They are hands-free and built for quick networking while moving.',
    },
    {
      q: 'What happens if my card stops working?',
      a: 'Manufacturing faults are covered under our 12-month warranty and replaced at no charge. Loss, theft, and physical damage are not covered.',
    },
  ]

  return (
    <>
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <p className="eyebrow">NFC business cards &amp; wristbands</p>
            <h1>Make a professional first impression with one tap.</h1>
            <p className="lead">
              Premium NFC cards and wristbands that let you and your team share
              contact info, booking links, portfolios, and socials instantly.
              No app, no reprints, no monthly fees.
            </p>
            <div className="button-row">
              <BookDemoLink source="hero" className="btn btn-primary btn-lg">
                Book a 5-Minute Demo
              </BookDemoLink>
              <Link className="btn btn-secondary btn-lg" to="/pricing">
                View Pricing
              </Link>
            </div>
            <ul className="hero-assurances">
              <li><CheckIcon /> 12-month warranty</li>
              <li><CheckIcon /> Setup included</li>
              <li><CheckIcon /> Ships nationwide</li>
            </ul>
          </div>

          <div className="home-hero-media">
            <img
              src="/images/product-action.webp"
              alt="Aura NFC wristband worn on a wrist next to a matte black Aura card"
              width="1800"
              height="824"
              fetchPriority="high"
            />
            <div className="hero-stat-badge">
              <strong>15,000+</strong>
              <span>products sold to 180+ clients</span>
            </div>
          </div>
        </div>
      </section>

      <section className="logo-strip" aria-label="Clients">
        <div className="container logo-strip-inner">
          <p>Trusted by teams at</p>
          <ul>
            {clientLogos.map((logo) => (
              <li key={logo}>{logo}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container split split-media-left">
          <figure className="split-media">
            <img
              src="/images/tap-demo-showcase.webp"
              alt="Aura card next to a phone showing a digital contact profile"
              width="1100"
              height="1520"
              loading="lazy"
            />
          </figure>
          <div>
            <p className="eyebrow">How it works</p>
            <h2>From tap to saved contact in seconds.</h2>
            <ol className="step-list">
              {HOW_IT_WORKS_STEPS.map((item) => (
                <li key={item.step}>
                  <span className="step-number">{item.step}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link className="text-link" to="/how-it-works">
              See the full walkthrough <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Products</p>
            <h2>Choose the right device for how you network.</h2>
            <p>Both work with every modern iPhone and Android phone, with no app required.</p>
          </div>
          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.name}>
                <img src={product.image} alt={product.alt} width="1400" height="600" loading="lazy" />
                <div className="product-card-body">
                  <div className="product-card-title">
                    <h3>{product.name}</h3>
                    <p className="product-price">
                      <span>from</span> {product.price}
                    </p>
                  </div>
                  <p className="product-audience">{product.audience}</p>
                  <ul className="check-list">
                    {product.points.map((point) => (
                      <li key={point}><CheckIcon /> {point}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
          <p className="section-footnote">
            Custom logo branding is available for $5 per unit, and team bundles start at $225.{' '}
            <Link className="text-link" to="/pricing">
              Compare all pricing <span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div>
            <p className="eyebrow">Why Aura Tap</p>
            <h2>A clear upgrade over paper business cards.</h2>
            <div className="benefit-list">
              {benefits.map((benefit) => (
                <div key={benefit.title}>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="comparison">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th scope="col"><span className="sr-only">Feature</span></th>
                  <th scope="col">Paper card</th>
                  <th scope="col">Aura Tap</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row}>
                    <th scope="row">{row}</th>
                    <td><CrossIcon /><span className="sr-only">No</span></td>
                    <td><CheckIcon /><span className="sr-only">Yes</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="roi-note">
              <p className="roi-note-label">Example: a 10-person team</p>
              <div className="roi-note-figures">
                <div>
                  <span>Paper cards</span>
                  <strong>$800/yr</strong>
                  <small>$40 × 10 people × 2 reorders</small>
                </div>
                <div>
                  <span>Aura Tap</span>
                  <strong>$200 once</strong>
                  <small>$20 × 10 cards</small>
                </div>
              </div>
              <p>That is $600 saved in year one and $800 every year after.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-band" aria-label="Results">
        <div className="container stats-grid">
          {stats.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading section-heading-row">
            <div>
              <p className="eyebrow">Reviews</p>
              <h2>What our clients say.</h2>
            </div>
            <Link className="text-link" to="/testimonials">
              Read all reviews <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="testimonial-grid">
            {TESTIMONIALS.slice(0, 3).map((testimonial) => (
              <TestimonialCard key={testimonial.author} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container split split-faq">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2>Frequently asked questions.</h2>
            <p className="muted">
              Can&apos;t find what you&apos;re looking for?{' '}
              <Link className="text-link" to="/contact">Contact our team</Link> or call{' '}
              <a className="text-link" href={`tel:${PHONE_NUMBER}`}>{PHONE_DISPLAY}</a>.
            </p>
          </div>
          <div className="faq-list">
            {faqs.map((item) => (
              <details key={item.q} className="faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-panel">
            <div className="cta-panel-copy">
              <h2>Ready to replace your paper cards?</h2>
              <p>
                Wherever you are in the U.S., we&apos;ll run a 5-minute remote demo
                and help you choose the right setup for you or your team.
              </p>
              <div className="button-row">
                <BookDemoLink source="cta" className="btn btn-inverse btn-lg">
                  Book a Demo
                </BookDemoLink>
                <a className="btn btn-outline-inverse btn-lg" href={`tel:${PHONE_NUMBER}`}>
                  Call {PHONE_DISPLAY}
                </a>
              </div>
            </div>
            <img
              src="/images/product-showcase.webp"
              alt="Aura wristband being tapped against a phone that shows a contact profile"
              width="1600"
              height="1067"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </>
  )
}

function HowItWorksPage() {
  usePageMeta(
    'How It Works',
    'See how Aura Tap NFC cards and wristbands share your contact info, links, and booking page with one tap. No app needed.',
  )
  return (
    <>
      <SubpageHero
        eyebrow="How It Works"
        title="Share your details with a single tap."
        subtitle="Hold your Aura card or wristband near any modern phone and your digital profile opens instantly. Nothing to download, nothing to type."
        chips={['Works on iPhone and Android', 'No app required', 'Update anytime']}
        mediaImageSrc="/images/products-howto.webp"
        mediaImageAlt="Aura NFC cards and wristbands displayed on a wooden surface"
      />

      <section className="panel how-it-works">
        <div className="process-grid">
          {HOW_IT_WORKS_STEPS.map((item) => (
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
          <p className="eyebrow">What they see</p>
          <h2>Your profile, one tap away.</h2>
          <p>
            When someone taps your card or wristband, your profile opens on their
            phone. From there they can save your contact, call you, book a meeting,
            or visit your links right away.
          </p>
          <ul className="demo-points">
            <li>Save your contact to their phone in one step</li>
            <li>Open your social, booking, and portfolio links</li>
            <li>One clean page instead of five separate links</li>
          </ul>
        </div>
        <figure className="tap-demo-photo-frame" aria-label="Aura Tap profile preview after card tap">
          <img
            src="/images/jay-profile-preview.webp"
            alt="Aura card and phone profile preview after tapping"
            className="tap-demo-photo"
          />
          <figcaption>An example Aura Tap profile page.</figcaption>
        </figure>
      </section>
    </>
  )
}

function TestimonialsPage() {
  usePageMeta(
    'Customer Reviews',
    'Read what realtors, contractors, photographers, and teams say about using Aura Tap NFC cards and wristbands.',
  )
  return (
    <>
      <SubpageHero
        eyebrow="Testimonials"
        title="Client Testimonials"
        subtitle="Verified feedback from professionals, teams, and businesses nationwide using Aura Tap in daily operations."
        chips={['180+ clients served', 'Real customer stories', 'Nationwide service']}
        mediaImageSrc="/images/product-test.webp"
        mediaImageAlt="Aura Tap products used by real clients"
      />

      <section className="page-section">
        <div className="testimonial-grid">
          {TESTIMONIALS.map((testimonial) => (
            <TestimonialCard key={testimonial.author} testimonial={testimonial} />
          ))}
        </div>
      </section>
    </>
  )
}

function SubpageHero({
  eyebrow,
  title,
  subtitle,
  chips = [],
  mediaText = '',
  mediaImageSrc,
  mediaImageAlt = '',
}) {
  return (
    <section className={`page-hero${mediaImageSrc ? ' has-media' : ''}`}>
      <div className="container page-hero-grid">
        <div className="page-hero-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lead">{subtitle}</p>
          {chips.length > 0 && (
            <ul className="hero-assurances">
              {chips.map((chip) => (
                <li key={chip}><CheckIcon /> {chip}</li>
              ))}
            </ul>
          )}
        </div>
        {mediaImageSrc ? (
          <figure className="page-hero-media">
            <img src={mediaImageSrc} alt={mediaImageAlt} />
            {mediaText ? <figcaption>{mediaText}</figcaption> : null}
          </figure>
        ) : null}
      </div>
    </section>
  )
}

const TEAM_SIZE_OPTIONS = ['Just me', '2–10 people', '11–50 people', '51+ people']

// Pricing page "Get started" buttons link here with ?plan=<id> so the form arrives pre-filled.
const PRICING_PLANS = {
  card: { label: 'NFC Card ($20 each)', teamSize: 'Just me' },
  wristband: { label: 'NFC Wristband ($25 each)', teamSize: 'Just me' },
  branding: { label: 'Custom Branding Add-On ($5 per unit)' },
  starter: { label: 'Starter Team bundle ($225 / 10 cards)', teamSize: '2–10 people' },
  growth: { label: 'Growth Team bundle ($349 / 25 mixed units)', teamSize: '11–50 people' },
  enterprise: { label: 'Enterprise Rollout ($499 / 50 mixed units)', teamSize: '11–50 people' },
}

function emptyContactForm(plan) {
  return {
    name: '',
    company: '',
    email: '',
    teamSize: plan?.teamSize || '',
    message: plan ? `I'm interested in the ${plan.label}.` : '',
  }
}

function ContactPage() {
  usePageMeta(
    'Contact Us',
    'Book a 5-minute demo or ask a question. We help individuals and teams nationwide choose the right NFC card or wristband setup.',
  )
  const [searchParams] = useSearchParams()
  const selectedPlan = PRICING_PLANS[searchParams.get('plan')]
  const [formData, setFormData] = useState(() => emptyContactForm(selectedPlan))
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

      setFormData(emptyContactForm())
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
        mediaImageSrc="/images/product-action.webp"
        mediaImageAlt="Aura NFC wristband and card held in hand"
      />

      <section className="panel contact-layout">
        <form className="lead-form" onSubmit={onSubmit}>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" value={formData.name} onChange={onChange} required />

          <label htmlFor="company">
            Company <span className="field-optional">(optional)</span>
          </label>
          <input id="company" name="company" value={formData.company} onChange={onChange} />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={onChange}
            required
          />

          <label htmlFor="teamSize">How many people need a card or wristband?</label>
          <select id="teamSize" name="teamSize" value={formData.teamSize} onChange={onChange} required>
            <option value="" disabled>Select one</option>
            {TEAM_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <label htmlFor="message">Message</label>
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
          <div className="contact-side-direct">
            <p>Prefer to talk it through?</p>
            <a href={`tel:${PHONE_NUMBER}`}>{PHONE_DISPLAY}</a>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </div>
        </aside>
      </section>
    </>
  )
}

function PlanLink({ plan, featured = false }) {
  return (
    <Link
      className={`btn ${featured ? 'btn-primary' : 'btn-secondary'} pricing-cta`}
      to={`/contact?plan=${plan}`}
      onClick={() => trackEvent('pricing_plan_click', { plan })}
    >
      Get started
    </Link>
  )
}

function PricingPage() {
  usePageMeta(
    'Pricing',
    'One-time pricing for Aura Tap NFC cards ($20), wristbands ($25), and team bundles from $225. No monthly fees.',
  )
  return (
    <>
      <SubpageHero
        eyebrow="Pricing"
        title="Clear Pricing. Strong Return on Investment."
        subtitle="Simple one-time pricing designed for solo operators, growing teams, and enterprise deployments."
        chips={['One-time purchase', '$99 setup included with bundles', 'No recurring platform fees']}
        mediaImageSrc="/images/product-pricing.webp"
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
            <PlanLink plan="card" />
          </article>
          <article>
            <p className="pricing-plan-tag">Best for events</p>
            <h3>NFC Wristband</h3>
            <p className="price">$25 each</p>
            <p>Best for field teams and live-event networking.</p>
            <PlanLink plan="wristband" />
          </article>
          <article>
            <p className="pricing-plan-tag">Brand upgrade</p>
            <h3>Custom Branding Add-On</h3>
            <p className="price">$5 per unit</p>
            <p>Logo and brand styling for a stronger first impression.</p>
            <PlanLink plan="branding" />
          </article>
        </div>

        <h2 className="pricing-heading">Enterprise Bundles</h2>
        <div className="pricing-grid">
          <article>
            <p className="pricing-plan-tag">Starter rollout</p>
            <h3>Starter Team</h3>
            <p className="price"><s className="price-was">$299</s> $225 / 10 cards</p>
            <p>Includes onboarding support for your full team rollout.</p>
            <PlanLink plan="starter" />
          </article>
          <article className="pricing-featured">
            <p className="pricing-pill">Most Popular</p>
            <h3>Growth Team</h3>
            <p className="price"><s className="price-was">$599</s> $349 / 25 mixed units</p>
            <p>Mix cards and wristbands for office staff and field reps.</p>
            <PlanLink plan="growth" featured />
          </article>
          <article>
            <p className="pricing-plan-tag">Scale package</p>
            <h3>Enterprise Rollout</h3>
            <p className="price"><s className="price-was">$1,099</s> $499 / 50 mixed units</p>
            <p>Includes onboarding call, activation support, and priority service.</p>
            <PlanLink plan="enterprise" />
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
    </>
  )
}

function WarrantyPage() {
  usePageMeta(
    'Warranty',
    'Every Aura Tap NFC card and wristband includes a 12-month limited warranty against manufacturing defects.',
  )
  return (
    <>
      <SubpageHero
        eyebrow="Warranty"
        title="Coverage Built for Confidence"
        subtitle="Every Aura Tap device includes a 12-month limited warranty for manufacturing faults."
        chips={['12 months coverage', 'Fast claim review', 'Replacement support']}
        mediaImageSrc="/images/product-warranty.webp"
        mediaImageAlt="Aura Tap product warranty coverage"
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
        <h2 className="warranty-title">Simple, Clear Warranty Process</h2>
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
          <li>Your order number</li>
          <li>A brief description of the fault</li>
          <li>A photo of the defective device if possible</li>
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
    </>
  )
}

function PrivacyPage() {
  usePageMeta('Privacy Policy', 'How Aura Tap collects, uses, and protects your personal information.')
  return (
    <>
      <SubpageHero
        eyebrow="Privacy"
        title="Privacy Policy"
        subtitle="How Aura Tap collects, uses, and protects your information."
        chips={['No data resale', 'Clear retention policy', 'Request access or deletion']}
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
    </>
  )
}

function TermsPage() {
  usePageMeta('Terms of Service', 'Terms covering Aura Tap orders, payment, returns, setup, and warranty.')
  return (
    <>
      <SubpageHero
        eyebrow="Terms"
        title="Terms of Service"
        subtitle="Clear rules for orders, usage, support, and warranty terms."
        chips={['Transparent policy', 'California governing law', 'Direct support contact']}
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

function Footer() {
  const columns = [
    {
      title: 'Product',
      links: [
        { to: '/how-it-works', label: 'How It Works' },
        { to: '/pricing', label: 'Pricing' },
        { to: '/testimonials', label: 'Reviews' },
      ],
    },
    {
      title: 'Support',
      links: [
        { to: '/contact', label: 'Contact Us' },
        { to: '/warranty', label: 'Warranty' },
        { to: '/member', label: 'Member Log In' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { to: '/privacy', label: 'Privacy Policy' },
        { to: '/terms', label: 'Terms of Service' },
      ],
    },
  ]

  return (
    <footer className="site-footer">
      <div className="container site-footer-grid">
        <div className="site-footer-brand">
          <BrandMark />
          <p>Premium NFC cards and wristbands for faster, cleaner networking.</p>
          <p className="site-footer-contact">
            <a href={`tel:${PHONE_NUMBER}`}>{PHONE_DISPLAY}</a>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <span>Service area: {BUSINESS_ADDRESS}</span>
          </p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} className="site-footer-column" aria-label={column.title}>
            <h2>{column.title}</h2>
            <ul>
              {column.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="container site-footer-bottom">
        <p>© {new Date().getFullYear()} Aura Tap. All rights reserved.</p>
        <p>12-month warranty · No monthly fees · Setup included</p>
      </div>
    </footer>
  )
}

function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [pathname, hash])

  return null
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

function AdminPage() {
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

function MemberPortalPage() {
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

  // The admin panel is a staff tool with its own header, so it skips the marketing chrome.
  if (normalizedPath === 'admin') {
    return (
      <div className="site-shell">
        <ScrollToTop />
        <AdminPage />
      </div>
    )
  }

  return (
    <div className="site-shell">
      <ScrollToTop />
      <SiteHeader />
      <main className="site-main">
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
          <Route path="/:profileSlug" element={<AuraProfilePage />} />
        </Routes>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}

export default App
