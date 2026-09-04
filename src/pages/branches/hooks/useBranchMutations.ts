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
        toast("Access Denied", "Only Super Admin can create new branches.", "error");
        return;
      }
      if (editingBranchId && isBranchAdmin && userBranchId && editingBranchId !== userBranchId) {
        toast("Access Denied", "You can only manage your own branch.", "error");
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
          })
          .eq("id", editingBranchId);
        if (error) {
          toast("Error", error.message || "Failed to update branch", "error");
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
          })
          .select("id")
          .single();
        if (error) {
          toast("Error", error.message || "Failed to create branch", "error");
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
        description: `${editingBranchId ? "Updated" : "Created"} branch "${form.name}" in ${form.location}`,
      });

      setSubmitting(false);
      setShowAddModal(false);
      setEditingBranchId(null);
      await loadBranches();
      toast("Success", editingBranchId ? "Branch updated successfully" : "Branch created successfully", "success");
    },
    [canCreateBranch, editingBranchId, isBranchAdmin, userBranchId, actorName, roleName, loadBranches, setShowAddModal, setEditingBranchId]
  );

  const toggleBranchStatus = useCallback(
    async (branch: Branch) => {
      const nextStatus = branch.status === "active" ? "inactive" : "active";
      const { error } = await supabase.from("branches").update({ status: nextStatus }).eq("id", branch.id);
      if (error) {
        toast("Error", error.message || "Failed to update branch status", "error");
        return;
      }
      await logActivity({
        module: "branches",
        action: "updated",
        entityType: "branch",
        entityId: branch.id,
        actorName,
        actorRole: roleName,
        description: `Changed branch "${branch.name}" status from ${branch.status} to ${nextStatus}`,
      });
      if (selectedBranch?.id === branch.id) {
        setSelectedBranch({ ...selectedBranch, status: nextStatus });
      }
      await loadBranches();
      toast("Status updated", `Branch "${branch.name}" is now ${nextStatus}`, "success");
    },
    [actorName, roleName, selectedBranch, setSelectedBranch, loadBranches]
  );

  const handleDeleteBranch = useCallback(
    async (branch: Branch) => {
      if (!confirm(`Are you sure you want to move branch "${branch.name}" to Recycle Bin?`)) return;
      const { error } = await supabase
        .from("branches")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", branch.id);
      if (error) {
        toast("Error", error.message || "Failed to delete branch", "error");
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
