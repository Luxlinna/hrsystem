import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";

export interface OtpConfig {
  otp_code_lifetime_minutes: string;   // default: 5
  otp_codes_per_hour: string;          // default: 3
  otp_wrong_tries_per_code: string;    // default: 3
  otp_resend_wait_seconds: string;     // default: 60
}

const OTP_KEYS: (keyof OtpConfig)[] = [
  "otp_code_lifetime_minutes",
  "otp_codes_per_hour",
  "otp_wrong_tries_per_code",
  "otp_resend_wait_seconds",
];

const DEFAULTS: OtpConfig = {
  otp_code_lifetime_minutes: "5",
  otp_codes_per_hour: "3",
  otp_wrong_tries_per_code: "3",
  otp_resend_wait_seconds: "60",
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
    // Only allow positive integers
    const cleaned = value.replace(/\D/g, "");
    setConfig((prev) => ({ ...prev, [key]: cleaned }));
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const upserts = OTP_KEYS.map((k) => ({
        key: k,
        value: config[k] || DEFAULTS[k],
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

  return { config, update, load, loading, save, saving, dirty, lastSaved };
}
