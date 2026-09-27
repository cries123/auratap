import { Link } from 'react-router-dom'

export function BrandMark() {
  return (
    <Link to="/" className="brand" aria-label="Aura Tap home">
      <img src="/auralogo.png" alt="" className="brand-logo" />
      <span className="brand-wordmark">AURA TAP</span>
    </Link>
  )
}
