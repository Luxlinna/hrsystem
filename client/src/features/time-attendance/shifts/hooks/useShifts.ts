import { useAuth } from "@/context/AuthContext";
import { useShiftData } from "./useShiftData";
import { useShiftNavigation } from "./useShiftNavigation";
import { useShiftCalculations } from "./useShiftCalculations";
import { useShiftMutations } from "./useShiftMutations";

export function useShifts() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  const data = useShiftData();

  const nav = useShiftNavigation({
    onOpenCreate: () => mutations.openCreateModal(),
  });

  const calcs = useShiftCalculations({
    shifts: data.shifts,
    assignments: data.assignments,
    employees: data.employees,
    currentDate: nav.currentDate,
    selectedShift: null, // Initial pass; actual selection will be controlled by mutations
    filterBranch: nav.filterBranch,
    filterDept: nav.filterDept,
    quickFilter: nav.quickFilter,
    searchQuery: nav.searchQuery,
  });

  const mutations = useShiftMutations({
    actorName,
    isSuperAdmin: data.isSuperAdmin,
    userBranchId: data.userBranchId,
    effectiveBranchId: data.effectiveBranchId,
    defaultBranchId: data.branches[0]?.id || "",
    defaultDepartment: data.departments[0] || "Operations",
    currentDate: nav.currentDate,
    weekShifts: calcs.weekShifts,
    filteredShifts: calcs.filteredShifts,
    assignments: data.assignments,
    loadData: data.loadData,
    navigateNext: nav.navigateNext,
  });

  // Re-calculate selected shift values with live selectedShift from mutations
  const selectedCalcs = useShiftCalculations({
    shifts: data.shifts,
    assignments: data.assignments,
    employees: data.employees,
    currentDate: nav.currentDate,
    selectedShift: mutations.selectedShift,
    filterBranch: nav.filterBranch,
    filterDept: nav.filterDept,
    quickFilter: nav.quickFilter,
    searchQuery: nav.searchQuery,
  });

  return {
    ...data,
    ...nav,
    ...calcs,
    ...mutations,
    selectedShiftAssignments: selectedCalcs.selectedShiftAssignments,
    remainingSpots: selectedCalcs.remainingSpots,
    isSelectedShiftFull: selectedCalcs.isSelectedShiftFull,
  };
}
