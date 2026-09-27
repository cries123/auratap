import { TELEGRAM_ADMIN_CHAT_ID, TELEGRAM_BOT_TOKEN } from './config.js'
import { escapeHtml } from './validation.js'

export async function sendTelegramMessage(html) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) return
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_ADMIN_CHAT_ID, text: html, parse_mode: 'HTML' }),
    })
  } catch (error) {
    console.error('Telegram send error:', error)
  }
}

export function newChatAlert({ visitorName, visitorMessage, messageId }) {
  return [
    '<b>New website chat</b>',
    '',
    `<b>From:</b> ${escapeHtml(visitorName)}`,
    `<b>Message:</b> ${escapeHtml(visitorMessage)}`,
    '',
    `<i>MessageID: ${escapeHtml(messageId)}</i>`,
    '',
    '(Reply to this message to answer them on the website)',
  ].join('\n')
}

// Telegram sends admin replies here (see functions/README.md for the one-time webhook setup).
// Returns { messageId, text } when the update is a reply to one of our chat alerts.
export function parseAdminReply(update) {
  const message = update?.message
  if (!message?.text || !message.reply_to_message?.text) return null
  if (String(message.chat?.id) !== String(TELEGRAM_ADMIN_CHAT_ID)) return null
  const match = message.reply_to_message.text.match(/MessageID: ([A-Za-z0-9]+)/)
  return match ? { messageId: match[1], text: message.text } : null
}
