import { ADMIN_EMAIL, FRONTEND_URL } from './config.js'
import { escapeHtml } from './validation.js'

const RESEND_API_URL = 'https://api.resend.com/emails'

async function sendEmail({ to, subject, html }) {
  const resendApiKey = process.env.RESEND_API_KEY || ''
  const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev'

  if (!resendApiKey || !to) {
    console.warn(`Email not sent (${!resendApiKey ? 'RESEND_API_KEY missing' : 'no recipient'}): ${subject}`)
    return false
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: emailFrom, to, subject, html }),
  })

  if (!response.ok) {
    throw new Error(`Resend API error (${response.status}): ${await response.text()}`)
  }

  return true
}

const paragraphs = (text) => escapeHtml(text).replace(/\n/g, '<br>')

export async function sendNewMessageNotification(visitorName, visitorEmail, visitorMessage, messageId) {
  try {
    const adminBaseUrl = (process.env.ADMIN_URL || FRONTEND_URL).replace(/\/$/, '')
    const adminLink = `${adminBaseUrl}/admin?messageId=${encodeURIComponent(messageId)}`

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `New message from ${visitorName.replace(/[\r\n]+/g, ' ').slice(0, 80)}`,
      html: `
        <h2>New website message</h2>
        <p><strong>From:</strong> ${escapeHtml(visitorName)} (${escapeHtml(visitorEmail)})</p>
        <p><strong>Message:</strong></p>
        <p>${paragraphs(visitorMessage)}</p>
        <hr>
        <p><a href="${escapeHtml(adminLink)}">View &amp; reply in the admin panel</a></p>
      `,
    })
  } catch (error) {
    // The message is already saved; a failed notification shouldn't fail the request.
    console.error('Error sending new message notification:', error)
  }
}

export async function sendAdminResponseEmail(visitorEmail, visitorName, adminResponse) {
  try {
    await sendEmail({
      to: visitorEmail,
      subject: 'A reply from Aura Tap',
      html: `
        <p>Hi ${escapeHtml(visitorName)},</p>
        <p>Thanks for reaching out! Here's our reply:</p>
        <p>${paragraphs(adminResponse)}</p>
        <hr>
        <p>Best regards,<br>The Aura Tap team</p>
      `,
    })
  } catch (error) {
    console.error('Error sending reply email:', error)
  }
}
