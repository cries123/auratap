import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendTelegramMessage(text) {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) return;
  try {
    await fetch(`${API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });
  } catch (err) {
    console.error("Telegram send error:", err);
  }
}
