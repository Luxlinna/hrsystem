import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import type { LeaveRequest, Employee, LeaveTypePolicy } from "../types";

export function normalizeLeaveRequest(r: LeaveRequest): LeaveRequest {
  const isCancelled =
    r.status === "cancelled" ||
    (r.status === "rejected" &&
      (r.reason?.startsWith("[Cancelled") ||
        r.reason?.includes("[Cancelled by employee]") ||
        r.reason?.includes("(Cancelled:")));
  return isCancelled ? { ...r, status: "cancelled" } : r;
}

export function useLeaveData() {
  const { user } = useAuth();
  const { role, isAdmin, loading: permsLoading } = usePermissions();
  const canViewAll = isAdmin || !!role?.leave_view_all_employees;
  const canViewOwnBranch = !canViewAll && !!role?.leave_view_own_branch;
  const canManage = canViewAll || canViewOwnBranch;
  const canApproveLeave = isAdmin || !!role?.leave_approve;

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [calendarRequests, setCalendarRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [myApproverName, setMyApproverName] = useState<string>("");
  const [leaveTypePolicies, setLeaveTypePolicies] = useState<LeaveTypePolicy[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      const { data: me } = await supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, annual_leave_days, avatar_url, branch_id, email, reports_to")
        .eq("email", user.email)
        .maybeSingle();
      setMyEmployee(me);

      if (me?.reports_to) {
        const { data: mgr } = await supabase
          .from("employees")
          .select("first_name, last_name")
          .eq("id", me.reports_to)
          .maybeSingle();
        setMyApproverName(mgr ? `${mgr.first_name} ${mgr.last_name}`.trim() : "");
      } else {
        setMyApproverName("");
      }

      if (canViewAll) {
        const { data: lr } = await supabase
          .from("leave_requests")
          .select("id, employee_id, leave_type, start_date, end_date, days, status, reason, created_at, employees(first_name, last_name, role, department, avatar_url, email)")
          .is("deleted_at", null)
          .order("created_at", { ascending: false });
        const allReqs = (lr || []).map((x: any) => normalizeLeaveRequest({
          ...x,
          employees: Array.isArray(x.employees) ? x.employees[0] : x.employees || null
        }));
        setRequests(allReqs);
        setCalendarRequests(allReqs.filter((r) => r.status === "approved"));

        const { data: emp } = await supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, annual_leave_days, avatar_url, email")
          .eq("status", "active")
          .order("first_name");
        setEmployees(emp || []);
        setLoading(false);
        return;
      }

      if (!me) {
        setEmployees([]);
        setRequests([]);
        setLoading(false);
        return;
      }

      if (canViewOwnBranch && me.branch_id) {
        const { data: team } = await supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, annual_leave_days, avatar_url, email")
          .eq("status", "active")
          .eq("branch_id", me.branch_id)
          .order("first_name");
        setEmployees(team || []);

        const ids = (team || []).map((e) => e.id);
        const { data: lr } = ids.length
          ? await supabase
              .from("leave_requests")
              .select("id, employee_id, leave_type, start_date, end_date, days, status, reason, created_at, employees(first_name, last_name, role, department, avatar_url, email)")
              .in("employee_id", ids)
              .is("deleted_at", null)
              .order("created_at", { ascending: false })
          : { data: [] };
        const allReqs = (lr || []).map((x: any) => normalizeLeaveRequest({
          ...x,
          employees: Array.isArray(x.employees) ? x.employees[0] : x.employees || null
        }));
        setRequests(allReqs);
        setCalendarRequests(allReqs.filter((r) => r.status === "approved"));
        setLoading(false);
        return;
      }

      setEmployees([me]);
      const { data: lr } = await supabase
        .from("leave_requests")
        .select("id, employee_id, leave_type, start_date, end_date, days, status, reason, created_at, employees(first_name, last_name, role, department, avatar_url, email)")
        .eq("employee_id", me.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      const allReqs = (lr || []).map((x: any) => normalizeLeaveRequest({
        ...x,
        employees: Array.isArray(x.employees) ? x.employees[0] : x.employees || null
      }));
      setRequests(allReqs);
      setCalendarRequests(allReqs.filter((r) => r.status === "approved"));
    } catch (err) {
      console.error("Error loading leave data:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.email, canViewAll, canViewOwnBranch]);

  useEffect(() => {
    supabase
      .from("leave_type_policies")
      .select("type, default_days")
      .then(({ data }) => setLeaveTypePolicies(data || []));
  }, []);

  useEffect(() => {
    if (permsLoading) return;
    loadData();

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const ch = supabase
      .channel("leave-realtime")
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
    canApproveLeave,
    requests,
    setRequests,
    calendarRequests,
    employees,
    myEmployee,
    myApproverName,
    leaveTypePolicies,
    loading,
    loadData,
  };
}
