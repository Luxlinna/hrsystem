import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import type { BenefitPlan } from "../types";
import { useBenefitsEnrollmentMutations } from "./useBenefitsEnrollmentMutations";
import { useBenefitsPlanMutations } from "./useBenefitsPlanMutations";

interface UseBenefitsMutationsProps {
  canManage: boolean;
  loadData: () => Promise<void>;
  setSelectedPlan: React.Dispatch<React.SetStateAction<BenefitPlan | null>>;
  setEditingPlan: React.Dispatch<React.SetStateAction<BenefitPlan | null>>;
  setPlanModal: React.Dispatch<React.SetStateAction<boolean>>;
  setEnrollModal: React.Dispatch<React.SetStateAction<boolean>>;
  plans: BenefitPlan[];
}

export function useBenefitsMutations({
  canManage,
  loadData,
  setSelectedPlan,
  setEditingPlan,
  setPlanModal,
  setEnrollModal,
  plans,
}: UseBenefitsMutationsProps) {
  const { user } = useAuth();
  const { role } = usePermissions();
  const { isSuperAdmin, targetBranch, userBranchId } = useBranchScope();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const actorRole = role?.name || "Staff";

  const [saving, setSaving] = useState(false);

  const enrollmentMutations = useBenefitsEnrollmentMutations({
    canManage,
    saving,
    setSaving,
    plans,
    actorName,
    actorRole,
    loadData,
    setEnrollModal,
  });

  const planMutations = useBenefitsPlanMutations({
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
  });

  return {
    saving,
    ...enrollmentMutations,
    ...planMutations,
  };
}
