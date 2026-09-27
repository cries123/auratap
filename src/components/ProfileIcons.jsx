// Small line icons for tap pages. All share one 24x24 grid and inherit the text color.
function Icon({ children, size = 20 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function PhoneIcon() {
  return (
    <Icon>
      <path d="M6.6 3.8 9 3.4l1.7 4.1-2.1 1.6a11 11 0 0 0 6.3 6.3l1.6-2.1 4.1 1.7-.4 2.4a2 2 0 0 1-2.1 1.7A16.6 16.6 0 0 1 4.9 5.9a2 2 0 0 1 1.7-2.1Z" />
    </Icon>
  )
}

export function MailIcon() {
  return (
    <Icon>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </Icon>
  )
}

export function GlobeIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
    </Icon>
  )
}

export function InstagramIcon() {
  return (
    <Icon>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.3 6.7h.01" />
    </Icon>
  )
}

export function LinkedInIcon() {
  return (
    <Icon>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M8 10.5V16" />
      <path d="M8 7.8h.01" />
      <path d="M11.5 16v-5.5" />
      <path d="M11.5 12.8c0-1.4 1-2.3 2.3-2.3s2.2.9 2.2 2.3V16" />
    </Icon>
  )
}

export function XIcon() {
  return (
    <Icon>
      <path d="M4.5 4h4.2l10.8 16h-4.2Z" />
      <path d="M19.5 4 13.2 11.1" />
      <path d="m10.8 13.6-6.3 6.4" />
    </Icon>
  )
}

export function LinkIcon() {
  return (
    <Icon>
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L12 5.6" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
    </Icon>
  )
}

export function ArrowUpRightIcon() {
  return (
    <Icon size={18}>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </Icon>
  )
}

export function UserPlusIcon() {
  return (
    <Icon>
      <circle cx="9.5" cy="8" r="3.5" />
      <path d="M3.5 19.5a6 6 0 0 1 12 0" />
      <path d="M19 8.5v6" />
      <path d="M16 11.5h6" />
    </Icon>
  )
}

export function ShareIcon() {
  return (
    <Icon>
      <path d="M12 15V3.5" />
      <path d="m8 7.5 4-4 4 4" />
      <path d="M7 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1" />
    </Icon>
  )
}

const LINK_ICONS = {
  phone: PhoneIcon,
  email: MailIcon,
  website: GlobeIcon,
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
  twitter: XIcon,
  other: LinkIcon,
}

export function LinkTypeIcon({ type }) {
  const Component = LINK_ICONS[type] || LinkIcon
  return <Component />
}
