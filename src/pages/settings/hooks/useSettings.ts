import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";
import { keyLabels, notificationKeys } from "../constants";
import type { Setting } from "../types";

export function useSettings() {
  const { user } = useAuth();
  const { role } = usePermissions();
  const actorName =
    (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  const [section, setSection] = useState("general");
  const [settings, setSettings] = useState<Record<string, Setting>>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState<Record<string, string>>({});

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("system_settings").select("*");
    const map: Record<string, Setting> = {};
    (data || []).forEach((s: Setting) => {
      map[s.key] = s;
    });
    setSettings(map);
    setEdited({});
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateValue = useCallback((key: string, value: string) => {
    setEdited((prev) => ({ ...prev, [key]: value }));
  }, []);

  const getVal = useCallback(
    (key: string) =>
      edited[key] !== undefined ? edited[key] : settings?.[key]?.value || "",
    [edited, settings]
  );

  const hasChanges = useCallback(
    (keys: string[]) => keys.some((k) => edited[k] !== undefined),
    [edited]
  );

  const saveSetting = useCallback(
    async (key: string) => {
      const val = edited[key];
      if (val === undefined) return;
      setSaving(true);
      const { error } = await supabase
        .from("system_settings")
        .update({ value: val, updated_at: new Date().toISOString() })
        .eq("key", key);
      setSaving(false);
      if (error) {
        toast("Error", error.message, "error");
        return;
      }
      setSettings((prev) => ({
        ...prev,
        [key]: { ...prev![key], value: val, updated_at: new Date().toISOString() },
      }));
      setEdited((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      toast(
        "Saved",
        `${keyLabels[key] || key} updated successfully.`,
        "success"
      );
      logActivity({
        module: "settings",
        action: "updated",
        entityType: "system_setting",
        entityId: null,
        actorName,
        actorRole: role?.name || "Unknown",
        description: `${keyLabels[key] || key} setting updated`,
      });
    },
    [edited, actorName, role]
  );

  const saveBatch = useCallback(
    async (keys: string[], successMsg: string) => {
      const changed = keys.filter((k) => edited[k] !== undefined);
      if (changed.length === 0) return;
      setSaving(true);
      for (const key of changed) {
        const { error } = await supabase
          .from("system_settings")
          .update({ value: edited[key], updated_at: new Date().toISOString() })
          .eq("key", key);
        if (error) {
          setSaving(false);
          toast(
            "Error",
            `Failed to save ${keyLabels[key] || key}: ${error.message}`,
            "error"
          );
          return;
        }
      }
      setSaving(false);
      loadSettings();
      toast("Saved", successMsg, "success");
    },
    [edited, loadSettings]
  );

  const saveAllGeneral = useCallback(
    () => saveBatch(Object.keys(keyLabels), "All general settings updated."),
    [saveBatch]
  );

  const saveAllNotifications = useCallback(
    () =>
      saveBatch(
        notificationKeys.map((n) => n.key),
        "Notification preferences updated."
      ),
    [saveBatch]
  );

  return {
    section,
    setSection,
    settings,
    loading,
    saving,
    edited,
    getVal,
    hasChanges,
    updateValue,
    saveSetting,
    saveAllGeneral,
    saveAllNotifications,
  };
}
