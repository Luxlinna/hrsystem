import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { ExitReasonTypeSetting, SettingFormData } from "./types";

export function useExitReasonTypesMutations(
  reasonTypes: ExitReasonTypeSetting[],
  loadData: () => Promise<void>
) {
  const [saving, setSaving] = useState(false);

  const saveReasonType = useCallback(
    async (id: string | null, form: SettingFormData) => {
      setSaving(true);
      try {
        if (id) {
          const { error } = await supabase
            .from("exit_reason_types")
            .update({
              name: form.name.trim(),
              status: form.status,
              display_order: Number(form.display_order) || 0,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);
          if (error) throw error;
          toast("Reason Type Updated", "Reason type updated successfully", "success");
        } else {
          const { error } = await supabase.from("exit_reason_types").insert([
            {
              name: form.name.trim(),
              status: form.status,
              display_order: Number(form.display_order) || reasonTypes.length + 1,
            },
          ]);
          if (error) throw error;
          toast("Reason Type Added", "New reason type created successfully", "success");
        }
        await loadData();
        return true;
      } catch (err: any) {
        console.error("Failed to save reason type:", err);
        toast("Save Failed", err.message || "Failed to save reason type", "error");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [reasonTypes.length, loadData]
  );

  const toggleReasonTypeStatus = useCallback(
    async (item: ExitReasonTypeSetting) => {
      const nextStatus = item.status === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("exit_reason_types")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", item.id);
      if (error) {
        toast("Update Failed", "Failed to update status", "error");
      } else {
        toast("Status Updated", `Reason type marked ${nextStatus}`, "success");
        loadData();
      }
    },
    [loadData]
  );

  const deleteReasonType = useCallback(
    async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this reason type?")) return;
      const { error } = await supabase.from("exit_reason_types").delete().eq("id", id);
      if (error) {
        toast("Delete Failed", "Failed to delete reason type", "error");
      } else {
        toast("Reason Type Deleted", "Reason type removed successfully", "success");
        loadData();
      }
    },
    [loadData]
  );

  return { saving, saveReasonType, toggleReasonTypeStatus, deleteReasonType };
}
