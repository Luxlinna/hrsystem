import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { ExitTypeSetting, SettingFormData } from "./types";

export function useExitTypesMutations(
  exitTypes: ExitTypeSetting[],
  loadData: () => Promise<void>
) {
  const [saving, setSaving] = useState(false);

  const saveExitType = useCallback(
    async (id: string | null, form: SettingFormData) => {
      setSaving(true);
      try {
        if (id) {
          const { error } = await supabase
            .from("exit_types")
            .update({
              name: form.name.trim(),
              status: form.status,
              display_order: Number(form.display_order) || 0,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);
          if (error) throw error;
          toast("Exit Type Updated", "Exit type updated successfully", "success");
        } else {
          const { error } = await supabase.from("exit_types").insert([
            {
              name: form.name.trim(),
              status: form.status,
              display_order: Number(form.display_order) || exitTypes.length + 1,
            },
          ]);
          if (error) throw error;
          toast("Exit Type Added", "New exit type created successfully", "success");
        }
        await loadData();
        return true;
      } catch (err: any) {
        console.error("Failed to save exit type:", err);
        toast("Save Failed", err.message || "Failed to save exit type", "error");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [exitTypes.length, loadData]
  );

  const toggleExitTypeStatus = useCallback(
    async (item: ExitTypeSetting) => {
      const nextStatus = item.status === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("exit_types")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", item.id);
      if (error) {
        toast("Update Failed", "Failed to update status", "error");
      } else {
        toast("Status Updated", `Exit type marked ${nextStatus}`, "success");
        loadData();
      }
    },
    [loadData]
  );

  const deleteExitType = useCallback(
    async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this exit type?")) return;
      const { error } = await supabase.from("exit_types").delete().eq("id", id);
      if (error) {
        toast("Delete Failed", "Failed to delete exit type", "error");
      } else {
        toast("Exit Type Deleted", "Exit type removed successfully", "success");
        loadData();
      }
    },
    [loadData]
  );

  return { saving, saveExitType, toggleExitTypeStatus, deleteExitType };
}
