import { useMemo, useCallback } from "react";
import type { LeaveRequest, Employee, LeaveTypePolicy, LeaveStats, LeaveTypeBalanceStats } from "../types";
import { toYMD } from "../dateUtils";
import { isContractAllowedAL, calculateJoinMonthProrateAL } from "../utils/annualLeaveProrateUtils";
import { getLeaveTypeSlug } from "../services/leaveSettingsService";

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
      const slug = getLeaveTypeSlug(type);

      if (slug === "annual") {
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

      if (slug === "maternity") {
        return 90;
      }

      if (slug === "sick") {
        const policy = leaveTypePolicies.find((p) => getLeaveTypeSlug(p.type) === "sick");
        return policy ? policy.default_days : 30;
      }

      if (slug === "special") {
        const policy = leaveTypePolicies.find((p) => getLeaveTypeSlug(p.type) === "special");
        return policy ? policy.default_days : 7;
      }

      if (slug === "paternity") {
        const policy = leaveTypePolicies.find((p) => getLeaveTypeSlug(p.type) === "paternity");
        return policy ? policy.default_days : 3;
      }

      if (slug === "bereavement") {
        const policy = leaveTypePolicies.find((p) => getLeaveTypeSlug(p.type) === "bereavement");
        return policy ? policy.default_days : 3;
      }

      if (slug === "study") {
        const policy = leaveTypePolicies.find((p) => getLeaveTypeSlug(p.type) === "study");
        return policy ? policy.default_days : 5;
      }

      if (slug === "compensatory" || slug === "unpaid") {
        return null; // As approved by manager & HR without predefined hard cap
      }

      const policy = leaveTypePolicies.find(
        (p) => getLeaveTypeSlug(p.type) === slug || p.type.toLowerCase() === type.toLowerCase()
      );
      if (policy?.is_unpaid || !policy?.default_days) {
        return null;
      }
      return policy.default_days;
    },
    [employees, myEmployee, leaveTypePolicies, currentYear]
  );

  const getUsedDays = useCallback(
    (employeeId: string, type: string): number => {
      const targetSlug = getLeaveTypeSlug(type);
      return requests
        .filter(
          (r) =>
            r.employee_id === employeeId &&
            (getLeaveTypeSlug(r.leave_type) === targetSlug || r.leave_type === type) &&
            r.status === "approved" &&
            new Date(r.start_date).getFullYear() === currentYear
        )
        .reduce((sum, r) => sum + (r.days || 0), 0);
    },
    [requests, currentYear]
  );

  const getPendingDays = useCallback(
    (employeeId: string, type: string): number => {
      const targetSlug = getLeaveTypeSlug(type);
      return requests
        .filter(
          (r) =>
            r.employee_id === employeeId &&
            (getLeaveTypeSlug(r.leave_type) === targetSlug || r.leave_type === type) &&
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
    (employeeId: string, type: string): LeaveTypeBalanceStats => {
      const slug = getLeaveTypeSlug(type);
      const isUnpaid = slug === "unpaid" || leaveTypePolicies.find((p) => getLeaveTypeSlug(p.type) === slug)?.is_unpaid;
      const entitlement = getEntitlement(employeeId, type);
      const used = getUsedDays(employeeId, type);
      const pending = getPendingDays(employeeId, type);
      const available = entitlement !== null ? Math.max(0, entitlement - used - pending) : (isUnpaid ? "Unlimited" : 999);
      return {
        balance: entitlement !== null ? entitlement : (isUnpaid ? "No limit" : 0),
        used,
        available: isUnpaid ? "Unlimited" : available,
        pending,
        isUnpaid: Boolean(isUnpaid),
      };
    },
    [getEntitlement, getUsedDays, getPendingDays, leaveTypePolicies]
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
