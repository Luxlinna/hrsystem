import { useTheme } from "@/context/ThemeContext";
import { usePayrollData } from "./usePayrollData";
import { usePayrollCalculations } from "./usePayrollCalculations";
import { usePayrollFilters } from "./usePayrollFilters";
import { usePayrollMutations } from "./usePayrollMutations";

export function usePayroll() {
  const { isDark } = useTheme();
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
    loadData: data.loadData,
    setAllRecords: data.setAllRecords,
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
