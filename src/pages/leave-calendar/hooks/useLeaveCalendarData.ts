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
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId } = useBranchScope();

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const canViewAll = isAdmin || (!isBranchAdmin && !!role?.leave_view_all_employees);
  const canViewOwnBranch = !canViewAll && (isBranchAdmin || !!role?.leave_view_own_branch);
  const canManage = canViewAll || canViewOwnBranch;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let myEmp: Employee | null = null;
      if (user?.email) {
        const { data: me } = await supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, annual_leave_days, avatar_url, branch_id, email")
          .eq("email", user.email)
          .maybeSingle();
        myEmp = me;
        setMyEmployee(me);
      }

      if (canViewAll && isSuperAdmin && !effectiveBranchId) {
        const [empRes, leaveRes] = await Promise.all([
          supabase
            .from("employees")
            .select("id, first_name, last_name, role, department, annual_leave_days, avatar_url, email, branch_id")
            .is("deleted_at", null)
            .order("first_name"),
          supabase
            .from("leave_requests")
            .select("*, employees(id, first_name, last_name, role, department, avatar_url, email, branch_id)")
            .is("deleted_at", null)
            .order("start_date", { ascending: true }),
        ]);

        setEmployees(empRes.data || []);
        setLeaves((leaveRes.data || []).map(normalizeLeave));
        return;
      }

      const targetBranch = effectiveBranchId || userBranchId || myEmp?.branch_id;
      if ((canViewAll || canViewOwnBranch) && targetBranch) {
        const { data: empList } = await supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, annual_leave_days, avatar_url, email, branch_id")
          .eq("branch_id", targetBranch)
          .is("deleted_at", null)
          .order("first_name");

        const emps = empList || [];
        setEmployees(emps);
        const empIds = emps.map((e) => e.id);

        const { data: rawLeaves } = empIds.length
          ? await supabase
              .from("leave_requests")
              .select("*, employees(id, first_name, last_name, role, department, avatar_url, email, branch_id)")
              .in("employee_id", empIds)
              .is("deleted_at", null)
              .order("start_date", { ascending: true })
          : { data: [] };

        setLeaves((rawLeaves || []).map(normalizeLeave));
        return;
      }

      if (myEmp) {
        setEmployees([myEmp]);
        const { data: rawLeaves } = await supabase
          .from("leave_requests")
          .select("*, employees(id, first_name, last_name, role, department, avatar_url, email, branch_id)")
          .eq("employee_id", myEmp.id)
          .is("deleted_at", null)
          .order("start_date", { ascending: true });
        setLeaves((rawLeaves || []).map(normalizeLeave));
      } else {
        setEmployees([]);
        setLeaves([]);
      }
    } catch (err) {
      console.error("Error loading leave calendar data:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.email, canViewAll, canViewOwnBranch, isSuperAdmin, effectiveBranchId, userBranchId]);

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
