import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";

export interface OtpConfig {
  otp_code_lifetime_minutes: string;   // default: 5
  otp_codes_per_hour: string;          // default: 3
  otp_wrong_tries_per_code: string;    // default: 3
  otp_resend_wait_seconds: string;     // default: 60
  telegram_otp_enabled: string;        // default: "true"
}

const OTP_KEYS: (keyof OtpConfig)[] = [
  "otp_code_lifetime_minutes",
  "otp_codes_per_hour",
  "otp_wrong_tries_per_code",
  "otp_resend_wait_seconds",
  "telegram_otp_enabled",
];

const DEFAULTS: OtpConfig = {
  otp_code_lifetime_minutes: "5",
  otp_codes_per_hour: "3",
  otp_wrong_tries_per_code: "3",
  otp_resend_wait_seconds: "60",
  telegram_otp_enabled: "true",
};

export function useOtpRateLimit(actorName: string) {
  const [config, setConfig] = useState<OtpConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("system_settings")
      .select("key, value, updated_at")
      .in("key", OTP_KEYS);

    const map: Partial<OtpConfig> = {};
    let latestUpdatedAt: string | null = null;

    (data || []).forEach(({ key, value, updated_at }: { key: string; value: string; updated_at: string }) => {
      if (OTP_KEYS.includes(key as keyof OtpConfig)) {
        (map as any)[key] = value ?? DEFAULTS[key as keyof OtpConfig];
      }
      if (updated_at && (!latestUpdatedAt || updated_at > latestUpdatedAt)) {
        latestUpdatedAt = updated_at;
      }
    });

    setConfig({ ...DEFAULTS, ...map });
    setLastSaved(latestUpdatedAt);
    setDirty(false);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(<K extends keyof OtpConfig>(key: K, value: string) => {
    const cleaned = key === "telegram_otp_enabled" ? value : value.replace(/\D/g, "");
    setConfig((prev) => ({ ...prev, [key]: cleaned }));
    setDirty(true);
  }, []);

  const [togglingTelegramOtp, setTogglingTelegramOtp] = useState(false);

  const toggleTelegramOtp = useCallback(async (enabled: boolean) => {
    const val = enabled ? "true" : "false";
    setConfig((prev) => ({ ...prev, telegram_otp_enabled: val }));
    setTogglingTelegramOtp(true);
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert(
          {
            key: "telegram_otp_enabled",
            value: val,
            type: "boolean",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );

      if (error) throw error;

      toast(
        enabled ? "Telegram OTP Enabled" : "Telegram OTP Disabled",
        enabled
          ? "Employees signing in with a phone number will receive a 6-digit code via Telegram bot."
          : "Phone number OTP is now OFF. Employees signing in with a phone number will log in directly without OTP.",
        "success"
      );

      logActivity({
        module: "settings",
        action: "updated",
        entityType: "system_setting",
        entityId: null,
        actorName,
        actorRole: "admin",
        description: `Phone Number OTP via Telegram Bot ${enabled ? "enabled" : "disabled"}`,
      });
    } catch (err: any) {
      setConfig((prev) => ({ ...prev, telegram_otp_enabled: enabled ? "false" : "true" }));
      toast("Error", err?.message || "Failed to update Telegram OTP setting.", "error");
    } finally {
      setTogglingTelegramOtp(false);
    }
  }, [actorName]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const upserts = OTP_KEYS.map((k) => ({
        key: k,
        value: config[k] !== undefined ? config[k] : DEFAULTS[k],
        type: k === "telegram_otp_enabled" ? "boolean" : "integer",
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("system_settings")
        .upsert(upserts, { onConflict: "key" });

      if (error) throw error;

      setLastSaved(new Date().toISOString());
      setDirty(false);
      toast("Saved", "OTP rate limit settings updated.", "success");
      logActivity({
        module: "settings",
        action: "updated",
        entityType: "system_setting",
        entityId: null,
        actorName,
        actorRole: "admin",
        description: "OTP rate limit configuration updated",
      });
    } catch (err: any) {
      toast("Error", err?.message || "Failed to save OTP settings.", "error");
    } finally {
      setSaving(false);
    }
  }, [config, actorName]);

  return {
    config,
    update,
    load,
    loading,
    save,
    saving,
    dirty,
    lastSaved,
    toggleTelegramOtp,
    togglingTelegramOtp,
  };
}
