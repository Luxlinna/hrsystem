import { useMemo, useCallback } from "react";
import type {
  Employee,
  LeaveRequest,
  LeaveTypeBalanceStats,
  LeaveTypePolicy,
} from "@/pages/leave/types";

interface UseSelfServiceLeaveBalancesProps {
  requests: LeaveRequest[];
  entitlement: number;
  allEmployees: Employee[];
  currentEmployee: Employee | null;
  leaveTypePolicies: LeaveTypePolicy[];
}

export function useSelfServiceLeaveBalances({
  requests,
  entitlement,
  allEmployees,
  currentEmployee,
  leaveTypePolicies,
}: UseSelfServiceLeaveBalancesProps) {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const getEntitlement = useCallback(
    (empId: string, type: string): number | null => {
      if (type === "annual") {
        const emp = allEmployees.find((e) => e.id === empId) || currentEmployee;
        return emp?.annual_leave_days ?? entitlement ?? 18;
      }
      if (type === "maternity") return 90;
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
    [allEmployees, currentEmployee, entitlement, leaveTypePolicies]
  );

  const getUsedDays = useCallback(
    (empId: string, type: string): number => {
      return requests
        .filter(
          (r) =>
            r.employee_id === empId &&
            (r.leave_type === type || (type === "annual" && r.leave_type === "vacation")) &&
            r.status === "approved" &&
            new Date(r.start_date).getFullYear() === currentYear
        )
        .reduce((sum, r) => sum + (r.days || 0), 0);
    },
    [requests, currentYear]
  );

  const getPendingDays = useCallback(
    (empId: string, type: string): number => {
      return requests
        .filter(
          (r) =>
            r.employee_id === empId &&
            (r.leave_type === type || (type === "annual" && r.leave_type === "vacation")) &&
            r.status === "pending" &&
            new Date(r.start_date).getFullYear() === currentYear
        )
        .reduce((sum, r) => sum + (r.days || 0), 0);
    },
    [requests, currentYear]
  );

  const getLeaveTypeStats = useCallback(
    (empId: string, type: string): LeaveTypeBalanceStats => {
      const ent = getEntitlement(empId, type) ?? 0;
      const used = getUsedDays(empId, type);
      const pending = getPendingDays(empId, type);
      const available = Math.max(0, ent - used - pending);
      return {
        balance: ent,
        used,
        available,
        pending,
      };
    },
    [getEntitlement, getUsedDays, getPendingDays]
  );

  const totalApproved = useMemo(
    () => requests.filter((r) => r.status === "approved").reduce((s, r) => s + r.days, 0),
    [requests]
  );

  const totalPending = useMemo(
    () => requests.filter((r) => r.status === "pending").length,
    [requests]
  );

  const vacationCommittedDays = useMemo(
    () =>
      requests
        .filter(
          (r) =>
            (r.leave_type === "annual" || r.leave_type === "vacation") &&
            (r.status === "approved" || r.status === "pending") &&
            new Date(r.start_date).getFullYear() === currentYear
        )
        .reduce((s, r) => s + r.days, 0),
    [requests, currentYear]
  );

  const remainingDays = Math.max(0, entitlement - vacationCommittedDays);

  return {
    getLeaveTypeStats,
    stats: {
      remainingDays,
      totalRequests: requests.length,
      totalApproved,
      totalPending,
    },
  };
}
