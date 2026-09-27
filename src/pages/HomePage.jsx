import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import { HOW_IT_WORKS_STEPS, TESTIMONIALS } from '../data/content'
import { BookDemoLink } from '../components/BookDemoLink'
import { CheckIcon, CrossIcon } from '../components/Icons'
import { TestimonialCard } from '../components/TestimonialCard'

export function HomePage() {
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
            Custom logo branding is available for $5 per unit, and team bundles start at $179.{' '}
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
              <Link className="text-link" to="/contact">Contact our team</Link>.
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
                <Link className="btn btn-outline-inverse btn-lg" to="/pricing">
                  View Pricing
                </Link>
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
