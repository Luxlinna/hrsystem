import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { Branch, BranchFormState } from "../types";

interface UseBranchMutationsProps {
  canCreateBranch: boolean;
  isBranchAdmin: boolean;
  userBranchId: string | null | undefined;
  actorName: string;
  roleName: string;
  editingBranchId: string | null;
  loadBranches: () => Promise<void>;
  setShowAddModal: (open: boolean) => void;
  setEditingBranchId: (id: string | null) => void;
  selectedBranch: Branch | null;
  setSelectedBranch: React.Dispatch<React.SetStateAction<Branch | null>>;
}

export function useBranchMutations({
  canCreateBranch,
  isBranchAdmin,
  userBranchId,
  actorName,
  roleName,
  editingBranchId,
  loadBranches,
  setShowAddModal,
  setEditingBranchId,
  selectedBranch,
  setSelectedBranch,
}: UseBranchMutationsProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleAddBranch = useCallback(
    async (form: BranchFormState) => {
      if (!form.name || !form.location || !form.manager_name) return;
      if (!editingBranchId && !canCreateBranch) {
        toast("Access Denied", "Only Super Admin can create new BUs.", "error");
        return;
      }
      if (editingBranchId && isBranchAdmin && userBranchId && editingBranchId !== userBranchId) {
        toast("Access Denied", "You can only manage your own BU.", "error");
        return;
      }
      setSubmitting(true);
      const latitude = form.latitude.trim() ? Number(form.latitude) : null;
      const longitude = form.longitude.trim() ? Number(form.longitude) : null;
      if (
        (latitude != null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
        (longitude != null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))
      ) {
        setSubmitting(false);
        toast("Error", "Enter valid latitude and longitude values before saving.", "error");
        return;
      }
      const geofence_radius_m = form.geofence_radius_m.trim() ? Number(form.geofence_radius_m) : 100;
      const work_start_time = form.work_start_time.trim() || null;
      const work_end_time = form.work_end_time.trim() || null;
      const late_grace_minutes = form.late_grace_minutes.trim() ? Math.max(0, parseInt(form.late_grace_minutes, 10) || 0) : 15;
      const early_leave_grace_minutes = form.early_leave_grace_minutes.trim() ? Math.max(0, parseInt(form.early_leave_grace_minutes, 10) || 0) : 15;
      const morning_check_in_start = form.morning_check_in_start?.trim() ? form.morning_check_in_start.trim() + ":00" : "06:00:00";
      const morning_check_in_end = form.morning_check_in_end?.trim() ? form.morning_check_in_end.trim() + ":00" : "09:00:00";
      const morning_check_out_start = form.morning_check_out_start?.trim() ? form.morning_check_out_start.trim() + ":00" : "10:00:00";
      const morning_check_out_end = form.morning_check_out_end?.trim() ? form.morning_check_out_end.trim() + ":00" : "12:00:00";
      const afternoon_check_in_start = form.afternoon_check_in_start?.trim() ? form.afternoon_check_in_start.trim() + ":00" : "12:00:00";
      const afternoon_check_in_end = form.afternoon_check_in_end?.trim() ? form.afternoon_check_in_end.trim() + ":00" : "14:00:00";
      const afternoon_check_out_start = form.afternoon_check_out_start?.trim() ? form.afternoon_check_out_start.trim() + ":00" : "16:00:00";
      const afternoon_check_out_end = form.afternoon_check_out_end?.trim() ? form.afternoon_check_out_end.trim() + ":00" : "18:00:00";
      let entityId: string | null = editingBranchId;

      if (editingBranchId) {
        const { error } = await supabase
          .from("branches")
          .update({
            name: form.name,
            location: form.location,
            manager_name: form.manager_name,
            status: form.status,
            latitude,
            longitude,
            geofence_radius_m,
            work_start_time,
            work_end_time,
            late_grace_minutes,
            early_leave_grace_minutes,
            morning_check_in_start,
            morning_check_in_end,
            morning_check_out_start,
            morning_check_out_end,
            afternoon_check_in_start,
            afternoon_check_in_end,
            afternoon_check_out_start,
            afternoon_check_out_end,
          })
          .eq("id", editingBranchId);
        if (error) {
          toast("Error", error.message || "Failed to update BU", "error");
          setSubmitting(false);
          return;
        }
      } else {
        const { data, error } = await supabase
          .from("branches")
          .insert({
            name: form.name,
            location: form.location,
            manager_name: form.manager_name,
            status: form.status,
            latitude,
            longitude,
            geofence_radius_m,
            work_start_time,
            work_end_time,
            late_grace_minutes,
            early_leave_grace_minutes,
            morning_check_in_start,
            morning_check_in_end,
            morning_check_out_start,
            morning_check_out_end,
            afternoon_check_in_start,
            afternoon_check_in_end,
            afternoon_check_out_start,
            afternoon_check_out_end,
          })
          .select("id")
          .single();
        if (error) {
          toast("Error", error.message || "Failed to create BU", "error");
          setSubmitting(false);
          return;
        }
        entityId = data?.id || null;
      }

      await logActivity({
        module: "branches",
        action: editingBranchId ? "updated" : "created",
        entityType: "branch",
        entityId: entityId || undefined,
        actorName,
        actorRole: roleName,
        description: `${editingBranchId ? "Updated" : "Created"} BU "${form.name}" in ${form.location}`,
      });

      setSubmitting(false);
      setShowAddModal(false);
      setEditingBranchId(null);
      await loadBranches();
      toast("Success", editingBranchId ? "BU updated successfully" : "BU created successfully", "success");
    },
    [canCreateBranch, editingBranchId, isBranchAdmin, userBranchId, actorName, roleName, loadBranches, setShowAddModal, setEditingBranchId]
  );

  const toggleBranchStatus = useCallback(
    async (branch: Branch) => {
      const nextStatus = branch.status === "active" ? "inactive" : "active";
      const { error } = await supabase.from("branches").update({ status: nextStatus }).eq("id", branch.id);
      if (error) {
        toast("Error", error.message || "Failed to update BU status", "error");
        return;
      }
      await logActivity({
        module: "branches",
        action: "updated",
        entityType: "branch",
        entityId: branch.id,
        actorName,
        actorRole: roleName,
        description: `Changed BU "${branch.name}" status from ${branch.status} to ${nextStatus}`,
      });
      if (selectedBranch?.id === branch.id) {
        setSelectedBranch({ ...selectedBranch, status: nextStatus });
      }
      await loadBranches();
      toast("Status updated", `BU "${branch.name}" is now ${nextStatus}`, "success");
    },
    [actorName, roleName, selectedBranch, setSelectedBranch, loadBranches]
  );

  const handleDeleteBranch = useCallback(
    async (branch: Branch) => {
      if (!confirm(`Are you sure you want to move BU "${branch.name}" to Recycle Bin?`)) return;
      const { error } = await supabase
        .from("branches")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", branch.id);
      if (error) {
        toast("Error", error.message || "Failed to delete BU", "error");
        return;
      }
      await logActivity({
        module: "branches",
        action: "deleted",
        entityType: "branch",
        entityId: branch.id,
        actorName,
        actorRole: roleName,
        description: `Moved branch "${branch.name}" to Recycle Bin`,
      });
      setSelectedBranch(null);
      await loadBranches();
      toast("Success", `Branch "${branch.name}" moved to Recycle Bin`, "success");
    },
    [actorName, roleName, setSelectedBranch, loadBranches]
  );

  return {
    submitting,
    handleAddBranch,
    toggleBranchStatus,
    handleDeleteBranch,
  };
}
