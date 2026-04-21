/* global process */

const RESEND_API_URL = 'https://api.resend.com/emails'

async function sendEmail({ to, subject, html }) {
  const resendApiKey = process.env.RESEND_API_KEY || ''
  const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev'

  if (!resendApiKey) {
    console.warn('RESEND_API_KEY is not configured. Skipping email send.')
    return false
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to,
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Resend API error (${response.status}): ${errorText}`)
  }

  return true
}

export async function sendNewMessageNotification(visitorName, visitorEmail, visitorMessage, messageId) {
  try {
    const adminBaseUrl = process.env.ADMIN_URL || process.env.FRONTEND_URL || 'http://localhost:5173'
    const normalizedAdminBaseUrl = adminBaseUrl.replace(/\/$/, '')
    const adminLink = `${normalizedAdminBaseUrl}/#/admin?messageId=${messageId}`

    const sent = await sendEmail({
      to: process.env.ADMIN_EMAIL || 'your_email@example.com',
      subject: `🆕 New Chat Message #${messageId} from ${visitorName}`,
      html: `
        <h2>New Live Chat Message</h2>
        <p><strong>Ticket:</strong> #${messageId}</p>
        <p><strong>From:</strong> ${visitorName} (${visitorEmail})</p>
        <p><strong>Message:</strong></p>
        <p>${visitorMessage.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>Respond from the admin panel to keep thread history accurate.</em></p>
        <p><a href="${adminLink}">View & Reply in Admin Panel</a></p>
      `,
    })
    if (sent) {
      console.log(`Email notification sent for message from ${visitorName}`)
    }
  } catch (error) {
    console.error('Error sending email notification:', error)
    // Don't throw - chat should work even if email fails
  }
}

export async function sendAdminResponseEmail(visitorEmail, visitorName, adminResponse) {
  try {
    const sent = await sendEmail({
      to: visitorEmail,
      subject: 'Response from Aura Tap Support',
      html: `
        <h2>Hi ${visitorName},</h2>
        <p>Thanks for reaching out! Here's our response:</p>
        <p>${adminResponse.replace(/\n/g, '<br>')}</p>
        <hr>
        <p>Best regards,<br>Aura Tap Team</p>
      `,
    })
    if (sent) {
      console.log(`Response email sent to ${visitorEmail}`)
    }
  } catch (error) {
    console.error('Error sending response email:', error)
  }
}
