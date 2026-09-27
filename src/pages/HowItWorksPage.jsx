import { usePageMeta } from '../hooks/usePageMeta'
import { HOW_IT_WORKS_STEPS } from '../data/content'
import { SubpageHero } from '../components/SubpageHero'
import { TapPageMockup } from '../components/TapPageMockup'

export function HowItWorksPage() {
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
        <figure className="tap-demo-figure">
          <TapPageMockup />
          <figcaption>An example Aura Tap profile page.</figcaption>
        </figure>
      </section>
    </>
  )
}
