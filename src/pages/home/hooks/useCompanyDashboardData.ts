import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { LiveStats, HrKpiState, AttendanceBucket, HiringTrendItem, AnnouncementItem, DateRange } from "../types";
import { computeHrKpis, computeAttendanceBreakdown, computeHiringTrend } from "../dashboardUtils";

interface UseCompanyDashboardDataProps {
  userId?: string;
  isPartnerBranchBlocked: boolean;
  targetBranch: string | null;
  dateRange: DateRange;
}

const INITIAL_STATS: LiveStats = {
  branches: 0, employees: 0, activeEmployees: 0, onboardingPending: 0,
  leavePending: 0, payrollProcessed: 0, payrollTotal: 0, openJobs: 0,
  totalCandidates: 0, hiredThisMonth: 0, notificationsUnread: 0,
};

const TABLES_TO_SUBSCRIBE = [
  "employees", "candidates", "job_postings", "leave_requests",
  "onboarding_requests", "branches", "notifications",
  "announcements", "attendance_records", "training_enrollments", "disciplinary_records",
];

export function useCompanyDashboardData({
  userId,
  isPartnerBranchBlocked,
  targetBranch,
  dateRange,
}: UseCompanyDashboardDataProps) {
  const [stats, setStats] = useState<LiveStats>(INITIAL_STATS);
  const [employees, setEmployees] = useState<any[]>([]);
  const [onboarding, setOnboarding] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deptData, setDeptData] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [hrKpis, setHrKpis] = useState<HrKpiState>({
    attendanceRate: 0, avgHoursWorked: 0, lateRate: 0, trainingCompletionRate: 0,
    openDisciplinaryCases: 0, inProgressTrainings: 0, attendanceTrend: [],
  });
  const [attendanceData, setAttendanceData] = useState<AttendanceBucket[]>([]);
  const [hiringTrend, setHiringTrend] = useState<HiringTrendItem[]>([]);

  const loadAllData = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setEmployees([]); setOnboarding([]); setLeaveRequests([]);
      setJobs([]); setCandidates([]); setAnnouncements([]); setLoading(false); setRefreshing(false);
      return;
    }

    const branchId = targetBranch;
    const { from: fromDate, to: toDate } = dateRange;

    const [
      { data: b }, { data: e }, { data: ob }, { data: lr },
      { data: nt }, { data: j }, { data: c }, { data: announcementsData },
      { data: attData }, { data: trainEnroll }, { data: discData }, { data: offData },
    ] = await Promise.all([
      supabase.from("branches").select("id, name").eq("id", branchId),
      supabase.from("employees").select("id, first_name, last_name, department, status, join_date, branch_id, branches(name)").is("deleted_at", null).eq("branch_id", branchId),
      supabase.from("onboarding_requests").select("id, stage, status, created_at, employees(first_name, last_name, role, branch_id)").is("deleted_at", null).neq("status", "completed").order("created_at", { ascending: false }),
      supabase.from("leave_requests").select("id, status, leave_type, start_date, end_date, created_at, employees(first_name, last_name, role, department, branch_id)").is("deleted_at", null).gte("start_date", fromDate).lte("start_date", toDate).order("created_at", { ascending: false }).limit(50),
      userId ? supabase.from("notifications").select("id").or(`recipient_user_id.is.null,recipient_user_id.eq.${userId}`).or(`branch_id.is.null,branch_id.eq.${branchId}`).eq("is_read", false).limit(3) : Promise.resolve({ data: [] }),
      supabase.from("job_postings").select("id, title, status, department, location, salary_min, branch_id").is("deleted_at", null).eq("branch_id", branchId),
      supabase.from("candidates").select("id, stage, full_name, applied_at, job_posting_id, job_postings(branch_id)").is("deleted_at", null),
      supabase.from("announcements").select("id, title, content, category, pinned, published_at, author_name, branch_id").is("deleted_at", null).or(`branch_id.eq.${branchId},branch_id.is.null`).order("pinned", { ascending: false }).order("published_at", { ascending: false }).limit(4),
      supabase.from("attendance_records").select("status, date, hours_worked, employees(branch_id)").is("deleted_at", null).gte("date", fromDate).lte("date", toDate),
      supabase.from("training_enrollments").select("status, employees(branch_id)").is("deleted_at", null),
      supabase.from("disciplinary_records").select("status, branch_id").is("deleted_at", null).or(`branch_id.eq.${branchId},branch_id.is.null`),
      supabase.from("offboarding_requests").select("last_day, created_at, employees(branch_id)"),
    ]);

    const filteredLr = (lr || []).filter((x: any) => x.employees?.branch_id === branchId);
    const filteredAtt = (attData || []).filter((a: any) => a.employees?.branch_id === branchId);
    const filteredOb = (ob || []).filter((o: any) => o.employees?.branch_id === branchId);
    const filteredCand = (c || []).filter((cand: any) => !cand.job_postings?.branch_id || cand.job_postings?.branch_id === branchId);
    const filteredTrain = (trainEnroll || []).filter((t: any) => !t.employees?.branch_id || t.employees?.branch_id === branchId);
    const filteredOff = (offData || []).filter((o: any) => !o.employees?.branch_id || o.employees?.branch_id === branchId);

    setHrKpis(computeHrKpis(filteredAtt, filteredTrain, discData || []));
    setAttendanceData(computeAttendanceBreakdown(filteredAtt, dateRange.from, dateRange.to));
    setHiringTrend(computeHiringTrend(e || [], filteredOff));
    setAnnouncements((announcementsData as unknown as AnnouncementItem[]) || []);

    const empList = e || [];
    const depts = empList.reduce((acc: Record<string, number>, x: any) => {
      acc[x.department] = (acc[x.department] || 0) + 1;
      return acc;
    }, {});

    setStats({
      branches: b?.length || 0,
      employees: empList.length,
      activeEmployees: empList.filter((x: any) => x.status === "active").length,
      onboardingPending: filteredOb.length,
      leavePending: filteredLr.filter((x: any) => x.status === "pending").length,
      payrollProcessed: 0,
      payrollTotal: 0,
      openJobs: (j || []).filter((x: any) => x.status === "active").length,
      totalCandidates: filteredCand.length,
      hiredThisMonth: filteredCand.filter((x: any) => x.stage === "hired").length,
      notificationsUnread: nt?.length || 0,
    });

    setEmployees(empList);
    setOnboarding(filteredOb);
    setLeaveRequests(filteredLr.slice(0, 5));
    setNotifications(nt || []);
    setJobs(j || []);
    setCandidates(filteredCand);
    setDeptData(depts);
    setLastUpdated(new Date());
    setLoading(false);
  }, [userId, isPartnerBranchBlocked, targetBranch, dateRange]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, [refreshing, loadAllData]);

  useEffect(() => {
    loadAllData();
    let debounceTimer: ReturnType<typeof setTimeout>;
    const debouncedLoad = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => loadAllData(), 1500);
    };

    const channels = TABLES_TO_SUBSCRIBE.map((table) =>
      supabase
        .channel(`public:${table}`)
        .on("postgres_changes", { event: "*", schema: "public", table }, debouncedLoad)
        .subscribe()
    );

    return () => {
      clearTimeout(debounceTimer);
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [loadAllData]);

  return {
    stats,
    employees,
    onboarding,
    leaveRequests,
    notifications,
    jobs,
    candidates,
    announcements,
    loading,
    refreshing,
    deptData,
    lastUpdated,
    hrKpis,
    attendanceData,
    hiringTrend,
    handleRefresh,
  };
}
