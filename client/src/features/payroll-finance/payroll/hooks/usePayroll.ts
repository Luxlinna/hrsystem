import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { usePayrollData } from "./usePayrollData";
import { usePayrollCalculations } from "./usePayrollCalculations";
import { usePayrollFilters } from "./usePayrollFilters";
import { usePayrollMutations } from "./usePayrollMutations";

export function usePayroll() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  // 1. Filters hook
  const filters = usePayrollFilters([], currentMonthStr);

  // 2. Data hook
  const data = usePayrollData(currentMonthStr, filters.setSelectedMonth);

  // Dynamic filters with real data
  const dynamicFilters = usePayrollFilters(data.allRecords, currentMonthStr);

  // 3. Calculations hook
  const calculations = usePayrollCalculations(
    data.allRecords,
    data.employees,
    dynamicFilters.filteredRecords,
    currentMonthStr,
    isDark
  );

  // 4. Mutations hook
  const mutations = usePayrollMutations({
    employees: data.employees,
    selectedMonth: dynamicFilters.selectedMonth,
    targetBranch: data.targetBranch,
    actorName,
    loadData: data.loadData,
    setAllRecords: data.setAllRecords,
    setBranchPolicy: data.setBranchPolicy,
  });

  return {
    isDark,
    currentMonthStr,
    ...data,
    ...dynamicFilters,
    ...calculations,
    ...mutations,
  };
}
