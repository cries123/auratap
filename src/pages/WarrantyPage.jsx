import { CONTACT_EMAIL } from '../config'
import { usePageMeta } from '../hooks/usePageMeta'
import { SubpageHero } from '../components/SubpageHero'

export function WarrantyPage() {
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
