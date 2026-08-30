import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { BenefitPlan, PlanFormState } from "../types";

interface UseBenefitsPlanMutationsProps {
  canManage: boolean;
  saving: boolean;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  isSuperAdmin: boolean;
  targetBranch: string | null;
  userBranchId: string | null;
  actorName: string;
  actorRole: string;
  loadData: () => Promise<void>;
  setSelectedPlan: React.Dispatch<React.SetStateAction<BenefitPlan | null>>;
  setEditingPlan: React.Dispatch<React.SetStateAction<BenefitPlan | null>>;
  setPlanModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useBenefitsPlanMutations({
  canManage,
  saving,
  setSaving,
  isSuperAdmin,
  targetBranch,
  userBranchId,
  actorName,
  actorRole,
  loadData,
  setSelectedPlan,
  setEditingPlan,
  setPlanModal,
}: UseBenefitsPlanMutationsProps) {
  const handleCreatePlan = useCallback(async (form: PlanFormState) => {
    if (!canManage || !form.name.trim() || saving) return false;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      provider: form.provider.trim(),
      type: form.type,
      coverage_amount: Number(form.coverage_amount) || 0,
      employee_contribution: Number(form.employee_contribution) || 0,
      eligible_count: Number(form.eligible_count) || 0,
      status: form.status,
      description: form.description.trim(),
      branch_id: isSuperAdmin ? null : (userBranchId || targetBranch),
    };

    const { error } = await supabase.from("benefit_plans").insert(payload);
    setSaving(false);

    if (error) {
      toast("Error", error.message || "Failed to create benefit plan", "error");
      return false;
    }

    toast("Plan Created", `"${form.name}" has been published.`, "success");
    logActivity({
      module: "benefits",
      action: "created",
      entityType: "benefit_plan",
      actorName,
      actorRole,
      description: `Created benefit plan "${form.name}"`,
    });

    setPlanModal(false);
    loadData();
    return true;
  }, [canManage, saving, setSaving, isSuperAdmin, userBranchId, targetBranch, actorName, actorRole, setPlanModal, loadData]);

  const handleSavePlanEdit = useCallback(async (form: PlanFormState, editingPlan: BenefitPlan) => {
    if (!canManage || !editingPlan || !form.name.trim() || saving) return false;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      provider: form.provider.trim(),
      type: form.type,
      coverage_amount: Number(form.coverage_amount) || 0,
      employee_contribution: Number(form.employee_contribution) || 0,
      eligible_count: Number(form.eligible_count) || 0,
      status: form.status,
      description: form.description.trim(),
    };

    const { error } = await supabase.from("benefit_plans").update(payload).eq("id", editingPlan.id);
    setSaving(false);

    if (error) {
      toast("Error", error.message || "Failed to update benefit plan", "error");
      return false;
    }

    toast("Plan Updated", `"${form.name}" was updated successfully.`, "success");
    logActivity({
      module: "benefits",
      action: "updated",
      entityType: "benefit_plan",
      entityId: editingPlan.id,
      actorName,
      actorRole,
      description: `Updated benefit plan "${form.name}"`,
    });

    setEditingPlan(null);
    setSelectedPlan((prev) => (prev?.id === editingPlan.id ? { ...prev, ...payload } : prev));
    loadData();
    return true;
  }, [canManage, saving, setSaving, actorName, actorRole, setEditingPlan, setSelectedPlan, loadData]);

  const handleDeletePlan = useCallback(async (p: BenefitPlan) => {
    if (!canManage) return;
    if (!confirm(`Delete benefit plan "${p.name}"? Active enrollments will be affected.`)) return;

    const { error } = await supabase.from("benefit_plans").delete().eq("id", p.id);
    if (error) {
      toast("Error", error.message || "Failed to delete plan", "error");
      return;
    }

    toast("Plan Deleted", `"${p.name}" was removed.`, "success");
    logActivity({
      module: "benefits",
      action: "deleted",
      entityType: "benefit_plan",
      entityId: p.id,
      actorName,
      actorRole,
      description: `Deleted benefit plan "${p.name}"`,
    });

    setSelectedPlan((prev) => (prev?.id === p.id ? null : prev));
    setEditingPlan(null);
    loadData();
  }, [canManage, actorName, actorRole, setSelectedPlan, setEditingPlan, loadData]);

  return { handleCreatePlan, handleSavePlanEdit, handleDeletePlan };
}
