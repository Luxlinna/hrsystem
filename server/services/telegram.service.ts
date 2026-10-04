import { env } from '../config/env.js';
import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';

export class TelegramService {
  /**
   * Sends a Telegram notification to the configured channel/group
   * Resolves bot token and chat ID from environment variables or DB system_settings
   */
  async sendNotification(message: string, chatIdOverride?: string): Promise<void> {
    try {
      let botToken = env.TELEGRAM_BOT_TOKEN;
      let targetChatId = chatIdOverride || env.TELEGRAM_CHAT_ID;

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
        logger.warn('[Telegram] Missing bot token or target chat ID in environment/database.');
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
        logger.warn(`[Telegram] Failed to send message: ${res.status} ${errText}`);
      }
    } catch (err: any) {
      logger.warn('[Telegram] Error sending notification:', err?.message || err);
    }
  }
}

export const telegramService = new TelegramService();
export const sendTelegramNotification = (msg: string, chatId?: string) => telegramService.sendNotification(msg, chatId);
