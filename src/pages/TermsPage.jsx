import { CONTACT_EMAIL, PHONE_NUMBER } from '../config'
import { usePageMeta } from '../hooks/usePageMeta'
import { SubpageHero } from '../components/SubpageHero'

export function TermsPage() {
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
