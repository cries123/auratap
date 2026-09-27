const NFC_TOOLS_IOS = 'https://apps.apple.com/us/app/nfc-tools/id1252962749'
const NFC_TOOLS_ANDROID = 'https://play.google.com/store/apps/details?id=com.wakdev.wdnfc'

// Step-by-step guide for writing a member's tap link onto an Aura card or wristband with NFC Tools.
// `link` is shown without https:// because NFC Tools adds it; `linkAction` can render a copy button.
export function CardSetupSteps({ link, linkAction = null }) {
  return (
    <div className="card-setup">
      <div className="card-setup-needs">
        <h3>What you need</h3>
        <ul>
          <li>Your Aura card or wristband</li>
          <li>
            A phone with NFC: iPhone 7 or newer, or most Android phones (turn on NFC in
            Settings &rsaquo; Connected devices)
          </li>
          <li>
            The free <strong>NFC Tools</strong> app by wakdev:{' '}
            <a href={NFC_TOOLS_IOS} target="_blank" rel="noopener noreferrer">App Store</a>
            {' · '}
            <a href={NFC_TOOLS_ANDROID} target="_blank" rel="noopener noreferrer">Google Play</a>
          </li>
        </ul>
      </div>

      <ol className="card-setup-steps">
        <li>
          <strong>Open NFC Tools and tap Write.</strong>
        </li>
        <li>
          <strong>Tap Add a record, then choose URL / URI.</strong>
        </li>
        <li>
          <strong>Enter your tap link, then tap OK.</strong>
          <span className="card-setup-link">
            <code>{link}</code>
            {linkAction}
          </span>
          <span>If the app shows a separate <em>https://</em> option, keep it selected and type the rest of the link.</span>
        </li>
        <li>
          <strong>Tap Write, then hold your card flat against your phone.</strong>
          <span>
            On iPhone, hold it near the top edge by the camera. On Android, hold it to the middle of the back.
            Keep it still until you see &ldquo;Write complete.&rdquo;
          </span>
        </li>
        <li>
          <strong>Test it.</strong>
          <span>
            Unlock your phone and tap the card. Your tap page should open. On iPhone 7 through X, open the
            NFC reader in Control Center first.
          </span>
        </li>
      </ol>

      <div className="card-setup-tips">
        <h3>Good to know</h3>
        <ul>
          <li>You only program your card once. Update your page anytime in the member portal and the card shows the changes.</li>
          <li>If you change your tap link later, your old link keeps working, so there&apos;s no need to reprogram.</li>
          <li>
            Once it works, you can lock the card so no one else can overwrite it: in NFC Tools, go to{' '}
            <em>Other &rsaquo; Lock tag</em>. Locking is permanent, so test first.
          </li>
          <li>
            Not writing? Take the phone out of thick or metal cases, move the card slowly around the back of
            the phone, and try again.
          </li>
        </ul>
      </div>
    </div>
  )
}
