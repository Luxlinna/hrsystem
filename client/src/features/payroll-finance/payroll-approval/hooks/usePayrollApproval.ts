import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { usePayrollApprovalData } from "./usePayrollApprovalData";
import { usePayrollApprovalCalculations } from "./usePayrollApprovalCalculations";
import { usePayrollApprovalFilters } from "./usePayrollApprovalFilters";
import { usePayrollApprovalMutations } from "./usePayrollApprovalMutations";

export function usePayrollApproval() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const canManage = isAdmin || (Boolean(role) && role.name !== "Chairman");
  const submitterName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  // 1. Calculations hook (with empty arrays initially for state bootstrap)
  const tempCalc = usePayrollApprovalCalculations([], []);

  // 2. Filters hook
  const filters = usePayrollApprovalFilters(
    tempCalc.pendingRuns,
    tempCalc.approvedRuns,
    tempCalc.historyRuns,
    []
  );

  // 3. Data hook
  const data = usePayrollApprovalData(
    filters.setTab,
    filters.setPeriodFilter,
    filters.setExpandedRun
  );

  // Recompute with real loaded data
  const calculations = usePayrollApprovalCalculations(
    data.runs,
    data.itemizedRecords
  );

  const dynamicFilters = usePayrollApprovalFilters(
    calculations.pendingRuns,
    calculations.approvedRuns,
    calculations.historyRuns,
    data.itemizedRecords
  );

  // 4. Mutations hook
  const mutations = usePayrollApprovalMutations({
    canManage,
    submitterName,
    roleName: role?.name,
    targetBranch: data.targetBranch,
    getRunApprovals: data.getRunApprovals,
    loadData: data.loadData,
    setTab: dynamicFilters.setTab,
  });

  return {
    canManage,
    submitterName,
    ...data,
    ...calculations,
    ...dynamicFilters,
    ...mutations,
  };
}
