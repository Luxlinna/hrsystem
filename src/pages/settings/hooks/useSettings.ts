import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import type { Setting } from "../types";
import { useSettingsSaveActions } from "./useSettingsSaveActions";

export function useSettings() {
  const { user } = useAuth();
  const { role } = usePermissions();
  const { refreshBranches } = useBranchScope();

  const actorName =
    (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  const [section, setSection] = useState("general");
  const [settings, setSettings] = useState<Record<string, Setting>>();
  const [loading, setLoading] = useState(true);
  const [edited, setEdited] = useState<Record<string, string>>({});

  const settingsScope = "all";

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
    (key: string) => {
      if (edited[key] !== undefined) return edited[key];
      return settings?.[key]?.value || "";
    },
    [edited, settings]
  );

  const hasChanges = useCallback(
    (keys: string[]) => keys.some((k) => edited[k] !== undefined),
    [edited]
  );

  const { saving, saveSetting, saveAllGeneral, saveAllNotifications } =
    useSettingsSaveActions({
      edited,
      setEdited,
      currentBranchOrSite: undefined,
      settingsScope,
      refreshBranches,
      loadSettings,
      setSettings,
      actorName,
      roleName: role?.name,
    });

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
