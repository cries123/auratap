import { Link } from 'react-router-dom'
import { BOOKING_URL, IS_EXTERNAL_BOOKING } from '../config'
import { trackEvent } from '../lib/analytics'

// Opens the booking page: a new tab for an external scheduler, in-app navigation otherwise.
export function BookDemoLink({ source, className, children }) {
  const onClick = () => trackEvent('book_demo_click', { source })

  return IS_EXTERNAL_BOOKING ? (
    <a className={className} href={BOOKING_URL} target="_blank" rel="noreferrer" onClick={onClick}>
      {children}
    </a>
  ) : (
    <Link className={className} to={BOOKING_URL} onClick={onClick}>
      {children}
    </Link>
  )
}
