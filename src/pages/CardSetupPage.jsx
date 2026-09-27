import { Link } from 'react-router-dom'
import { PUBLIC_SITE_HOST } from '../config'
import { usePageMeta } from '../hooks/usePageMeta'
import { SubpageHero } from '../components/SubpageHero'
import { CardSetupSteps } from '../components/CardSetupSteps'

export function CardSetupPage() {
  usePageMeta(
    'Card Setup Guide',
    'How to set up your Aura Tap card or wristband: create your tap page, then program your card with the free NFC Tools app.',
  )

  return (
    <>
      <SubpageHero
        eyebrow="Card setup"
        title="Set up your Aura card in about five minutes."
        subtitle="Create your tap page, then write its link onto your card or wristband with the free NFC Tools app."
        chips={['Works on iPhone and Android', 'Program once', 'Update your page anytime']}
      />

      <section className="panel card-setup-page">
        <div className="card-setup-part">
          <p className="step-kicker">Part 1</p>
          <h2>Create your tap page</h2>
          <p>
            <Link to="/member">Create a member account</Link> and choose your tap link, for example{' '}
            <code>{PUBLIC_SITE_HOST}/jordan-rivera</code>. Add your photo, contact details, and buttons, then save.
            Your link and a copy button are shown at the top of your member portal.
          </p>
        </div>

        <div className="card-setup-part">
          <p className="step-kicker">Part 2</p>
          <h2>Program your card with NFC Tools</h2>
          <CardSetupSteps link={`${PUBLIC_SITE_HOST}/your-link`} />
        </div>

        <p className="card-setup-help">
          Need a hand? <Link to="/contact">Contact us</Link> and we&apos;ll walk you through it. Team orders include setup help.
        </p>
      </section>
    </>
  )
}
