import { supabase } from "@/lib/supabase";

// Thin wrapper around the send-telegram-notification Edge Function. Kept
// generic (raw HTML message string, optional inline "open in app" button)
// so any module — attendance, leave, meeting rooms, announcements,
// onboarding, offboarding, etc. — can post to the shared HR Telegram group
// without needing its own Edge Function. Callers are responsible for
// checking system_settings.telegram_notify_enabled (and any event-specific
// scope) before calling this — or just use notifyTelegramEvent() below,
// which does that check for you.
export async function sendTelegramMessage(
  message: string,
  button?: { text: string; url: string }
): Promise<void> {
  const { data, error } = await supabase.functions.invoke("send-telegram-notification", {
    body: { message, buttonText: button?.text, buttonUrl: button?.url },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}

export async function isTelegramNotifyEnabled(): Promise<boolean> {
  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "telegram_notify_enabled")
    .maybeSingle();
  return data?.value === "true";
}

// One-call helper for the common case: check the global toggle, send, and
// swallow any failure (a Telegram outage should never surface as an error
// in an HR workflow that already succeeded). Call it without awaiting —
// same fire-and-forget pattern as the in-app `notify()` calls it sits next
// to at each call site.
export async function notifyTelegramEvent(message: string, button?: { text: string; url: string }): Promise<void> {
  try {
    if (!(await isTelegramNotifyEnabled())) return;
    await sendTelegramMessage(message, button);
  } catch (err) {
    console.warn("Telegram notify failed:", err);
  }
}

export function escapeTelegramHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Builds an absolute link into the app from a path (e.g. "/leave"), for use
// as a Telegram inline button target.
export function hrNexusUrl(path: string): string {
  const appUrl = (import.meta.env.VITE_APP_URL || "https://hrsystem-quit.onrender.com").replace(/\/$/, "");
  return `${appUrl}${path}`;
}
