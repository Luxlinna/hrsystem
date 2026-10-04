import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { EmployeeFieldSetting } from "./types";

export function useEmployeeFields() {
  const [fields, setFields] = useState<EmployeeFieldSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFields = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("employee_field_settings")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setFields(data || []);
    } catch (err: any) {
      console.error("Failed to load employee fields:", err);
      toast("Error", "Could not load employee fields", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const toggleRequired = useCallback(async (id: string, current: boolean) => {
    try {
      const next = !current;
      const { error } = await supabase
        .from("employee_field_settings")
        .update({ is_required: next, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      setFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, is_required: next } : f))
      );
      toast("Updated", `Field requirement updated`, "success");
    } catch (err: any) {
      toast("Error", err.message || "Failed to update field", "error");
    }
  }, []);

  const toggleEnabled = useCallback(async (id: string, current: boolean) => {
    try {
      const next = !current;
      const { error } = await supabase
        .from("employee_field_settings")
        .update({ is_enabled: next, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      setFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, is_enabled: next } : f))
      );
      toast("Updated", `Field visibility updated`, "success");
    } catch (err: any) {
      toast("Error", err.message || "Failed to update field", "error");
    }
  }, []);

  return {
    fields,
    loading,
    toggleRequired,
    toggleEnabled,
    refreshFields: loadFields,
  };
}
