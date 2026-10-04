import { useState, useEffect } from "react";
import { useLeaveCalendarData } from "./useLeaveCalendarData";
import { useLeaveCalendarFilters } from "./useLeaveCalendarFilters";
import { useLeaveCalendarDateNav } from "./useLeaveCalendarDateNav";
import { useLeaveCalendarStats } from "./useLeaveCalendarStats";
import { useLeaveCalendarMutations } from "./useLeaveCalendarMutations";

export function useLeaveCalendar() {
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // 1. Data hook
  const data = useLeaveCalendarData();

  // 2. Filters hook
  const filters = useLeaveCalendarFilters(data.leaves, data.employees);

  // 3. Date nav hook
  const dateNav = useLeaveCalendarDateNav({
    filteredLeaves: filters.filteredLeaves,
  });

  // 4. Stats hook
  const stats = useLeaveCalendarStats({
    leaves: data.leaves,
    filteredLeaves: filters.filteredLeaves,
    employees: data.employees,
    departments: filters.departments,
    year: dateNav.year,
    month: dateNav.month,
    daysInMonth: dateNav.daysInMonth,
    getDayLeaves: dateNav.getDayLeaves,
  });

  // 5. Mutations hook
  const mutations = useLeaveCalendarMutations({
    myEmployee: data.myEmployee,
    loadData: data.loadData,
    setToast,
  });

  return {
    toast,
    setToast,
    ...data,
    ...filters,
    ...dateNav,
    ...stats,
    ...mutations,
  };
}
