import { useOrgChartData } from "./useOrgChartData";
import { useOrgChartTree } from "./useOrgChartTree";
import { useOrgChartFilters } from "./useOrgChartFilters";
import { useOrgChartMutations } from "./useOrgChartMutations";

export function useOrgChart() {
  // 1. Data hook
  const data = useOrgChartData();

  // 2. Filters hook with real employees
  const filters = useOrgChartFilters(data.employees);

  // 3. Tree hook with real employees and active filter values
  const tree = useOrgChartTree(
    data.employees,
    filters.deptFilter,
    filters.searchTerm
  );

  // 4. Mutations hook
  const mutations = useOrgChartMutations({
    canEditManager: data.canEditManager,
    loadEmployees: data.loadEmployees,
  });

  return {
    ...data,
    ...tree,
    ...filters,
    ...mutations,
  };
}
