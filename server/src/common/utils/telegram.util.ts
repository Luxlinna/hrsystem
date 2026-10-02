import dotenv from 'dotenv';
dotenv.config();
import { prisma } from '../../core/infrastructure/database/prisma.client.js';

/**
 * Sends a Telegram notification to the configured channel/group
 * Resolves bot token and chat ID from environment variables or DB system_settings
 */
export async function sendTelegramNotification(message: string, chatIdOverride?: string): Promise<void> {
  try {
    let botToken = process.env.TELEGRAM_BOT_TOKEN;
    let targetChatId = chatIdOverride || process.env.TELEGRAM_CHAT_ID;

    // Fallback: Read credentials from system_settings table if not provided in .env
    if (!botToken) {
      const tokenSetting = await prisma.system_settings.findUnique({
        where: { key: 'telegram_bot_token' },
      });
      if (tokenSetting?.value) {
        botToken = tokenSetting.value.trim();
      }
    }

    if (!targetChatId) {
      const notifSetting = await prisma.system_settings.findUnique({
        where: { key: 'telegram_notifications_chat_id' },
      });
      if (notifSetting?.value) {
        targetChatId = notifSetting.value.trim();
      } else {
        const legacySetting = await prisma.system_settings.findUnique({
          where: { key: 'telegram_group_chat_id' },
        });
        if (legacySetting?.value) {
          targetChatId = legacySetting.value.trim();
        }
      }
    }

    if (!botToken || !targetChatId) {
      console.warn('[Telegram] Warning: Missing bot token or target chat ID in environment/database.');
      return;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Telegram] Failed to send message: ${res.status} ${errText}`);
    }
  } catch (err: any) {
    console.warn('[Telegram] Error sending notification:', err?.message || err);
  }
}
