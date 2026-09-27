import { Link } from 'react-router-dom'
import { trackEvent } from '../lib/analytics'
import { usePageMeta } from '../hooks/usePageMeta'
import { SubpageHero } from '../components/SubpageHero'

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

export function PricingPage() {
  usePageMeta(
    'Pricing',
    'One-time pricing for Aura Tap NFC cards ($20), wristbands ($25), and team bundles from $179. Free setup, no monthly fees.',
  )
  return (
    <>
      <SubpageHero
        eyebrow="Pricing"
        title="Clear Pricing. Strong Return on Investment."
        subtitle="Simple one-time pricing designed for solo operators, growing teams, and larger rollouts."
        chips={['One-time purchase', 'Free setup on every order', 'No monthly fees']}
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
            <p>Free setup and unlimited profile edits.</p>
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

        <h2 className="pricing-heading">Team Bundles</h2>
        <div className="pricing-grid">
          <article>
            <p className="pricing-plan-tag">Starter rollout</p>
            <h3>Starter Team</h3>
            <p className="price">$179 <span className="price-unit">/ 10 cards</span></p>
            <p className="price-compare">$17.90 per card · $200 if bought separately</p>
            <p>Includes onboarding support for your full team rollout.</p>
            <PlanLink plan="starter" />
          </article>
          <article className="pricing-featured">
            <p className="pricing-pill">Most Popular</p>
            <h3>Growth Team</h3>
            <p className="price">$349 <span className="price-unit">/ 25 mixed units</span></p>
            <p className="price-compare">$13.96 per unit · $500+ if bought separately</p>
            <p>Mix cards and wristbands for office staff and field reps.</p>
            <PlanLink plan="growth" featured />
          </article>
          <article>
            <p className="pricing-plan-tag">Scale package</p>
            <h3>Enterprise Rollout</h3>
            <p className="price">$499 <span className="price-unit">/ 50 mixed units</span></p>
            <p className="price-compare">$9.98 per unit · $1,000+ if bought separately</p>
            <p>Includes onboarding call, activation support, and priority service.</p>
            <PlanLink plan="enterprise" />
          </article>
        </div>
        <p className="pricing-note">
          Setup and onboarding support are included free with every order.
        </p>
        <p className="pricing-note">
          Need a larger rollout? Use the Contact Us page and we will tailor pricing
          for your organization.
        </p>
      </section>
    </>
  )
}
