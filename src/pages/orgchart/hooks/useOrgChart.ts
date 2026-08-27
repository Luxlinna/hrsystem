import { useOrgChartData } from "./useOrgChartData";
import { useOrgChartTree } from "./useOrgChartTree";
import { useOrgChartFilters } from "./useOrgChartFilters";
import { useOrgChartMutations } from "./useOrgChartMutations";

export function useOrgChart() {
  // 1. Filters hook
  const filters = useOrgChartFilters([]);

  // 2. Tree hook with filter values
  const treeHook = useOrgChartTree([], filters.deptFilter, filters.searchTerm);

  // 3. Data hook
  const data = useOrgChartData(treeHook.setExpandedIds);

  // Dynamic tree & filters with real employees list
  const dynamicTree = useOrgChartTree(
    data.employees,
    filters.deptFilter,
    filters.searchTerm
  );

  const dynamicFilters = useOrgChartFilters(data.employees);

  // 4. Mutations hook
  const mutations = useOrgChartMutations({
    canEditManager: data.canEditManager,
    loadEmployees: data.loadEmployees,
  });

  return {
    ...data,
    ...dynamicTree,
    ...dynamicFilters,
    ...mutations,
  };
}
