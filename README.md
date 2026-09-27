# Aura Tap Website

Professional marketing website for Aura Tap, built with React and Vite.

## Brand Direction

- Light, monochrome visual system (white and warm grey, black accents)
- Public tap profiles (`/:slug`) keep a dark look
- Mobile-first responsive layout for sales and service audiences

## Project Structure

- `src/App.jsx`: routes and page shell
- `src/pages/`: one file per page (home, pricing, contact, admin, member portal, tap profiles)
- `src/components/`: header, footer, chat widget, and shared UI pieces
- `src/data/content.js`: testimonials, steps, pricing plans, and nav links
- `src/config.js`: environment-driven settings (contact details, API bases)
- `public/images/`: compressed WebP product photos

## Development

```bash
npm install
npm run dev
```

## Environment Setup

1. Copy `.env.example` to `.env` in the project root and fill your business values.
2. Copy `server/.env.example` to `server/.env` and fill your SMTP and admin auth values.

Required server values:

- `ADMIN_PASSWORD`
- `ADMIN_EMAIL`
- `FRONTEND_URL` and/or `CORS_ORIGINS`

Required frontend values:

- `VITE_CONTACT_EMAIL`
- `VITE_BOOKING_URL`
- `VITE_CHAT_API_BASE`
- `VITE_ADMIN_API_BASE`
- `VITE_PUBLIC_SITE_URL`
- `VITE_GA_MEASUREMENT_ID` (optional, for Google Analytics)

## Contact Form Behavior

The Contact page now posts directly to the backend API (`POST /api/contact`) with
rate limiting and server-side notifications. It no longer relies on opening a
`mailto:` draft in the visitor's email client.

## SEO Files

`robots.txt` and `sitemap.xml` are generated automatically from `VITE_PUBLIC_SITE_URL`
via `scripts/generate-seo-files.mjs` and run on `predev` and `prebuild`.

## Production Build

```bash
npm run build
```

## Chat + Admin Backend

Run backend API in a separate terminal:

```bash
cd server
npm install
npm run dev
```

Admin login now uses server-side authentication tokens. The frontend no longer stores a hardcoded admin password.

## Lint

```bash
npm run lint
```
