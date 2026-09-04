import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { logActivity } from "@/lib/audit";
import { keyLabels, notificationKeys } from "../constants";
import type { Setting } from "../types";

export function useSettings() {
  const { user } = useAuth();
  const { role } = usePermissions();
  const {
    visibleBranches,
    selectedBranchId,
    setSelectedBranchId,
    refreshBranches,
  } = useBranchScope();

  const actorName =
    (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  const [section, setSection] = useState("general");
  const [settings, setSettings] = useState<Record<string, Setting>>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState<Record<string, string>>({});

  // Active scope in settings: "all" for company-wide, or branch/site ID
  const [settingsScope, setSettingsScope] = useState<string>(() => selectedBranchId || "all");

  useEffect(() => {
    if (selectedBranchId) {
      setSettingsScope(selectedBranchId);
      setEdited({});
    }
  }, [selectedBranchId]);

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

  const currentBranchOrSite = visibleBranches.find((b) => b.id === settingsScope);

  const updateValue = useCallback((key: string, value: string) => {
    setEdited((prev) => ({ ...prev, [key]: value }));
  }, []);

  const getVal = useCallback(
    (key: string) => {
      if (edited[key] !== undefined) return edited[key];

      // If viewing a branch or site scope, return site/branch schedule values for schedule keys
      if (currentBranchOrSite && settingsScope !== "all") {
        if (key === "work_start_time" && currentBranchOrSite.work_start_time) {
          return currentBranchOrSite.work_start_time.slice(0, 5);
        }
        if (key === "work_end_time" && currentBranchOrSite.work_end_time) {
          return currentBranchOrSite.work_end_time.slice(0, 5);
        }
        if (key === "break_start_time" && currentBranchOrSite.break_start_time) {
          return currentBranchOrSite.break_start_time.slice(0, 5);
        }
        if (key === "break_end_time" && currentBranchOrSite.break_end_time) {
          return currentBranchOrSite.break_end_time.slice(0, 5);
        }
        if (key === "late_grace_minutes" && currentBranchOrSite.late_grace_minutes != null) {
          return String(currentBranchOrSite.late_grace_minutes);
        }
        if (key === "early_leave_grace_minutes" && currentBranchOrSite.early_leave_grace_minutes != null) {
          return String(currentBranchOrSite.early_leave_grace_minutes);
        }
        if (key === "is_four_punch_enabled" && currentBranchOrSite.is_four_punch_enabled !== undefined) {
          return String(currentBranchOrSite.is_four_punch_enabled);
        }
      }

      return settings?.[key]?.value || "";
    },
    [edited, currentBranchOrSite, settingsScope, settings]
  );

  const hasChanges = useCallback(
    (keys: string[]) => keys.some((k) => edited[k] !== undefined),
    [edited]
  );

  const formatTimeSeconds = (t?: string, defaultVal = "08:00:00") => {
    if (!t || !t.trim()) return defaultVal;
    const parts = t.trim().split(":");
    const h = (parts[0] || "00").padStart(2, "0");
    const m = (parts[1] || "00").padStart(2, "0");
    const s = (parts[2] || "00").padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const saveSetting = useCallback(
    async (key: string) => {
      const val = edited[key];
      if (val === undefined) return;
      setSaving(true);

      const isSiteScope = currentBranchOrSite?.is_site && settingsScope.startsWith("site:");
      const isBranchScope = currentBranchOrSite && !currentBranchOrSite.is_site && settingsScope !== "all";

      const scheduleKeys = [
        "work_start_time",
        "work_end_time",
        "break_start_time",
        "break_end_time",
        "late_grace_minutes",
        "early_leave_grace_minutes",
        "is_four_punch_enabled",
      ];

      if (isSiteScope && scheduleKeys.includes(key)) {
        const siteId = settingsScope.substring(5);
        const updatePayload: Record<string, any> = {};
        if (key === "is_four_punch_enabled") {
          updatePayload.is_four_punch_enabled = val === "true";
        } else if (key === "late_grace_minutes" || key === "early_leave_grace_minutes") {
          updatePayload[key] = parseInt(val, 10) || 15;
        } else {
          updatePayload[key] = formatTimeSeconds(val);
        }

        const { error } = await supabase
          .from("work_locations")
          .update(updatePayload)
          .eq("id", siteId);

        setSaving(false);
        if (error) {
          toast("Error", error.message, "error");
          return;
        }

        await refreshBranches();
        setEdited((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        toast("Saved", `${currentBranchOrSite.name} schedule updated.`, "success");
        return;
      }

      if (
        isBranchScope &&
        (key === "work_start_time" ||
          key === "work_end_time" ||
          key === "late_grace_minutes" ||
          key === "early_leave_grace_minutes")
      ) {
        const updateVal =
          key === "late_grace_minutes" || key === "early_leave_grace_minutes"
            ? parseInt(val, 10) || 15
            : formatTimeSeconds(val);

        const { error } = await supabase
          .from("branches")
          .update({ [key]: updateVal })
          .eq("id", settingsScope);

        setSaving(false);
        if (error) {
          toast("Error", error.message, "error");
          return;
        }

        await refreshBranches();
        setEdited((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        toast("Saved", `${currentBranchOrSite.name} schedule updated.`, "success");
        return;
      }

      // Default: save to system_settings
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
      toast("Saved", `${keyLabels[key] || key} updated successfully.`, "success");
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
    [edited, currentBranchOrSite, settingsScope, refreshBranches, actorName, role]
  );

  const saveBatch = useCallback(
    async (keys: string[], successMsg: string) => {
      const changed = keys.filter((k) => edited[k] !== undefined);
      if (changed.length === 0) return;
      setSaving(true);

      const isSiteScope = currentBranchOrSite?.is_site && settingsScope.startsWith("site:");
      const isBranchScope = currentBranchOrSite && !currentBranchOrSite.is_site && settingsScope !== "all";

      if (isSiteScope) {
        const siteId = settingsScope.substring(5);
        const sitePayload: Record<string, any> = {};
        const systemKeys: string[] = [];

        for (const key of changed) {
          if (key === "is_four_punch_enabled") {
            sitePayload.is_four_punch_enabled = edited[key] === "true";
          } else if (["work_start_time", "work_end_time", "break_start_time", "break_end_time"].includes(key)) {
            sitePayload[key] = formatTimeSeconds(edited[key]);
          } else {
            systemKeys.push(key);
          }
        }

        if (Object.keys(sitePayload).length > 0) {
          const { error } = await supabase.from("work_locations").update(sitePayload).eq("id", siteId);
          if (error) {
            setSaving(false);
            toast("Error", `Failed to save work site schedule: ${error.message}`, "error");
            return;
          }
        }

        for (const key of systemKeys) {
          await supabase.from("system_settings").update({ value: edited[key], updated_at: new Date().toISOString() }).eq("key", key);
        }

        setSaving(false);
        await refreshBranches();
        await loadSettings();
        toast("Saved", `Updated schedule for ${currentBranchOrSite.name}`, "success");
        return;
      }

      if (isBranchScope) {
        const branchPayload: Record<string, any> = {};
        const systemKeys: string[] = [];

        for (const key of changed) {
          if (["work_start_time", "work_end_time"].includes(key)) {
            branchPayload[key] = formatTimeSeconds(edited[key]);
          } else {
            systemKeys.push(key);
          }
        }

        if (Object.keys(branchPayload).length > 0) {
          const { error } = await supabase.from("branches").update(branchPayload).eq("id", settingsScope);
          if (error) {
            setSaving(false);
            toast("Error", `Failed to save branch schedule: ${error.message}`, "error");
            return;
          }
        }

        for (const key of systemKeys) {
          await supabase.from("system_settings").update({ value: edited[key], updated_at: new Date().toISOString() }).eq("key", key);
        }

        setSaving(false);
        await refreshBranches();
        await loadSettings();
        toast("Saved", `Updated schedule for ${currentBranchOrSite.name}`, "success");
        return;
      }

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
    [edited, currentBranchOrSite, settingsScope, refreshBranches, loadSettings]
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

  const handleScopeChange = useCallback((newScope: string) => {
    setSettingsScope(newScope);
    setEdited({});
    if (newScope !== "all") {
      setSelectedBranchId(newScope);
    }
  }, [setSelectedBranchId]);

  return {
    section,
    setSection,
    settings,
    loading,
    saving,
    edited,
    settingsScope,
    setSettingsScope: handleScopeChange,
    visibleBranches,
    currentBranchOrSite,
    getVal,
    hasChanges,
    updateValue,
    saveSetting,
    saveAllGeneral,
    saveAllNotifications,
  };
}
