import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { WarningTypeSetting, WarningTypeFormData } from "./types";

export function useWarningSettings() {
  const [warningTypes, setWarningTypes] = useState<WarningTypeSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("warning_types")
        .select("*")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setWarningTypes(data || []);
    } catch (err: any) {
      console.error("Failed to load warning settings:", err);
      toast("Error", "Could not load warning settings", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return warningTypes.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchRemark = (item.remark || "").toLowerCase().includes(q);
        if (!matchName && !matchRemark) return false;
      }
      return true;
    });
  }, [warningTypes, statusFilter, searchQuery]);

  const saveWarningType = useCallback(
    async (id: string | undefined, form: WarningTypeFormData): Promise<boolean> => {
      try {
        setSaving(true);
        const payload = {
          name: form.name.trim(),
          alert_days_after: Number(form.alert_days_after) || 0,
          stop_alert_days: Number(form.stop_alert_days) || 0,
          remark: form.remark?.trim() || "",
          status: form.status,
          display_order: Number(form.display_order) || 0,
          updated_at: new Date().toISOString(),
        };

        let err: any = null;
        if (id) {
          const { error } = await supabase
            .from("warning_types")
            .update(payload)
            .eq("id", id);
          err = error;
        } else {
          const { error } = await supabase.from("warning_types").insert(payload);
          err = error;
        }

        if (err) throw err;
        toast("Success", id ? "Warning type updated" : "Warning type created", "success");
        await loadData();
        return true;
      } catch (err: any) {
        console.error("Failed to save warning type:", err);
        toast("Error", err.message || "Failed to save warning type", "error");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [loadData]
  );

  const toggleStatus = useCallback(
    async (id: string, current: "active" | "inactive") => {
      try {
        const next = current === "active" ? "inactive" : "active";
        const { error } = await supabase
          .from("warning_types")
          .update({ status: next, updated_at: new Date().toISOString() })
          .eq("id", id);

        if (error) throw error;
        setWarningTypes((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: next } : item))
        );
        toast("Updated", `Warning type set to ${next}`, "success");
      } catch (err: any) {
        toast("Error", err.message || "Failed to toggle status", "error");
      }
    },
    []
  );

  const deleteWarningType = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("warning_types").delete().eq("id", id);
        if (error) throw error;
        setWarningTypes((prev) => prev.filter((item) => item.id !== id));
        toast("Deleted", "Warning type deleted", "success");
      } catch (err: any) {
        toast("Error", err.message || "Failed to delete warning type", "error");
      }
    },
    []
  );

  return {
    warningTypes: filtered,
    rawWarningTypes: warningTypes,
    loading,
    saving,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    saveWarningType,
    toggleStatus,
    deleteWarningType,
    refreshData: loadData,
  };
}
