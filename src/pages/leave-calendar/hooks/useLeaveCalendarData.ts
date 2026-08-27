import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
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

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const canViewAll = isAdmin || role?.leave_view_all_employees || false;
  const canViewOwnBranch = role?.leave_view_own_branch || false;
  const canManage = canViewAll || canViewOwnBranch;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (user?.email) {
        const { data: me } = await supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, annual_leave_days, avatar_url, branch_id, email")
          .eq("email", user.email)
          .maybeSingle();
        setMyEmployee(me);
      }

      const { data: empList } = await supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, annual_leave_days, avatar_url, email, branch_id")
        .eq("status", "active")
        .order("first_name");
      setEmployees(empList || []);

      const { data: rawLeaves } = await supabase
        .from("leave_requests")
        .select("*, employees(id, first_name, last_name, role, department, avatar_url, email)")
        .order("start_date", { ascending: true });

      const normalized = (rawLeaves || []).map(normalizeLeave);
      setLeaves(normalized);
    } catch (err) {
      console.error("Error loading leave calendar data:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

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
