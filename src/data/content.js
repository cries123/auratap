export const AURA_PROFILE_PAGES = {
  jay: {
    name: 'Jay',
    headline: 'Founder of Aura Taps',
    subheadline: 'Tap to connect.',
    avatarSrc: '/images/product-test.webp',
    links: [
      { label: 'Book a Consultation', href: '/contact' },
      { label: 'Buy an Aura Tap Card', href: '/pricing' },
      { label: 'My Portfolio', href: 'https://aurataps.net' },
      { label: 'Leave a Google Review', href: 'https://g.page/r/Cf0V3l8f8jY7EAE/review' },
    ],
  },
  placeholder: {
    name: 'Your Name',
    headline: 'Aura Tap Profile',
    subheadline: 'Add your links and contact buttons here.',
    avatarSrc: '/auralogo.png',
    links: [
      { label: 'Book a Consultation', href: '/contact' },
      { label: 'Buy an Aura Tap Card', href: '/pricing' },
      { label: 'My Portfolio', href: 'https://aurataps.net' },
      { label: 'Leave a Google Review', href: 'https://g.page/r/Cf0V3l8f8jY7EAE/review' },
    ],
  },
}

export const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Tap or scan in seconds',
    text: 'Someone taps your Aura device or scans the QR code and lands on your digital profile instantly.',
  },
  {
    step: '02',
    title: 'Show your best links',
    text: 'Display contact info, social links, listings, booking links, portfolio pages, and more in one clean profile.',
  },
  {
    step: '03',
    title: 'Update without reprinting',
    text: 'Change your details later without buying new cards every time your role, phone, or links change.',
  },
]

export const TESTIMONIALS = [
  {
    text: 'Aura Tap transformed how we network at events. Our team closes 40% more leads since we switched from paper cards.',
    author: 'Sarah Martinez',
    company: 'SLO Real Estate Group',
    role: 'Sales Director',
  },
  {
    text: 'Setup was a breeze. Within an hour, all 15 of our team members had their cards configured and ready to go.',
    author: 'James Chen',
    company: '805 Home Services',
    role: 'Owner',
  },
  {
    text: 'The wristbands are perfect for our field crews. Clients can save contact info instantly without fumbling for a card.',
    author: 'Miguel Rodriguez',
    company: 'Central Coast Plumbing',
    role: 'Operations Manager',
  },
  {
    text: 'As a solo photographer, the Aura Card made me look premium and helped me get more callbacks after every shoot.',
    author: 'Alyssa Grant',
    company: 'Independent Creative',
    role: 'Freelance Photographer',
  },
  {
    text: 'I am a solo realtor, and this made sharing my listings and contact details way faster at open houses.',
    author: 'Derrick Sloan',
    company: 'Independent Professional',
    role: 'Solo Realtor',
  },
  {
    text: 'As a one-person mobile detailer, the card helps clients save my info instantly and book repeat services easier.',
    author: 'Nina Lopez',
    company: 'Independent Professional',
    role: 'Mobile Detail Specialist',
  },
]

export const NAV_LINKS = [
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/testimonials', label: 'Reviews' },
  { to: '/contact', label: 'Contact' },
]

export const TEAM_SIZE_OPTIONS = ['Just me', '2–10 people', '11–50 people', '51+ people']

// Pricing page "Get started" buttons link here with ?plan=<id> so the form arrives pre-filled.
export const PRICING_PLANS = {
  card: { label: 'NFC Card ($20 each)', teamSize: 'Just me' },
  wristband: { label: 'NFC Wristband ($25 each)', teamSize: 'Just me' },
  branding: { label: 'Custom Branding Add-On ($5 per unit)' },
  starter: { label: 'Starter Team bundle ($225 / 10 cards)', teamSize: '2–10 people' },
  growth: { label: 'Growth Team bundle ($349 / 25 mixed units)', teamSize: '11–50 people' },
  enterprise: { label: 'Enterprise Rollout ($499 / 50 mixed units)', teamSize: '11–50 people' },
}
