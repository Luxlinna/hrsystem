import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import type { LeaveRequest, Employee, LeaveTypePolicy } from "../types";
import { applyUserEmployeeFilter, isPhoneSyntheticEmail } from "@/lib/phoneUtils";

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
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId, userBranchName, targetBranch, isPartnerBranchBlocked } = useBranchScope();

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [calendarRequests, setCalendarRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [myApproverName, setMyApproverName] = useState<string>("");
  const [hrApprovers, setHrApprovers] = useState<Employee[]>([]);
  const [leaveTypePolicies, setLeaveTypePolicies] = useState<LeaveTypePolicy[]>([]);
  const [loading, setLoading] = useState(true);

  const canViewAll = (isAdmin || (!isBranchAdmin && !!role?.leave_view_all_employees)) && !isPartnerBranchBlocked;
  const canViewOwnBranch = !canViewAll && (isBranchAdmin || !!role?.leave_view_own_branch) && !isPartnerBranchBlocked;
  const canManage = canViewAll || canViewOwnBranch;
  const hasSubordinates = employees.some((e) => e.reports_to === myEmployee?.id && e.id !== myEmployee?.id);
  const isLineManager = hasSubordinates || (myEmployee?.role?.toLowerCase().includes("manager") ?? false);
  const canApproveLeave = (isAdmin || isBranchAdmin || !!role?.leave_approve || isLineManager) && !isPartnerBranchBlocked;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (!user?.email || isPartnerBranchBlocked || !targetBranch) {
        setEmployees([]);
        setRequests([]);
        setCalendarRequests([]);
        setLoading(false);
        return;
      }

      // Fetch HR Approvers for the approval chain
      const { data: hrStaff } = await supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, avatar_url, email, branch_id")
        .or("department.ilike.%hr%,role.ilike.%hr%")
        .is("deleted_at", null)
        .order("first_name");
      setHrApprovers(hrStaff || []);

      const meQuery = applyUserEmployeeFilter(
        supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, annual_leave_days, avatar_url, branch_id, email, reports_to"),
        user.email
      );
      const { data: rows } = await meQuery.limit(5);
      const me = rows && rows.length > 0
        ? ((isPhoneSyntheticEmail(user.email) ? rows.find((r: any) => !r.email || isPhoneSyntheticEmail(r.email)) : rows.find((r: any) => r.email?.toLowerCase() === user.email.toLowerCase())) || rows[0])
        : null;
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

      if (canViewAll || canViewOwnBranch) {
        const { data: team } = await supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, annual_leave_days, avatar_url, email, branch_id, reports_to")
          .eq("branch_id", targetBranch)
          .is("deleted_at", null)
          .order("first_name");
        setEmployees(team || []);

        const ids = (team || []).map((e) => e.id);
        const { data: lr } = ids.length
          ? await supabase
              .from("leave_requests")
              .select("id, employee_id, leave_type, start_date, end_date, days, status, reason, created_at, employees(first_name, last_name, role, department, avatar_url, email, branch_id)")
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

      if (!me) {
        setEmployees([]);
        setRequests([]);
        setLoading(false);
        return;
      }

      // If user is a line manager, fetch direct subordinates who report to them
      const { data: directReports } = await supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, annual_leave_days, avatar_url, email, branch_id, reports_to")
        .eq("reports_to", me.id)
        .is("deleted_at", null);

      const combinedTeam = [me, ...(directReports || [])];
      setEmployees(combinedTeam);

      const targetIds = combinedTeam.map((e) => e.id);
      const { data: lr } = await supabase
        .from("leave_requests")
        .select("id, employee_id, leave_type, start_date, end_date, days, status, reason, created_at, employees(first_name, last_name, role, department, avatar_url, email, branch_id)")
        .in("employee_id", targetIds)
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
  }, [user?.email, canViewAll, canViewOwnBranch, isPartnerBranchBlocked, targetBranch]);

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
    isSuperAdmin,
    isBranchAdmin,
    isPartnerBranchBlocked,
    userBranchId,
    userBranchName,
    targetBranch,
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
    hrApprovers,
    leaveTypePolicies,
    loading,
    loadData,
  };
}
