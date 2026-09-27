import { Link } from 'react-router-dom'
import { linkHref, linkTypeInfo } from '../lib/links'

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
  const opensNewTab = /^https?:/i.test(href)
  return (
    <a className={className} href={href} {...(opensNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  )
}

// Renders a member profile in the Aura platform's format (users/{uid}).
export function ProfileCard({ profile, vcardHref, isPreview = false, headingLevel = 1 }) {
  const Heading = `h${headingLevel}`
  const role = [profile.jobTitle, profile.location].filter(Boolean).join(' · ')
  const links = (profile.links || []).filter((link) => link?.value)
  const tags = (profile.tags || []).filter(Boolean)

  return (
    <section className="profile-card" aria-label={`${profile.displayName || 'Profile'} contact page`}>
      {profile.bannerUrl && <img src={profile.bannerUrl} alt="" className="profile-banner" />}

      {profile.avatarUrl ? (
        <img src={profile.avatarUrl} alt="" className={`profile-avatar${profile.bannerUrl ? ' has-banner' : ''}`} />
      ) : (
        <span className={`profile-avatar profile-avatar-initials${profile.bannerUrl ? ' has-banner' : ''}`} aria-hidden="true">
          {initialsFor(profile.displayName || profile.username)}
        </span>
      )}

      <Heading className="profile-name">{profile.displayName || profile.username || 'Your name'}</Heading>
      {role && <p className="profile-role">{role}</p>}
      {profile.bio && <p className="profile-bio">{profile.bio}</p>}
      {tags.length > 0 && (
        <ul className="profile-tags" aria-label="Tags">
          {tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}

      {vcardHref && (
        <div className="profile-actions">
          <ProfileButton href={vcardHref} className="profile-save-contact" isPreview={isPreview}>
            Save Contact
          </ProfileButton>
        </div>
      )}

      {links.length > 0 && (
        <div className="profile-link-list">
          {links.map((link, index) => (
            <ProfileButton key={`${link.type}-${index}`} href={linkHref(link)} className="profile-link-button" isPreview={isPreview}>
              {link.label || linkTypeInfo(link.type).label}
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
