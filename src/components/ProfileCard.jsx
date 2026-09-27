import { Link } from 'react-router-dom'

function initialsFor(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

// One button on a tap page. In the editor preview nothing navigates.
function ProfileButton({ href, className, children, isPreview }) {
  if (isPreview) {
    return <span className={className}>{children}</span>
  }
  if (href.startsWith('/')) {
    return (
      <Link className={className} to={href}>
        {children}
      </Link>
    )
  }
  const opensNewTab = /^https?:/i.test(href)
  return (
    <a className={className} href={href} {...(opensNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  )
}

export function ProfileCard({ profile, vcardHref, isPreview = false, headingLevel = 1 }) {
  const Heading = `h${headingLevel}`
  const role = [profile.jobTitle, profile.company].filter(Boolean).join(' · ')
  const links = (profile.links || []).filter((link) => link.label && link.href)

  return (
    <section className="profile-card" aria-label={`${profile.displayName || 'Profile'} contact page`}>
      {profile.avatarSrc ? (
        <img src={profile.avatarSrc} alt="" className="profile-avatar" />
      ) : (
        <span className="profile-avatar profile-avatar-initials" aria-hidden="true">
          {initialsFor(profile.displayName)}
        </span>
      )}

      <Heading className="profile-name">{profile.displayName || 'Your name'}</Heading>
      {role && <p className="profile-role">{role}</p>}
      {profile.headline && <p className="profile-headline">{profile.headline}</p>}
      {profile.subheadline && <p className="profile-subheadline">{profile.subheadline}</p>}

      <div className="profile-actions">
        {vcardHref && (
          <ProfileButton href={vcardHref} className="profile-save-contact" isPreview={isPreview}>
            Save Contact
          </ProfileButton>
        )}
        {(profile.phone || profile.contactEmail) && (
          <div className="profile-quick-actions">
            {profile.phone && (
              <ProfileButton href={`tel:${profile.phone.replace(/[^\d+]/g, '')}`} className="profile-quick-action" isPreview={isPreview}>
                Call
              </ProfileButton>
            )}
            {profile.phone && (
              <ProfileButton href={`sms:${profile.phone.replace(/[^\d+]/g, '')}`} className="profile-quick-action" isPreview={isPreview}>
                Text
              </ProfileButton>
            )}
            {profile.contactEmail && (
              <ProfileButton href={`mailto:${profile.contactEmail}`} className="profile-quick-action" isPreview={isPreview}>
                Email
              </ProfileButton>
            )}
          </div>
        )}
      </div>

      {links.length > 0 && (
        <div className="profile-link-list">
          {links.map((link, index) => (
            <ProfileButton key={`${link.label}-${index}`} href={link.href} className="profile-link-button" isPreview={isPreview}>
              {link.label}
            </ProfileButton>
          ))}
        </div>
      )}

      <p className="profile-powered-by">
        {isPreview ? (
          <span>Powered by Aura Tap</span>
        ) : (
          <Link to="/">Powered by Aura Tap</Link>
        )}
      </p>
    </section>
  )
}
