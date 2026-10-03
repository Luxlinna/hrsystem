import { useState, useCallback } from "react";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { keyLabels, notificationKeys } from "../constants";
import type { Setting } from "../types";
import { SCHEDULE_KEYS, BRANCH_SCHEDULE_KEYS } from "./settingsScheduleUtils";
import {
  saveSiteSingleSetting,
  saveBranchSingleSetting,
  saveSystemSingleSetting,
  saveSiteBatch,
  saveBranchBatch,
  saveSystemBatch,
} from "./settingsSaveService";

interface SaveActionsParams {
  edited: Record<string, string>;
  setEdited: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  currentBranchOrSite: any;
  settingsScope: string;
  refreshBranches: () => Promise<void>;
  loadSettings: () => Promise<void>;
  setSettings: React.Dispatch<React.SetStateAction<Record<string, Setting> | undefined>>;
  actorName: string;
  roleName?: string;
}

export function useSettingsSaveActions({
  edited,
  setEdited,
  currentBranchOrSite,
  settingsScope,
  refreshBranches,
  loadSettings,
  setSettings,
  actorName,
  roleName,
}: SaveActionsParams) {
  const [saving, setSaving] = useState(false);

  const clearEditedKey = useCallback((key: string) => {
    setEdited((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, [setEdited]);

  const saveSetting = useCallback(
    async (key: string) => {
      const val = edited[key];
      if (val === undefined) return;
      setSaving(true);

      const isSiteScope = currentBranchOrSite?.is_site && settingsScope.startsWith("site:");
      const isBranchScope = currentBranchOrSite && !currentBranchOrSite.is_site && settingsScope !== "all";

      if (isSiteScope && (SCHEDULE_KEYS as readonly string[]).includes(key)) {
        const { error } = await saveSiteSingleSetting(settingsScope.substring(5), key, val);
        setSaving(false);
        if (error) return toast("Error", error.message, "error");
        await refreshBranches();
        clearEditedKey(key);
        return toast("Saved", `${currentBranchOrSite.name} schedule updated.`, "success");
      }

      if (isBranchScope && (BRANCH_SCHEDULE_KEYS as readonly string[]).includes(key)) {
        const { error } = await saveBranchSingleSetting(settingsScope, key, val);
        setSaving(false);
        if (error) return toast("Error", error.message, "error");
        await refreshBranches();
        clearEditedKey(key);
        return toast("Saved", `${currentBranchOrSite.name} schedule updated.`, "success");
      }

      const { error } = await saveSystemSingleSetting(key, val);
      setSaving(false);
      if (error) return toast("Error", error.message, "error");

      setSettings((prev) => ({
        ...prev,
        [key]: { ...prev![key], value: val, updated_at: new Date().toISOString() },
      }));
      clearEditedKey(key);
      toast("Saved", `${keyLabels[key] || key} updated successfully.`, "success");
      logActivity({
        module: "settings",
        action: "updated",
        entityType: "system_setting",
        entityId: null,
        actorName,
        actorRole: roleName || "Unknown",
        description: `${keyLabels[key] || key} setting updated`,
      });
    },
    [edited, currentBranchOrSite, settingsScope, refreshBranches, setSettings, actorName, roleName, clearEditedKey]
  );

  const saveBatch = useCallback(
    async (keys: string[], successMsg: string) => {
      const changed = keys.filter((k) => edited[k] !== undefined);
      if (changed.length === 0) return;
      setSaving(true);

      const isSiteScope = currentBranchOrSite?.is_site && settingsScope.startsWith("site:");
      const isBranchScope = currentBranchOrSite && !currentBranchOrSite.is_site && settingsScope !== "all";

      try {
        if (isSiteScope) {
          await saveSiteBatch(settingsScope.substring(5), changed, edited);
          setSaving(false);
          await refreshBranches();
          await loadSettings();
          return toast("Saved", `Updated schedule for ${currentBranchOrSite.name}`, "success");
        }

        if (isBranchScope) {
          await saveBranchBatch(settingsScope, changed, edited);
          setSaving(false);
          await refreshBranches();
          await loadSettings();
          return toast("Saved", `Updated schedule for ${currentBranchOrSite.name}`, "success");
        }

        await saveSystemBatch(changed, edited);
        setSaving(false);
        await loadSettings();
        toast("Saved", successMsg, "success");
      } catch (err: any) {
        setSaving(false);
        toast("Error", err?.message || "Failed to save settings", "error");
      }
    },
    [edited, currentBranchOrSite, settingsScope, refreshBranches, loadSettings]
  );

  const saveAllGeneral = useCallback(
    () => saveBatch(Object.keys(keyLabels), "All general settings updated."),
    [saveBatch]
  );

  const saveAllNotifications = useCallback(
    () => saveBatch(notificationKeys.map((n) => n.key), "Notification preferences updated."),
    [saveBatch]
  );

  return { saving, saveSetting, saveAllGeneral, saveAllNotifications };
}
