import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";

export interface SmtpConfig {
  smtp_host: string;
  smtp_port: string;
  smtp_secure: string;          // "true" | "false"
  smtp_user: string;
  smtp_pass: string;            // never returned — write-only display
  smtp_from_name: string;
  smtp_from_email: string;
  smtp_send_on_signup: string;  // "true" | "false"
  smtp_send_on_invite: string;  // "true" | "false"
}

const SMTP_KEYS: (keyof SmtpConfig)[] = [
  "smtp_host",
  "smtp_port",
  "smtp_secure",
  "smtp_user",
  "smtp_pass",
  "smtp_from_name",
  "smtp_from_email",
  "smtp_send_on_signup",
  "smtp_send_on_invite",
];

const QUICK_FILL: Record<string, Partial<SmtpConfig>> = {
  Gmail: {
    smtp_host: "smtp.gmail.com",
    smtp_port: "465",
    smtp_secure: "true",
  },
  Brevo: {
    smtp_host: "smtp-relay.brevo.com",
    smtp_port: "587",
    smtp_secure: "false",
  },
  Outlook: {
    smtp_host: "smtp.office365.com",
    smtp_port: "587",
    smtp_secure: "false",
  },
};

export function useSmtpSettings(actorName: string) {
  const [config, setConfig] = useState<SmtpConfig>({
    smtp_host: "",
    smtp_port: "587",
    smtp_secure: "false",
    smtp_user: "",
    smtp_pass: "",
    smtp_from_name: "",
    smtp_from_email: "",
    smtp_send_on_signup: "false",
    smtp_send_on_invite: "true",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", SMTP_KEYS);

    const map: Partial<SmtpConfig> = {};
    let pwdSaved = false;
    (data || []).forEach(({ key, value }: { key: string; value: string }) => {
      if (key === "smtp_pass") {
        // never expose password; just flag it's been saved
        pwdSaved = Boolean(value);
      } else {
        (map as any)[key] = value ?? "";
      }
    });
    setConfig((prev) => ({ ...prev, ...map, smtp_pass: "" }));
    setHasPassword(pwdSaved);
    setDirty(false);
    setLoading(false);
  }, []);

  const update = useCallback(<K extends keyof SmtpConfig>(key: K, value: SmtpConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const applyPreset = useCallback((preset: string) => {
    const vals = QUICK_FILL[preset];
    if (!vals) return;
    setConfig((prev) => ({ ...prev, ...vals }));
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const upserts = SMTP_KEYS
        .filter((k) => {
          if (k === "smtp_pass") return Boolean(config.smtp_pass); // only write if user typed something
          return true;
        })
        .map((k) => ({ key: k, value: config[k] }));

      const { error } = await supabase
        .from("system_settings")
        .upsert(upserts, { onConflict: "key" });

      if (error) throw error;

      if (config.smtp_pass) setHasPassword(true);
      setDirty(false);
      toast("Saved", "SMTP email settings updated.", "success");
      logActivity({
        module: "settings",
        action: "updated",
        entityType: "system_setting",
        entityId: null,
        actorName,
        actorRole: "admin",
        description: "SMTP email configuration updated",
      });
    } catch (err: any) {
      toast("Error", err?.message || "Failed to save SMTP settings.", "error");
    } finally {
      setSaving(false);
    }
  }, [config, actorName]);

  const sendTest = useCallback(async (customRecipient?: string) => {
    setTesting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const targetEmail = (customRecipient || session?.user?.email || config.smtp_from_email || "").trim();
      const res = await fetch("/api/settings/smtp/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          to: targetEmail,
        }),
      });
      const json = await res.json().catch(() => ({ message: "No response body from server" }));
      if (!res.ok) throw new Error(json?.message || "Test failed");
      toast("Test sent", json?.message || `Sent test email to ${targetEmail}. Please check inbox & spam folder.`, "success");
    } catch (err: any) {
      toast("Test failed", err?.message || "Could not send test email.", "error");
    } finally {
      setTesting(false);
    }
  }, [config.smtp_from_email]);

  return {
    config, update, applyPreset,
    load, loading,
    save, saving,
    sendTest, testing,
    hasPassword,
    dirty,
    QUICK_FILL,
  };
}
