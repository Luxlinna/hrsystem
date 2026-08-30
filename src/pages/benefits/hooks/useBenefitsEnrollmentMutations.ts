import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { BenefitPlan, Enrollment } from "../types";

interface UseBenefitsEnrollmentMutationsProps {
  canManage: boolean;
  saving: boolean;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  plans: BenefitPlan[];
  actorName: string;
  actorRole: string;
  loadData: () => Promise<void>;
  setEnrollModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useBenefitsEnrollmentMutations({
  canManage,
  saving,
  setSaving,
  plans,
  actorName,
  actorRole,
  loadData,
  setEnrollModal,
}: UseBenefitsEnrollmentMutationsProps) {
  const toggleEnrollmentStatus = useCallback(async (enr: Enrollment) => {
    if (!canManage) return;
    const nextStatus = enr.status === "enrolled" ? "opted_out" : "enrolled";
    const { error } = await supabase.from("benefit_enrollments").update({ status: nextStatus }).eq("id", enr.id);

    if (error) {
      toast("Error", error.message || "Failed to update enrollment status", "error");
      return;
    }

    toast(
      nextStatus === "enrolled" ? "Enrolled" : "Opted Out",
      `${enr.employees?.first_name || "Employee"} is now ${nextStatus.replace("_", " ")}.`,
      "success"
    );
    logActivity({
      module: "benefits",
      action: "updated",
      entityType: "benefit_enrollment",
      entityId: enr.id,
      actorName,
      actorRole,
      description: `Changed enrollment of ${enr.employees?.first_name} to ${nextStatus}`,
    });
    loadData();
  }, [canManage, actorName, actorRole, loadData]);

  const handleBatchEnroll = useCallback(async (planId: string, employeeIds: string[]) => {
    if (!canManage || !planId || employeeIds.length === 0 || saving) return false;
    setSaving(true);

    const rows = employeeIds.map((empId) => ({
      plan_id: planId,
      employee_id: empId,
      status: "enrolled",
      enrolled_date: new Date().toISOString().slice(0, 10),
    }));

    const { error } = await supabase.from("benefit_enrollments").upsert(rows, { onConflict: "plan_id,employee_id" });
    setSaving(false);

    if (error) {
      toast("Error", error.message || "Failed to enroll employees", "error");
      return false;
    }

    const selectedPlanName = plans.find((p) => p.id === planId)?.name || "Plan";
    toast("Enrolled Successfully", `${employeeIds.length} employees enrolled into ${selectedPlanName}.`, "success");
    logActivity({
      module: "benefits",
      action: "created",
      entityType: "benefit_enrollment",
      actorName,
      actorRole,
      description: `Enrolled ${employeeIds.length} employees into ${selectedPlanName}`,
    });

    setEnrollModal(false);
    loadData();
    return true;
  }, [canManage, saving, setSaving, plans, actorName, actorRole, setEnrollModal, loadData]);

  return { toggleEnrollmentStatus, handleBatchEnroll };
}
