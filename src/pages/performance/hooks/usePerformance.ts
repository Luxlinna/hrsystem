import { usePerformanceData } from "./usePerformanceData";
import { usePerformanceCalculations } from "./usePerformanceCalculations";
import { usePerformanceFilters } from "./usePerformanceFilters";
import { usePerformanceMutations } from "./usePerformanceMutations";

export function usePerformance() {
  // 1. Filters hook
  const filters = usePerformanceFilters();

  // 2. Data hook
  const data = usePerformanceData();

  // 3. Calculations hook
  const calculations = usePerformanceCalculations(
    data.reviews,
    data.employees,
    filters.filterQ,
    filters.filterStatus,
    filters.filterDept
  );

  // 4. Mutations hook
  const mutations = usePerformanceMutations({
    loadData: data.loadData,
    setActiveTab: filters.setActiveTab,
    setGoals: data.setGoals,
  });

  return {
    ...data,
    ...filters,
    ...calculations,
    ...mutations,
  };
}
