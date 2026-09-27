import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CONTACT_EMAIL, CHAT_API_BASE } from '../config'
import { trackEvent } from '../lib/analytics'
import { usePageMeta } from '../hooks/usePageMeta'
import { TEAM_SIZE_OPTIONS, PRICING_PLANS } from '../data/content'
import { SubpageHero } from '../components/SubpageHero'

function emptyContactForm(plan) {
  return {
    name: '',
    company: '',
    email: '',
    teamSize: plan?.teamSize || '',
    message: plan ? `I'm interested in the ${plan.label}.` : '',
  }
}

export function ContactPage() {
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
            <p>Prefer email?</p>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </div>
        </aside>
      </section>
    </>
  )
}
