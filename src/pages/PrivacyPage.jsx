import { CONTACT_EMAIL, PHONE_NUMBER } from '../config'
import { usePageMeta } from '../hooks/usePageMeta'
import { SubpageHero } from '../components/SubpageHero'

export function PrivacyPage() {
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
