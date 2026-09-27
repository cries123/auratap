# Aura Tap API (Firebase Cloud Functions)

One Express app, deployed as the `api` function. Firebase Hosting forwards every `/api/**`
request to it (see `firebase.json`), so the site and API share a domain.

All data lives in **Cloud Firestore**:

| Collection | What it holds |
| --- | --- |
| `members` | Member profiles, contact card fields, buttons, password hashes |
| `emails`, `slugs` | Keep emails and tap links unique. Old links stay pointed at the member so programmed cards keep working. |
| `sessions` | Member and admin logins (30 days / 12 hours) |
| `passwordResets` | One-time reset links (1 hour) |
| `messages` (+ `responses`) | Chat widget and contact form threads |
| `rateLimits` | Shared login, sign-up, and form limits |

`firestore.rules` blocks all direct browser access; only this function reads and writes data.

## First-time setup

1. In the [Firebase console](https://console.firebase.google.com/project/auratap-ee8a0/firestore),
   create a Firestore database (Native mode, production rules).
2. Optional but recommended: in Firestore > TTL policies, add a policy on the `expiresAt` field for
   `sessions`, `passwordResets`, and `rateLimits` so expired records clean themselves up.
3. Copy `.env.example` to `.env` in this folder and fill it in. `ADMIN_PASSWORD` is required for
   `/admin`; `RESEND_API_KEY` is required for password reset emails.

## Deploy

From the project root:

```bash
npm run build
npx firebase deploy --only hosting,functions,firestore
```

## Telegram replies

New chats are sent to Telegram when `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ADMIN_CHAT_ID` are set.
To answer visitors by replying in Telegram, register the webhook once after deploying
(use the same `TELEGRAM_WEBHOOK_SECRET` as in `.env`):

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://auratap-ee8a0.web.app/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

## aurataps.net (Netlify)

`aurataps.net` is served by Netlify, which builds the site from `main`. The root `netlify.toml`
forwards `/api/*` to `https://auratap-ee8a0.web.app/api/*` (and on to this function) and serves
the app for every other path, so pages and members' tap links (`aurataps.net/<link>`) work there.

`aurataps.net` is the default public address: the member portal, card setup guide, sitemap,
password reset emails, and saved contact cards all use it. `auratap-ee8a0.web.app` keeps working
as a mirror. To serve the domain from Firebase instead, add it under Hosting > Add custom domain
and move the DNS records off Netlify; nothing else needs to change.

## Local development and tests

```bash
cd functions
npm install
npm run serve   # Functions + Firestore emulators
npm test        # end-to-end API tests against the emulators (offline demo project)
```

In another terminal, `npm run dev` in the project root proxies `/api` to the emulator.
Password reset emails are not sent locally; the function logs a notice instead.
