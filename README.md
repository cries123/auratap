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
   Set `VITE_PUBLIC_SITE_URL` to your real domain (it falls back to `https://auratap-ee8a0.web.app`).
2. Copy `functions/.env.example` to `functions/.env` for the API (admin password, email, Telegram).

The API, database, and deployment steps are documented in [functions/README.md](functions/README.md).

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

## API (chat, contact form, admin, member portal)

The API is a Firebase Cloud Function backed by Firestore. To run it locally:

```bash
cd functions
npm install
npm run serve
```

`npm run dev` in the project root forwards `/api` requests to it. See
[functions/README.md](functions/README.md) for setup, tests, and deployment.

## Member Portal

Customers create their tap page at `/member`, then program their card with the free NFC Tools
app using the guide at `/setup` (also shown inside the portal with their own link).

## Lint

```bash
npm run lint
```
