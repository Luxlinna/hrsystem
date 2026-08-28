import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import type { LeaveRequest, Employee } from "../types";

export function normalizeLeave(l: LeaveRequest): LeaveRequest {
  const isCancelled =
    l.status === "cancelled" ||
    (l.status === "rejected" &&
      (l.reason?.startsWith("[Cancelled") ||
        l.reason?.includes("[Cancelled by employee]") ||
        l.reason?.includes("(Cancelled:")));
  return isCancelled ? { ...l, status: "cancelled" } : l;
}

export function useLeaveCalendarData() {
  const { user } = useAuth();
  const { role, isAdmin, loading: permsLoading } = usePermissions();
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId, userBranchName } = useBranchScope();

  // Partner Privacy Rule: Super Admin or any user CANNOT access other partner branches' leave calendar.
  // Access is strictly confined to the user's home branch (userBranchId).
  const isPartnerBranchBlocked = Boolean(
    !userBranchId || (effectiveBranchId && effectiveBranchId !== userBranchId)
  );
  const targetBranch = isPartnerBranchBlocked ? null : userBranchId;

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const canViewAll = (isAdmin || (!isBranchAdmin && !!role?.leave_view_all_employees)) && !isPartnerBranchBlocked;
  const canViewOwnBranch = !canViewAll && (isBranchAdmin || !!role?.leave_view_own_branch) && !isPartnerBranchBlocked;
  const canManage = canViewAll || canViewOwnBranch;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (!user?.email || isPartnerBranchBlocked || !targetBranch) {
        setLeaves([]);
        setEmployees([]);
        setLoading(false);
        return;
      }

      let myEmp: Employee | null = null;
      const { data: me } = await supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, annual_leave_days, avatar_url, branch_id, email")
        .eq("email", user.email)
        .maybeSingle();
      myEmp = me;
      setMyEmployee(me);

      if (canViewAll || canViewOwnBranch) {
        const [empRes, leaveRes] = await Promise.all([
          supabase
            .from("employees")
            .select("id, first_name, last_name, role, department, annual_leave_days, avatar_url, email, branch_id")
            .eq("branch_id", targetBranch)
            .is("deleted_at", null)
            .order("first_name"),
          supabase
            .from("leave_requests")
            .select("*, employees(id, first_name, last_name, role, department, avatar_url, email, branch_id)")
            .is("deleted_at", null)
            .order("start_date", { ascending: true }),
        ]);

        const empList = empRes.data || [];
        const empIds = new Set(empList.map((e: any) => e.id));
        const filteredLeaves = (leaveRes.data || []).filter(
          (l: any) => empIds.has(l.employee_id) || l.employees?.branch_id === targetBranch
        );

        setEmployees(empList);
        setLeaves(filteredLeaves.map((x: any) => normalizeLeave({
          ...x,
          employees: Array.isArray(x.employees) ? x.employees[0] : x.employees || null
        })));
      } else if (myEmp && myEmp.branch_id === targetBranch) {
        setEmployees([myEmp]);
        const { data: rawLeaves } = await supabase
          .from("leave_requests")
          .select("*, employees(id, first_name, last_name, role, department, avatar_url, email, branch_id)")
          .eq("employee_id", myEmp.id)
          .is("deleted_at", null)
          .order("start_date", { ascending: true });
        setLeaves((rawLeaves || []).map((x: any) => normalizeLeave({
          ...x,
          employees: Array.isArray(x.employees) ? x.employees[0] : x.employees || null
        })));
      } else {
        setEmployees([]);
        setLeaves([]);
      }
    } catch (err) {
      console.error("Error loading leave calendar data:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.email, canViewAll, canViewOwnBranch, isPartnerBranchBlocked, targetBranch]);

  useEffect(() => {
    if (!permsLoading) {
      loadData();
    }

    const ch = supabase
      .channel("leave-calendar-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [permsLoading, loadData]);

  return {
    user,
    role,
    isAdmin,
    isSuperAdmin,
    isPartnerBranchBlocked,
    userBranchId,
    userBranchName,
    targetBranch,
    canViewAll,
    canViewOwnBranch,
    canManage,
    leaves,
    setLeaves,
    employees,
    myEmployee,
    loading,
    loadData,
  };
}
