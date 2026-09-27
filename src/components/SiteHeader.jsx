import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { NAV_LINKS } from '../data/content'
import { BookDemoLink } from './BookDemoLink'
import { BrandMark } from './BrandMark'

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) {
      return undefined
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <header
      className={`site-header${menuOpen ? ' is-open' : ''}`}
      onClick={(event) => {
        if (event.target.closest('a')) {
          setMenuOpen(false)
        }
      }}
    >
      <div className="container site-header-inner">
        <BrandMark />

        <nav className="site-nav" aria-label="Main">
          {NAV_LINKS.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="site-header-actions">
          <NavLink to="/member" className="header-login">
            Log in
          </NavLink>
          <BookDemoLink source="top_nav" className="btn btn-primary btn-sm">
            Book a Demo
          </BookDemoLink>
        </div>

        <button
          className="nav-toggle"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile" hidden={!menuOpen}>
        <div className="container">
          {NAV_LINKS.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/member">Member log in</NavLink>
          <div className="mobile-nav-actions">
            <BookDemoLink source="mobile_nav" className="btn btn-primary">
              Book a Demo
            </BookDemoLink>
          </div>
        </div>
      </nav>
    </header>
  )
}
