import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { useTrainingData } from "./useTrainingData";
import { useTrainingFilters } from "./useTrainingFilters";
import { useTrainingMutations } from "./useTrainingMutations";

export function useTraining() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin } = usePermissions();
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId } = useBranchScope();
  const roleName = (role?.name || "").toLowerCase();
  const canManage =
    isSuperAdmin ||
    isBranchAdmin ||
    isAdmin ||
    /manager|lead|head|admin|ceo|director|chief|president|officer/i.test(roleName);

  const data = useTrainingData();
  const filters = useTrainingFilters({
    courses: data.courses,
    enrollments: data.enrollments,
  });
  const mutations = useTrainingMutations({
    actorName,
    canManage: canManage && !data.isPartnerBranchBlocked,
    isSuperAdmin,
    effectiveBranchId,
    userBranchId,
    branches: data.branches,
    courses: data.courses,
    employees: data.employees,
    enrollments: data.enrollments,
    fetchData: data.fetchData,
  });

  return {
    canManage: canManage && !data.isPartnerBranchBlocked,
    isSuperAdmin,
    isBranchAdmin,
    effectiveBranchId,
    userBranchId,
    ...data,
    ...filters,
    ...mutations,
  };
}
