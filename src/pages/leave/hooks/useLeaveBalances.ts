import { useMemo, useCallback } from "react";
import type { LeaveRequest, Employee, LeaveTypePolicy, LeaveStats } from "../types";
import { toYMD } from "../dateUtils";

interface UseLeaveBalancesProps {
  requests: LeaveRequest[];
  calendarRequests: LeaveRequest[];
  employees: Employee[];
  myEmployee: Employee | null;
  leaveTypePolicies: LeaveTypePolicy[];
}

export function useLeaveBalances({
  requests,
  calendarRequests,
  employees,
  myEmployee,
  leaveTypePolicies,
}: UseLeaveBalancesProps) {
  const currentYear = new Date().getFullYear();

  const getEntitlement = useCallback(
    (employeeId: string, type: string): number | null => {
      if (type === "annual") {
        const emp =
          employees.find((e) => e.id === employeeId) ||
          (myEmployee?.id === employeeId ? myEmployee : null);
        return emp?.annual_leave_days ?? 18;
      }
      const policy = leaveTypePolicies.find((p) => p.type === type);
      return policy ? policy.default_days : null;
    },
    [employees, myEmployee, leaveTypePolicies]
  );

  const getUsedDays = useCallback(
    (employeeId: string, type: string): number => {
      return requests
        .filter(
          (r) =>
            r.employee_id === employeeId &&
            r.leave_type === type &&
            r.status === "approved" &&
            new Date(r.start_date).getFullYear() === currentYear
        )
        .reduce((sum, r) => sum + (r.days || 0), 0);
    },
    [requests, currentYear]
  );

  const getPendingDays = useCallback(
    (employeeId: string, type: string): number => {
      return requests
        .filter(
          (r) =>
            r.employee_id === employeeId &&
            r.leave_type === type &&
            r.status === "pending" &&
            new Date(r.start_date).getFullYear() === currentYear
        )
        .reduce((sum, r) => sum + (r.days || 0), 0);
    },
    [requests, currentYear]
  );

  const getRemaining = useCallback(
    (employeeId: string, type: string): number | null => {
      const entitlement = getEntitlement(employeeId, type);
      if (entitlement === null) return null;
      const used = getUsedDays(employeeId, type);
      const pending = getPendingDays(employeeId, type);
      return Math.max(0, entitlement - used - pending);
    },
    [getEntitlement, getUsedDays, getPendingDays]
  );

  const stats: LeaveStats = useMemo(() => {
    const targetEmpId = myEmployee?.id || "";
    const myAnnualUsed = targetEmpId ? getUsedDays(targetEmpId, "annual") : 0;
    const myAnnualPending = targetEmpId ? getPendingDays(targetEmpId, "annual") : 0;
    const myAnnualEntitlement = myEmployee?.annual_leave_days ?? 18;
    const myAnnualRemaining = targetEmpId
      ? getRemaining(targetEmpId, "annual") ?? myAnnualEntitlement
      : myAnnualEntitlement;

    const todayStr = toYMD(new Date());
    const currentlyOnLeaveCount = calendarRequests.filter(
      (r) => todayStr >= r.start_date && todayStr <= r.end_date
    ).length;

    return {
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
      totalApprovedDays: requests
        .filter((r) => r.status === "approved")
        .reduce((sum, r) => sum + (r.days || 0), 0),
      onLeaveToday: currentlyOnLeaveCount,
      myAnnualRemaining,
      myAnnualEntitlement,
      myAnnualUsed,
      myAnnualPending,
    };
  }, [myEmployee, requests, calendarRequests, getUsedDays, getPendingDays, getRemaining]);

  return {
    getEntitlement,
    getUsedDays,
    getPendingDays,
    getRemaining,
    stats,
  };
}
