-- Telegram group notifications for attendance events (check-in, checkout,
-- late check-in, early checkout), sent via the send-telegram-notification
-- Edge Function. The bot token and chat id are Edge Function secrets
-- (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID) — never stored in the database.
-- This setting just toggles whether notifyAttendanceEvent() dispatches to
-- Telegram at all; off by default until an admin configures the bot and
-- flips it on from Settings -> Notifications.
insert into system_settings (key, value, type) values
  ('telegram_notify_enabled', 'false', 'boolean')
on conflict (key) do nothing;
