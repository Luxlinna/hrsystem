import { useState, useEffect } from "react";
import { useLeaveData } from "./useLeaveData";
import { useLeaveBalances } from "./useLeaveBalances";
import { useLeaveFilters } from "./useLeaveFilters";
import { useLeaveMutations } from "./useLeaveMutations";
import { useLeaveCalendar } from "./useLeaveCalendar";

export function useLeave() {
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // 1. Data hook
  const data = useLeaveData();
  const actorName =
    (data.user?.user_metadata?.display_name as string) || data.user?.email || "Unknown";
  const actorRole = data.role?.name || "Unknown";

  // 2. Balances hook
  const balances = useLeaveBalances({
    requests: data.requests,
    calendarRequests: data.calendarRequests,
    employees: data.employees,
    myEmployee: data.myEmployee,
    leaveTypePolicies: data.leaveTypePolicies,
  });

  // 3. Filters hook
  const filters = useLeaveFilters(data.requests, data.employees);

  // 4. Mutations hook
  const mutations = useLeaveMutations({
    requests: data.requests,
    employees: data.employees,
    myEmployee: data.myEmployee,
    actorName,
    actorRole,
    getRemaining: balances.getRemaining,
    loadData: data.loadData,
    setToast,
  });

  // 5. Calendar hook
  const calendar = useLeaveCalendar({
    calendarRequests: data.calendarRequests,
  });

  return {
    actorName,
    actorRole,
    toast,
    setToast,
    ...data,
    ...balances,
    ...filters,
    ...mutations,
    ...calendar,
  };
}
