import { supabase } from "@/lib/supabase";
import { isPhoneIdentifier, isPhoneSyntheticEmail, phoneToSyntheticEmail } from "@/lib/phoneUtils";

export function resolveAuthEmail(identifier: string): string {
  const raw = (identifier || "").trim();
  const isPhone = isPhoneIdentifier(raw) || isPhoneSyntheticEmail(raw);
  return isPhone
    ? (isPhoneSyntheticEmail(raw) ? raw.toLowerCase() : phoneToSyntheticEmail(raw))
    : raw.toLowerCase();
}

export async function sendOTPService(identifier: string): Promise<void> {
  const raw = (identifier || "").trim();
  const isPhone = isPhoneIdentifier(raw) || isPhoneSyntheticEmail(raw);

  // Immediate guard: If phone OTP via Telegram bot is disabled by admin, halt immediately
  if (isPhone) {
    const { data: otpSetting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "telegram_otp_enabled")
      .maybeSingle();

    if (otpSetting?.value === "false") {
      const errObj: any = new Error(
        "Phone number OTP via Telegram bot is currently disabled by administrator. Please log in using your email and password."
      );
      errObj.telegramOtpDisabled = true;
      throw errObj;
    }
  }

  const resolvedEmail = resolveAuthEmail(identifier);
  const { data, error } = await supabase.functions.invoke("send-otp", {
    body: { email: resolvedEmail },
  });

  if (error) {
    let detail = data?.error;
    let botUrl = data?.bot_url;
    let msg = data?.message;
    if (error.context instanceof Response) {
      try {
        const body = await error.context.json();
        detail = body?.error || detail;
        botUrl = body?.bot_url || botUrl;
        msg = body?.message || msg;
      } catch { /* non-JSON */ }
    }
    const errObj: any = new Error(msg || detail || error.message || "Failed to send OTP");
    if (detail === "telegram_not_connected" || msg?.includes("Telegram is not connected")) {
      errObj.telegramNotConnected = true;
      errObj.botUrl = botUrl || "https://t.me/HRM_OPS_bot?start=connect";
    }
    if (detail === "telegram_otp_disabled" || msg?.includes("disabled by administrator")) {
      errObj.telegramOtpDisabled = true;
    }
    throw errObj;
  }

  if (data?.error) {
    const errObj: any = new Error(data.message || data.error);
    if (data.error === "telegram_not_connected" || data.message?.includes("Telegram is not connected")) {
      errObj.telegramNotConnected = true;
      errObj.botUrl = data.bot_url || "https://t.me/HRM_OPS_bot?start=connect";
    }
    if (data.error === "telegram_otp_disabled" || data.message?.includes("disabled by administrator")) {
      errObj.telegramOtpDisabled = true;
    }
    throw errObj;
  }
}

export async function verifyOTPService(identifier: string, otp: string): Promise<string> {
  const resolvedEmail = resolveAuthEmail(identifier);
  const { data, error } = await supabase.functions.invoke("verify-otp", {
    body: { email: resolvedEmail, otp },
  });

  if (error) {
    let detail = data?.error;
    if (!detail && error.context instanceof Response) {
      try {
        const body = await error.context.json();
        detail = body?.error;
      } catch { /* non-JSON */ }
    }
    throw new Error(detail || error.message || "Failed to verify OTP");
  }

  if (data?.error) throw new Error(data.error);
  return resolvedEmail;
}
