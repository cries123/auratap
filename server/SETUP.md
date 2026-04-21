# Aura Tap Chat Server Configuration

## Email Notifications (Resend)

1. Create a Resend account: https://resend.com
2. Verify your sending domain in Resend (recommended for production)
3. Create an API key

Then update `.env` in the server folder with:
```
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=support@yourdomain.com
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=replace-with-strong-admin-password
ADMIN_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
```

Notes:
- If your domain is not verified yet, use `EMAIL_FROM=onboarding@resend.dev` for testing.
- Once domain verification is complete, switch `EMAIL_FROM` to your branded sender.


## Admin Panel Access

- **URL:** http://localhost:5173/#/admin
- View all incoming messages
- Reply to messages (sends email to customer)
- Manage conversations

## How It Works

1. ✅ Visitor fills form in chat widget
2. ✅ Message saved to SQLite database
3. ✅ **YOU get email notification** (if configured)
4. ✅ Admin checks http://localhost:5173/#/admin
5. ✅ Admin signs in using server-configured admin password
6. ✅ Admin types response and sends
7. ✅ **Visitor gets email with your reply**

## Files

- `server.js` - Express server & API endpoints
- `db.js` - SQLite database setup
- `emails.js` - Email notification service
- `chat.db` - SQLite database (auto-created)

## Start Server

```
cd server
npm install
npm start
```

Or on Windows (if PowerShell execution policy blocks npm):
```
powershell -NoProfile -ExecutionPolicy Bypass -Command "cd 'server'; npm start"
```
