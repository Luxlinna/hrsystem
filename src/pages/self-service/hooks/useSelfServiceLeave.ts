import { useState, useCallback } from "react";
import { INITIAL_LEAVE_FORM } from "@/pages/leave/constants";
import type { Employee, LeaveFormData } from "@/pages/leave/types";
import { useSelfServiceLeaveData } from "./leave/useSelfServiceLeaveData";
import { useSelfServiceLeaveBalances } from "./leave/useSelfServiceLeaveBalances";
import { useSelfServiceLeaveMutations } from "./leave/useSelfServiceLeaveMutations";

interface UseSelfServiceLeaveProps {
  employeeId: string;
  initialEmployee?: Employee | null;
  isSuperAdmin?: boolean;
  isBranchAdmin?: boolean;
}

export function useSelfServiceLeave({
  employeeId,
  initialEmployee,
  isSuperAdmin = false,
  isBranchAdmin = false,
}: UseSelfServiceLeaveProps) {
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState<LeaveFormData>({
    ...INITIAL_LEAVE_FORM,
    employee_id: employeeId,
  });

  const showToast = useCallback((type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // 1. Data Hook
  const data = useSelfServiceLeaveData({
    employeeId,
    initialEmployee,
    onStatusToast: (type, message) => showToast(type, message),
  });

  // 2. Balances Hook
  const balances = useSelfServiceLeaveBalances({
    requests: data.requests,
    entitlement: data.entitlement,
    allEmployees: data.allEmployees,
    currentEmployee: data.currentEmployee,
    leaveTypePolicies: data.leaveTypePolicies,
  });

  // 3. Mutations Hook
  const mutations = useSelfServiceLeaveMutations({
    employeeId,
    formData,
    setFormData,
    getLeaveTypeStats: balances.getLeaveTypeStats,
    requests: data.requests,
    currentEmployee: data.currentEmployee,
    fetchLeave: data.fetchLeave,
    showToast,
    isSuperAdmin,
    isBranchAdmin,
  });

  return {
    requests: data.requests,
    loading: data.loading,
    currentEmployee: data.currentEmployee,
    allEmployees: data.allEmployees,
    myApproverName: data.myApproverName,
    hrApprovers: data.hrApprovers,
    toast,
    formData,
    setFormData,
    getLeaveTypeStats: balances.getLeaveTypeStats,
    stats: balances.stats,
    submitting: mutations.submitting,
    handleSubmit: mutations.handleSubmit,
  };
}
