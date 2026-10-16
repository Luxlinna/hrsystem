import { useMemo, useCallback } from "react";
import type { LeaveRequest, Employee, LeaveTypePolicy, LeaveStats } from "../types";
import { toYMD } from "../dateUtils";
import { isContractAllowedAL, calculateJoinMonthProrateAL } from "../utils/annualLeaveProrateUtils";

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

        // If employee is on Probation/Internship, AL is locked per policy
        if (emp?.contract_type && !isContractAllowedAL(emp.contract_type)) {
          return 0;
        }

        // If employee joined in current year, calculate prorated annual leave
        const dateStr = emp?.start_date || emp?.join_date;
        if (dateStr) {
          const joinDate = new Date(dateStr);
          if (!isNaN(joinDate.getTime()) && joinDate.getFullYear() === currentYear) {
            const startMonthProrate = calculateJoinMonthProrateAL(joinDate);
            const remainingMonths = 12 - (joinDate.getMonth() + 1);
            return Math.min(18, Math.round((startMonthProrate + remainingMonths * 1.5) * 10) / 10);
          }
        }

        return emp?.annual_leave_days ?? 18;
      }
      if (type === "maternity") {
        return 90;
      }
      if (type === "sick") {
        const policy = leaveTypePolicies.find((p) => p.type === "sick");
        return policy ? policy.default_days : 30;
      }
      if (type === "special") {
        const policy = leaveTypePolicies.find((p) => p.type === "special");
        return policy ? policy.default_days : 7;
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

  const getLeaveTypeStats = useCallback(
    (employeeId: string, type: string) => {
      const entitlement = getEntitlement(employeeId, type) ?? 0;
      const used = getUsedDays(employeeId, type);
      const pending = getPendingDays(employeeId, type);
      const available = Math.max(0, entitlement - used - pending);
      return {
        balance: entitlement,
        used,
        available,
        pending,
      };
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
    getLeaveTypeStats,
    stats,
  };
}
