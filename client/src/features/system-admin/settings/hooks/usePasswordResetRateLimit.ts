import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";

export interface PasswordResetConfig {
  password_reset_lifetime_minutes: string;   // default: 60
  password_reset_per_hour: string;          // default: 3
  password_reset_resend_wait_seconds: string; // default: 60
  password_reset_max_daily: string;          // default: 5
}

const RESET_KEYS: (keyof PasswordResetConfig)[] = [
  "password_reset_lifetime_minutes",
  "password_reset_per_hour",
  "password_reset_resend_wait_seconds",
  "password_reset_max_daily",
];

const DEFAULTS: PasswordResetConfig = {
  password_reset_lifetime_minutes: "60",
  password_reset_per_hour: "3",
  password_reset_resend_wait_seconds: "60",
  password_reset_max_daily: "5",
};

export function usePasswordResetRateLimit(actorName: string) {
  const [config, setConfig] = useState<PasswordResetConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("system_settings")
      .select("key, value, updated_at")
      .in("key", RESET_KEYS);

    const map: Partial<PasswordResetConfig> = {};
    let latestUpdatedAt: string | null = null;

    (data || []).forEach(({ key, value, updated_at }: { key: string; value: string; updated_at: string }) => {
      if (RESET_KEYS.includes(key as keyof PasswordResetConfig)) {
        (map as any)[key] = value ?? DEFAULTS[key as keyof PasswordResetConfig];
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

  const update = useCallback(<K extends keyof PasswordResetConfig>(key: K, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    setConfig((prev) => ({ ...prev, [key]: cleaned }));
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const upserts = RESET_KEYS.map((k) => ({
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
      toast("Saved", "Password reset rate limit settings updated.", "success");
      logActivity({
        module: "settings",
        action: "updated",
        entityType: "system_setting",
        entityId: null,
        actorName,
        actorRole: "admin",
        description: "Password reset rate limit configuration updated",
      });
    } catch (err: any) {
      toast("Error", err?.message || "Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  }, [config, actorName]);

  return { config, update, load, loading, save, saving, dirty, lastSaved };
}
