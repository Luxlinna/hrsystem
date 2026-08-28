import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import type {
  LiveStats,
  HrKpiState,
  AttendanceBucket,
  HiringTrendItem,
  AnnouncementItem,
} from "../types";
import { computeHrKpis, computeAttendanceBreakdown, computeHiringTrend } from "../dashboardUtils";

export function useCompanyDashboard() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const { effectiveBranchId } = useBranchScope();

  const [stats, setStats] = useState<LiveStats>({
    branches: 0,
    employees: 0,
    activeEmployees: 0,
    onboardingPending: 0,
    leavePending: 0,
    payrollProcessed: 0,
    payrollTotal: 0,
    openJobs: 0,
    totalCandidates: 0,
    hiredThisMonth: 0,
    notificationsUnread: 0,
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [onboarding, setOnboarding] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deptData, setDeptData] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Pull-to-refresh state
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const PULL_THRESHOLD = 64;

  const [hrKpis, setHrKpis] = useState<HrKpiState>({
    attendanceRate: 0,
    avgHoursWorked: 0,
    lateRate: 0,
    trainingCompletionRate: 0,
    openDisciplinaryCases: 0,
    inProgressTrainings: 0,
    attendanceTrend: [],
  });
  const [attendanceData, setAttendanceData] = useState<AttendanceBucket[]>([]);
  const [hiringTrend, setHiringTrend] = useState<HiringTrendItem[]>([]);

  // Mobile FAB state
  const [fabOpen, setFabOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  const loadAllData = useCallback(async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fromDate = sevenDaysAgo.toISOString().split("T")[0];

    // Build branch-scoped queries when effectiveBranchId is set
    const branchId = effectiveBranchId;

    let empQuery = supabase.from("employees").select("id, first_name, last_name, department, status, join_date, branch_id, branches(name)");
    if (branchId) empQuery = empQuery.eq("branch_id", branchId);

    let obQuery = supabase.from("onboarding_requests").select("id, stage, status, created_at, employees(first_name, last_name, role, branch_id)").is("deleted_at", null).neq("status", "completed").order("created_at", { ascending: false });
    // Filter onboarding by branch via the joined employee
    if (branchId) obQuery = (obQuery as any).eq("employees.branch_id", branchId);

    const lrQuery = supabase.from("leave_requests").select("id, status, leave_type, start_date, end_date, created_at, employees(first_name, last_name, role, department, branch_id)").order("created_at", { ascending: false }).limit(20);
    // Will filter leave requests in memory by branch to keep the join simple

    const prQuery = supabase.from("payroll_records").select("id, employee_id, month, net_pay, status, employees(branch_id)").eq("month", currentMonth);
    // Will filter in memory

    const attQuery = supabase.from("attendance_records").select("status, date, hours_worked, employees(branch_id)").gte("date", fromDate);
    // Will filter in memory

    const [
      { data: b },
      { data: e },
      { data: ob },
      { data: lr },
      { data: pr },
      { data: nt },
      { data: j },
      { data: c },
      { data: announcementsData },
      { data: attData },
      { data: trainEnroll },
      { data: discData },
      { data: offData },
    ] = await Promise.all([
      branchId
        ? supabase.from("branches").select("id, name").eq("id", branchId)
        : supabase.from("branches").select("id, name"),
      empQuery,
      obQuery,
      lrQuery,
      prQuery,
      user?.id ? supabase.from("notifications").select("id").or(`recipient_user_id.is.null,recipient_user_id.eq.${user.id}`).eq("is_read", false).limit(3) : Promise.resolve({ data: [] }),
      supabase.from("job_postings").select("id, title, status, department, location, salary_min").is("deleted_at", null),
      supabase.from("candidates").select("id, stage, full_name, applied_at").is("deleted_at", null),
      supabase.from("announcements").select("id, title, content, category, pinned, published_at, author_name").is("deleted_at", null).order("pinned", { ascending: false }).order("published_at", { ascending: false }).limit(4),
      attQuery,
      supabase.from("training_enrollments").select("status").is("deleted_at", null),
      supabase.from("disciplinary_records").select("status").is("deleted_at", null),
      supabase.from("offboarding_requests").select("last_day, created_at"),
    ]);

    // Filter in-memory for records that join through employees

    const filteredLr = branchId
      ? (lr || []).filter((x: any) => x.employees?.branch_id === branchId)
      : (lr || []);

    const filteredPr = branchId
      ? (pr || []).filter((p: any) => p.employees?.branch_id === branchId)
      : (pr || []);

    const filteredAtt = branchId
      ? (attData || []).filter((a: any) => a.employees?.branch_id === branchId)
      : (attData || []);

    // Also filter onboarding in memory (join filter unreliable on some Supabase versions)
    const filteredOb = branchId
      ? (ob || []).filter((o: any) => o.employees?.branch_id === branchId)
      : (ob || []);

    setHrKpis(computeHrKpis(filteredAtt, trainEnroll || [], discData || []));
    setAttendanceData(computeAttendanceBreakdown(filteredAtt));
    setHiringTrend(computeHiringTrend(e || [], offData || []));
    setAnnouncements((announcementsData as unknown as AnnouncementItem[]) || []);

    const empList = e || [];
    const active = empList.filter((x: any) => x.status === "active").length;
    const depts = empList.reduce((acc: Record<string, number>, x: any) => {
      acc[x.department] = (acc[x.department] || 0) + 1;
      return acc;
    }, {});

    const payList = filteredPr;
    const totalPay = payList.reduce((sum: number, p: any) => sum + Number(p.net_pay || 0), 0);
    const candList = c || [];
    const hiredCount = candList.filter((x: any) => x.stage === "hired").length;

    setStats({
      branches: b?.length || 0,
      employees: empList.length,
      activeEmployees: active,
      onboardingPending: filteredOb.length,
      leavePending: filteredLr.filter((x: any) => x.status === "pending").length,
      payrollProcessed: payList.filter((p: any) => p.status === "processed").length,
      payrollTotal: totalPay,
      openJobs: (j || []).filter((x: any) => x.status === "active").length,
      totalCandidates: candList.length,
      hiredThisMonth: hiredCount,
      notificationsUnread: nt?.length || 0,
    });

    setEmployees(empList);
    setOnboarding(filteredOb);
    setLeaveRequests(filteredLr.slice(0, 5));
    setPayroll(payList);
    setNotifications(nt || []);
    setJobs(j || []);
    setCandidates(candList);
    setDeptData(depts);
    setLastUpdated(new Date());
    setLoading(false);
  }, [user?.id, effectiveBranchId]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, [refreshing, loadAllData]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    setPullDistance(Math.max(0, Math.min(e.touches[0].clientY - pullStartY, 100)));
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD) await handleRefresh();
    setIsPulling(false);
    setPullDistance(0);
  };

  useEffect(() => {
    loadAllData();
    let debounceTimer: ReturnType<typeof setTimeout>;
    const debouncedLoad = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => loadAllData(), 1500);
    };

    const channels = [
      supabase.channel("dash-employees").on("postgres_changes", { event: "*", schema: "public", table: "employees" }, debouncedLoad).subscribe(),
      supabase.channel("dash-candidates").on("postgres_changes", { event: "*", schema: "public", table: "candidates" }, debouncedLoad).subscribe(),
      supabase.channel("dash-jobs").on("postgres_changes", { event: "*", schema: "public", table: "job_postings" }, debouncedLoad).subscribe(),
      supabase.channel("dash-leave").on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, debouncedLoad).subscribe(),
      supabase.channel("dash-payroll").on("postgres_changes", { event: "*", schema: "public", table: "payroll_records" }, debouncedLoad).subscribe(),
      supabase.channel("dash-onboarding").on("postgres_changes", { event: "*", schema: "public", table: "onboarding_requests" }, debouncedLoad).subscribe(),
      supabase.channel("dash-branches").on("postgres_changes", { event: "*", schema: "public", table: "branches" }, debouncedLoad).subscribe(),
      supabase.channel("dash-notifications").on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, debouncedLoad).subscribe(),
      supabase.channel("dash-announcements").on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, debouncedLoad).subscribe(),
      supabase.channel("dash-attendance").on("postgres_changes", { event: "*", schema: "public", table: "attendance_records" }, debouncedLoad).subscribe(),
      supabase.channel("dash-training").on("postgres_changes", { event: "*", schema: "public", table: "training_enrollments" }, debouncedLoad).subscribe(),
      supabase.channel("dash-disciplinary").on("postgres_changes", { event: "*", schema: "public", table: "disciplinary_records" }, debouncedLoad).subscribe(),
    ];

    return () => {
      clearTimeout(debounceTimer);
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [loadAllData]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setFabOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return {
    user,
    can,
    stats,
    employees,
    onboarding,
    leaveRequests,
    payroll,
    notifications,
    jobs,
    candidates,
    announcements,
    loading,
    refreshing,
    deptData,
    lastUpdated,
    isPulling,
    pullDistance,
    PULL_THRESHOLD,
    hrKpis,
    attendanceData,
    hiringTrend,
    fabOpen,
    setFabOpen,
    fabRef,
    handleRefresh,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}

