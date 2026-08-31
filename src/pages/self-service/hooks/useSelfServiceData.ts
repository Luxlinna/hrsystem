import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { todayYMD } from "@/lib/date";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import type { Employee } from "../types";
import { SELF_SERVICE_TABS } from "../constants";

export function useSelfServiceData() {
  const { user } = useAuth();
  const { loading: permsLoading, can } = usePermissions();

  const [searchParams] = useSearchParams();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "payslips");
  const quickCheckIn = searchParams.get("quickCheckIn") === "1";
  const quickCheckOut = searchParams.get("quickCheckOut") === "1";
  const [loading, setLoading] = useState(true);
  const [noOwnRecord, setNoOwnRecord] = useState(false);
  const [managerName, setManagerName] = useState<string>("");

  const [todayAttendance, setTodayAttendance] = useState<any | null>(null);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [latestPayslip, setLatestPayslip] = useState<any | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeOutsideWork, setActiveOutsideWork] = useState<{ title: string; work_checked_in_at: string } | null>(null);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) setActiveTab(t);
  }, [searchParams]);

  useEffect(() => {
    if (permsLoading) return;
    if (!user?.email) { setLoading(false); return; }

    (async () => {
      const cleanEmail = user.email.trim().toLowerCase();
      const { data } = await supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, status, join_date, email, phone, avatar_url, reports_to, branch_id, branches(name)")
        .ilike("email", cleanEmail)
        .is("deleted_at", null)
        .maybeSingle();

      const emp = data as unknown as Employee | null;
      if (emp) {
        setSelectedEmployee(emp);
        if (emp.reports_to) {
          const { data: mgr } = await supabase
            .from("employees")
            .select("first_name, last_name")
            .eq("id", emp.reports_to)
            .maybeSingle();
          if (mgr) setManagerName(`${mgr.first_name} ${mgr.last_name}`.trim());
        }
      } else {
        setNoOwnRecord(true);
      }
      setLoading(false);
    })();
  }, [permsLoading, user?.email]);

  useEffect(() => {
    if (!selectedEmployee || !user) return;
    (async () => {
      const today = todayYMD();
      const [attRes, leaveRes, payRes, notifRes, outsideRes] = await Promise.all([
        supabase.from("attendance_records").select("*").eq("employee_id", selectedEmployee.id).eq("date", today).maybeSingle(),
        supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("employee_id", selectedEmployee.id).eq("status", "pending"),
        supabase.from("payroll_records").select("*").eq("employee_id", selectedEmployee.id).order("month", { ascending: false }).limit(1).maybeSingle(),
        can("notifications")
          ? supabase.from("notifications").select("id", { count: "exact", head: true }).or(`recipient_user_id.is.null,recipient_user_id.eq.${user.id}`).or(`branch_id.is.null,branch_id.eq.${selectedEmployee.branch_id}`).eq("is_read", false)
          : Promise.resolve({ count: 0 }),
        supabase.from("tasks").select("id, title, due_date, work_status, work_checked_in_at, created_at").eq("assigned_to", selectedEmployee.id).eq("is_outside_work", true).is("deleted_at", null),
      ]);
      setTodayAttendance((attRes as any).data || null);
      setPendingLeaveCount((leaveRes as any).count || 0);
      setLatestPayslip((payRes as any).data || null);
      setUnreadCount((notifRes as any).count || 0);
      const outsideTasks = ((outsideRes as any).data as any[]) || [];
      const outsideItem = outsideTasks.find((t) => t.work_status === "checked_in")
        || outsideTasks.find((t) => t.due_date === today || (t.work_checked_in_at && t.work_checked_in_at.startsWith(today)))
        || outsideTasks.find((t) => t.created_at && t.created_at.startsWith(today) && t.work_status !== "checked_out")
        || null;
      setActiveOutsideWork(outsideItem ? { title: outsideItem.title, work_checked_in_at: outsideItem.work_checked_in_at } : null);
    })();
  }, [selectedEmployee, user, can, activeTab]);

  const activeTabMeta = SELF_SERVICE_TABS.find((t) => t.id === activeTab) || SELF_SERVICE_TABS[0];

  return {
    selectedEmployee,
    activeTab,
    setActiveTab,
    quickCheckIn,
    quickCheckOut,
    loading,
    noOwnRecord,
    managerName,
    todayAttendance,
    pendingLeaveCount,
    latestPayslip,
    unreadCount,
    activeOutsideWork,
    activeTabMeta,
    user,
  };
}
