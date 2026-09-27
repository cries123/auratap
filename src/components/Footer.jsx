import { Link } from 'react-router-dom'
import { CONTACT_EMAIL, BUSINESS_ADDRESS } from '../config'
import { BrandMark } from './BrandMark'

export function Footer() {
  const columns = [
    {
      title: 'Product',
      links: [
        { to: '/how-it-works', label: 'How It Works' },
        { to: '/pricing', label: 'Pricing' },
        { to: '/testimonials', label: 'Reviews' },
      ],
    },
    {
      title: 'Support',
      links: [
        { to: '/contact', label: 'Contact Us' },
        { to: '/setup', label: 'Card Setup Guide' },
        { to: '/warranty', label: 'Warranty' },
        { to: '/member', label: 'Member Log In' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { to: '/privacy', label: 'Privacy Policy' },
        { to: '/terms', label: 'Terms of Service' },
      ],
    },
  ]

  return (
    <footer className="site-footer">
      <div className="container site-footer-grid">
        <div className="site-footer-brand">
          <BrandMark />
          <p>Premium NFC cards and wristbands for faster, cleaner networking.</p>
          <p className="site-footer-contact">
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <span>Service area: {BUSINESS_ADDRESS}</span>
          </p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} className="site-footer-column" aria-label={column.title}>
            <h2>{column.title}</h2>
            <ul>
              {column.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="container site-footer-bottom">
        <p>© {new Date().getFullYear()} Aura Tap. All rights reserved.</p>
        <p>12-month warranty · No monthly fees · Setup included</p>
      </div>
    </footer>
  )
}
