import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PUBLIC_SITE_URL } from '../config'
import { linkDetail, linkHref, linkTypeInfo } from '../lib/links'
import { ArrowUpRightIcon, LinkTypeIcon, ShareIcon, UserPlusIcon } from './ProfileIcons'

function initialsFor(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

// One button on a tap page. In the editor preview nothing navigates.
function ProfileButton({ href, className, style, children, isPreview }) {
  if (isPreview) {
    return <span className={className} style={style}>{children}</span>
  }
  const opensNewTab = /^https?:/i.test(href)
  return (
    <a className={className} style={style} href={href} {...(opensNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  )
}

// Opens the phone's share sheet, or copies the link where sharing isn't available.
function ShareButton({ url, title }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // The visitor closed the share sheet.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  return (
    <button type="button" className="profile-share" onClick={share} aria-label={`Share ${title}'s page`}>
      <ShareIcon />
      {copied && <span className="profile-share-toast" role="status">Link copied</span>}
    </button>
  )
}

// Renders a member profile in the Aura platform's format (users/{uid}).
export function ProfileCard({ profile, vcardHref, isPreview = false, headingLevel = 1 }) {
  const Heading = `h${headingLevel}`
  const name = profile.displayName || profile.username || 'Your name'
  const role = [profile.jobTitle, profile.location].filter(Boolean).join(' · ')
  const links = (profile.links || []).filter((link) => link?.value)
  const tags = (profile.tags || []).filter(Boolean)
  const hasBanner = Boolean(profile.bannerUrl)
  // Stagger the entrance: each block fades in a little after the one above it.
  let order = 0
  const rise = () => ({ '--rise-order': order++ })

  return (
    <section className={`profile-card${hasBanner ? ' has-banner' : ''}`} aria-label={`${name} contact page`}>
      {!isPreview && profile.username && <ShareButton url={`${PUBLIC_SITE_URL}/${profile.username}`} title={name} />}

      {hasBanner && <img src={profile.bannerUrl} alt="" className="profile-banner" style={rise()} />}

      <div className="profile-avatar-ring" style={rise()}>
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" className="profile-avatar" />
        ) : (
          <span className="profile-avatar profile-avatar-initials" aria-hidden="true">
            {initialsFor(name)}
          </span>
        )}
      </div>

      <div className="profile-intro" style={rise()}>
        <Heading className="profile-name">{name}</Heading>
        {role && <p className="profile-role">{role}</p>}
        {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        {tags.length > 0 && (
          <ul className="profile-tags" aria-label="Tags">
            {tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}
      </div>

      {vcardHref && (
        <ProfileButton href={vcardHref} className="profile-save-contact" style={rise()} isPreview={isPreview}>
          <UserPlusIcon />
          Save Contact
        </ProfileButton>
      )}

      {links.length > 0 && (
        <div className="profile-link-list">
          {links.map((link, index) => {
            const detail = linkDetail(link)
            return (
              <ProfileButton
                key={`${link.type}-${index}`}
                href={linkHref(link)}
                className="profile-link-button"
                style={rise()}
                isPreview={isPreview}
              >
                <span className="profile-link-icon">
                  <LinkTypeIcon type={link.type} />
                </span>
                <span className="profile-link-text">
                  <span className="profile-link-label">{link.label || linkTypeInfo(link.type).label}</span>
                  {detail && <span className="profile-link-detail">{detail}</span>}
                </span>
                <span className="profile-link-arrow">
                  <ArrowUpRightIcon />
                </span>
              </ProfileButton>
            )
          })}
        </div>
      )}

      <p className="profile-powered-by" style={rise()}>
        {isPreview ? (
          <span>
            <img src="/auralogo.png" alt="" width="16" height="16" />
            Powered by Aura Tap
          </span>
        ) : (
          <Link to="/">
            <img src="/auralogo.png" alt="" width="16" height="16" />
            Powered by Aura Tap
          </Link>
        )}
      </p>
    </section>
  )
}
