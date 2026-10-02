import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { EmployeeRateItemSetting } from "./types";

export function useEmployeeRateItems() {
  const [rateItems, setRateItems] = useState<EmployeeRateItemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadRateItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("employee_rate_items")
        .select("*")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setRateItems(data || []);
    } catch (err: any) {
      console.error("Failed to load rate items:", err);
      toast("Error", "Could not load rate items", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRateItems();
  }, [loadRateItems]);

  const saveRateItem = useCallback(
    async (item: Partial<EmployeeRateItemSetting> & { name: string }): Promise<boolean> => {
      try {
        setSaving(true);
        const payload = {
          name: item.name.trim(),
          default_amount: Number(item.default_amount) || 0,
          remark: item.remark?.trim() || "",
          status: item.status || "active",
          display_order: Number(item.display_order) || 0,
          updated_at: new Date().toISOString(),
        };

        let err: any = null;
        if (item.id) {
          const { error } = await supabase
            .from("employee_rate_items")
            .update(payload)
            .eq("id", item.id);
          err = error;
        } else {
          const { error } = await supabase.from("employee_rate_items").insert(payload);
          err = error;
        }

        if (err) throw err;
        toast("Success", item.id ? "Rate item updated" : "Rate item created", "success");
        await loadRateItems();
        return true;
      } catch (err: any) {
        console.error("Failed to save rate item:", err);
        toast("Error", err.message || "Failed to save rate item", "error");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [loadRateItems]
  );

  const toggleStatus = useCallback(
    async (id: string, currentStatus: "active" | "inactive") => {
      try {
        const nextStatus = currentStatus === "active" ? "inactive" : "active";
        const { error } = await supabase
          .from("employee_rate_items")
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
        setRateItems((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
        );
        toast("Updated", `Rate item set to ${nextStatus}`, "success");
      } catch (err: any) {
        toast("Error", err.message || "Failed to update status", "error");
      }
    },
    []
  );

  const deleteRateItem = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("employee_rate_items").delete().eq("id", id);
        if (error) throw error;
        setRateItems((prev) => prev.filter((r) => r.id !== id));
        toast("Deleted", "Rate item removed", "success");
      } catch (err: any) {
        toast("Error", err.message || "Failed to delete rate item", "error");
      }
    },
    []
  );

  return {
    rateItems,
    loading,
    saving,
    saveRateItem,
    toggleStatus,
    deleteRateItem,
    refreshRateItems: loadRateItems,
  };
}
