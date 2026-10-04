/**
 * Telegram Invite & Sharing Helpers
 * Provides utilities to build 1-click Telegram invitations for phone accounts.
 */

export function toE164Phone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("855")) {
    return `+${digits}`;
  }
  if (digits.startsWith("0")) {
    return `+855${digits.slice(1)}`;
  }
  if (phone.trim().startsWith("+")) {
    return `+${digits}`;
  }
  return `+855${digits}`;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("0")) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 10 && digits.startsWith("0")) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone;
}

export interface TelegramInviteParams {
  name: string;
  phone: string;
  inviteLink: string;
  appName?: string;
}

export function buildTelegramInviteMessage({
  name,
  phone,
  inviteLink,
  appName = "HR System",
}: TelegramInviteParams): string {
  const formattedPhone = formatPhoneDisplay(phone);
  return `👋 Hello ${name || "there"},

You have been invited to join ${appName}!

Please tap the link below to activate your account and set up your password:
👉 ${inviteLink}

📱 Phone: ${formattedPhone}
⏱ This setup link is valid for 24 hours.

After setting your password, you can sign in directly with your phone number and password.`;
}

/**
 * Creates a Telegram web share URL that opens Telegram's share dialog
 * pre-filled with the invitation link and message.
 */
export function createTelegramShareUrl(inviteLink: string, message: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(message)}`;
}

/**
 * Creates a Telegram direct contact URL for this phone number.
 * When clicked, Telegram tries to open a 1-on-1 chat with this phone number.
 */
export function createTelegramDirectChatUrl(phone: string): string {
  const e164 = toE164Phone(phone);
  return `https://t.me/${e164}`;
}
