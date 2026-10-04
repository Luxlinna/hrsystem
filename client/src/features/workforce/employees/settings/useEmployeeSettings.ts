import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { DEFAULT_EMPLOYEE_SETTINGS, type GeneralEmployeeSettings } from "./types";

export function useEmployeeSettings() {
  const [settings, setSettings] = useState<GeneralEmployeeSettings>(DEFAULT_EMPLOYEE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("employee_settings")
        .select("*")
        .eq("id", "default")
        .maybeSingle();

      if (error) {
        console.warn("Could not load employee settings, using defaults:", error);
      } else if (data) {
        setSettings({
          id: data.id,
          is_show_salary_type: data.is_show_salary_type || "show",
          employee_restrict_age: data.employee_restrict_age ?? 17,
          alert_passport_days: data.alert_passport_days ?? 60,
          alert_driver_license_days: data.alert_driver_license_days ?? 60,
          alert_visa_days: data.alert_visa_days ?? 60,
          alert_work_permit_days: data.alert_work_permit_days ?? 60,
          alert_national_id_days: data.alert_national_id_days ?? 60,
          alert_joining_days: data.alert_joining_days ?? 45,
          alert_joining_recurring: data.alert_joining_recurring ?? true,
          alert_birthday_days: data.alert_birthday_days ?? 30,
          alert_birthday_send_message: data.alert_birthday_send_message ?? false,
          auto_employee_code_enabled: data.auto_employee_code_enabled ?? true,
          auto_employee_code_prefix: data.auto_employee_code_prefix ?? "",
          auto_employee_code_middle: data.auto_employee_code_middle ?? "",
          auto_employee_code_sequence: data.auto_employee_code_sequence ?? 1889,
        });
      }
    } catch (err) {
      console.error("Error loading employee settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = useCallback(
    <K extends keyof GeneralEmployeeSettings>(field: K, value: GeneralEmployeeSettings[K]) => {
      setSettings((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const applySettings = useCallback(async () => {
    try {
      setSaving(true);
      const payload = {
        id: "default",
        is_show_salary_type: settings.is_show_salary_type,
        employee_restrict_age: Number(settings.employee_restrict_age) || 0,
        alert_passport_days: Number(settings.alert_passport_days) || 0,
        alert_driver_license_days: Number(settings.alert_driver_license_days) || 0,
        alert_visa_days: Number(settings.alert_visa_days) || 0,
        alert_work_permit_days: Number(settings.alert_work_permit_days) || 0,
        alert_national_id_days: Number(settings.alert_national_id_days) || 0,
        alert_joining_days: Number(settings.alert_joining_days) || 0,
        alert_joining_recurring: Boolean(settings.alert_joining_recurring),
        alert_birthday_days: Number(settings.alert_birthday_days) || 0,
        alert_birthday_send_message: Boolean(settings.alert_birthday_send_message),
        auto_employee_code_enabled: Boolean(settings.auto_employee_code_enabled),
        auto_employee_code_prefix: settings.auto_employee_code_prefix || "",
        auto_employee_code_middle: settings.auto_employee_code_middle || "",
        auto_employee_code_sequence: Number(settings.auto_employee_code_sequence) || 0,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("employee_settings")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;
      toast("Success", "Employee settings applied successfully", "success");
    } catch (err: any) {
      console.error("Error applying employee settings:", err);
      toast("Error", err.message || "Failed to apply settings", "error");
    } finally {
      setSaving(false);
    }
  }, [settings]);

  return {
    settings,
    loading,
    saving,
    handleChange,
    applySettings,
    refreshSettings: loadSettings,
  };
}
