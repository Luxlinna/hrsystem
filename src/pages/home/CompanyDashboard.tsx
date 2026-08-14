import { useState, useEffect, useRef, Fragment } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/context/AuthContext";

const pieColors = ["#253C7D", "#29ABE2", "#74C8EC", "#A8D8D8", "#D4ECEB"];

interface LiveStats {
  branches: number;
  employees: number;
  activeEmployees: number;
  onboardingPending: number;
  leavePending: number;
  payrollProcessed: number;
  payrollTotal: number;
  openJobs: number;
  totalCandidates: number;
  hiredThisMonth: number;
  notificationsUnread: number;
}

const QUICK_ACTIONS = [
  { label: "Log Attendance", icon: "ri-fingerprint-line", path: "/self-service?tab=checkin", module: "self-service", color: "bg-emerald-500", note: "Clock in / out" },
  { label: "Submit Leave", icon: "ri-calendar-event-line", path: "/self-service?tab=leave", module: "self-service", color: "bg-amber-500", note: "Request time off" },
  { label: "View Payslip", icon: "ri-money-dollar-circle-line", path: "/self-service?tab=payslips", module: "self-service", color: "bg-[#253C7D]", note: "Your payslips" },
  { label: "New Employee", icon: "ri-user-add-line", path: "/employees", module: "employees", color: "bg-violet-500", note: "Add to directory" },
  { label: "Notifications", icon: "ri-notification-3-line", path: "/notifications", module: "notifications", color: "bg-rose-500", note: "Check alerts" },
];

const ADMIN_ACTIONS = [
  { label: "Hire", icon: "ri-briefcase-line", path: "/hire", module: "hire" },
  { label: "Off Board", icon: "ri-user-unfollow-line", path: "/offboard", module: "offboard" },
  { label: "Org Chart", icon: "ri-organization-chart", path: "/org-chart", module: "org-chart" },
  { label: "Tools", icon: "ri-tools-line", path: "/tools", module: "tools" },
  { label: "Benefits", icon: "ri-heart-pulse-line", path: "/benefits", module: "benefits" },
  { label: "IT Mgmt", icon: "ri-computer-line", path: "/it-management", module: "it-management" },
  { label: "Finance", icon: "ri-bank-line", path: "/finance", module: "finance" },
  { label: "Settings", icon: "ri-settings-3-line", path: "/settings", module: "settings" },
  { label: "Unity Apps", icon: "ri-apps-line", path: "/unity-apps", module: "unity-apps" },
  { label: "Help", icon: "ri-question-line", path: "/settings", module: "settings" },
];

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermissions();
  const [fabOpen, setFabOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [stats, setStats] = useState<LiveStats>({
    branches: 0, employees: 0, activeEmployees: 0,
    onboardingPending: 0, leavePending: 0, payrollProcessed: 0,
    payrollTotal: 0, openJobs: 0, totalCandidates: 0,
    hiredThisMonth: 0, notificationsUnread: 0,
  });
  const [employees, setEmployees] = useState<any[]>([]);
  const [onboarding, setOnboarding] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deptData, setDeptData] = useState<Record<string, number>>();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  // Pull-to-refresh state
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const PULL_THRESHOLD = 64;
  const [hrKpis, setHrKpis] = useState({
    attendanceRate: 0,
    avgHoursWorked: 0,
    lateRate: 0,
    trainingCompletionRate: 0,
    openDisciplinaryCases: 0,
    inProgressTrainings: 0,
    attendanceTrend: [] as { day: string; rate: number }[],
  });
  const [attendanceData, setAttendanceData] = useState<{ day: string; present: number; absent: number; late: number }[]>([]);
  const [hiringTrend, setHiringTrend] = useState<{ month: string; hires: number; terminations: number }[]>([]);

  // Refresh handler
  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // Pull-to-refresh touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    const dist = Math.max(0, Math.min(e.touches[0].clientY - pullStartY, 100));
    setPullDistance(dist);
  };
  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD) {
      await handleRefresh();
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  // Real-time data load
  const loadAllData = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [
      { data: b },
      { data: e },
      { data: ob },
      { data: lr },
      { data: pr },
      { data: nt },
      { data: j },
      { data: c },
    ] = await Promise.all([
      supabase.from("branches").select("*"),
      supabase.from("employees").select("*, branches(name)"),
      supabase.from("onboarding_requests").select("*, employees(first_name, last_name, role, branch_id)").eq("status", "pending"),
      supabase.from("leave_requests").select("*, employees(first_name, last_name, role, department)").order("created_at", { ascending: false }).limit(5),
      supabase.from("payroll_records").select("*").eq("month", currentMonth),
      user?.id
        ? supabase.from("notifications").select("*").or(`recipient_user_id.is.null,recipient_user_id.eq.${user.id}`).eq("is_read", false).limit(3)
        : Promise.resolve({ data: [] }),
      supabase.from("job_postings").select("*"),
      supabase.from("candidates").select("*"),
    ]);
    const { data: announcementsData } = await supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("published_at", { ascending: false }).limit(4);

    // HR KPIs
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fromDate = sevenDaysAgo.toISOString().split("T")[0];
    const [{ data: attData }, { data: trainEnroll }, { data: discData }, { data: offData }] = await Promise.all([
      supabase.from("attendance_records").select("status, date, hours_worked").gte("date", fromDate),
      supabase.from("training_enrollments").select("status"),
      supabase.from("disciplinary_records").select("status"),
      supabase.from("offboarding_requests").select("last_day, created_at"),
    ]);
    const attRecords = attData || [];
    const totalAtt = attRecords.length;
    const presentAtt = attRecords.filter((r: any) => r.status === "present" || r.status === "late").length;
    const lateAtt = attRecords.filter((r: any) => r.status === "late").length;
    const attRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;
    const lateRate = totalAtt > 0 ? Math.round((lateAtt / totalAtt) * 100) : 0;
    const hoursArr = attRecords.filter((r: any) => r.hours_worked).map((r: any) => r.hours_worked);
    const avgHours = hoursArr.length > 0 ? parseFloat((hoursArr.reduce((s: number, h: number) => s + h, 0) / hoursArr.length).toFixed(1)) : 0;
    const trainRecords = trainEnroll || [];
    const completedTrainings = trainRecords.filter((r: any) => r.status === "completed").length;
    const inProgressTrainings = trainRecords.filter((r: any) => r.status === "in_progress").length;
    const trainingRate = trainRecords.length > 0 ? Math.round((completedTrainings / trainRecords.length) * 100) : 0;
    const openDisc = (discData || []).filter((r: any) => r.status !== "resolved" && r.status !== "closed").length;
    const trendDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const dayRecs = attRecords.filter((r: any) => r.date === dateStr);
      const rate = dayRecs.length > 0 ? Math.round((dayRecs.filter((r: any) => r.status !== "absent").length / dayRecs.length) * 100) : 0;
      return { day: d.toLocaleDateString("en-US", { weekday: "short" }), rate };
    });
    setHrKpis({ attendanceRate: attRate, avgHoursWorked: avgHours, lateRate, trainingCompletionRate: trainingRate, openDisciplinaryCases: openDisc, inProgressTrainings, attendanceTrend: trendDays });
    setAnnouncements(announcementsData || []);

    // Weekly attendance breakdown (present/absent/late counts per weekday, last 7 days)
    const dayBuckets: Record<string, { present: number; absent: number; late: number }> = {};
    attRecords.forEach((r: any) => {
      const label = new Date(r.date).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
      if (!dayBuckets[label]) dayBuckets[label] = { present: 0, absent: 0, late: 0 };
      if (r.status === "absent") dayBuckets[label].absent++;
      else {
        dayBuckets[label].present++;
        if (r.status === "late") dayBuckets[label].late++;
      }
    });
    const weekOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    setAttendanceData(weekOrder.filter((d) => dayBuckets[d]).map((d) => ({ day: d, ...dayBuckets[d] })));

    // Hiring vs termination trend (last 5 months, from real join dates / offboarding requests)
    const monthsBack = 5;
    const now = new Date();
    const offList = offData || [];
    const monthBuckets = Array.from({ length: monthsBack }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("en-US", { month: "short" }) };
    });
    setHiringTrend(monthBuckets.map(({ year, month, label }) => ({
      month: label,
      hires: (e || []).filter((emp: any) => {
        if (!emp.join_date) return false;
        const jd = new Date(emp.join_date);
        return jd.getFullYear() === year && jd.getMonth() === month;
      }).length,
      terminations: offList.filter((o: any) => {
        const dateStr = o.last_day || o.created_at;
        if (!dateStr) return false;
        const td = new Date(dateStr);
        return td.getFullYear() === year && td.getMonth() === month;
      }).length,
    })));

    const empList = e || [];
    const active = empList.filter((x: any) => x.status === "active").length;
    const depts = empList.reduce((acc: Record<string, number>, x: any) => {
      acc[x.department] = (acc[x.department] || 0) + 1;
      return acc;
    }, {});

    const payList = pr || [];
    const totalPay = payList.reduce((sum: number, p: any) => sum + Number(p.net_pay || 0), 0);

    const candList = c || [];
    const hiredCount = candList.filter((x: any) => x.stage === "hired").length;

    setStats({
      branches: b?.length || 0,
      employees: empList.length,
      activeEmployees: active,
      onboardingPending: (ob || []).length,
      leavePending: (lr || []).filter((x: any) => x.status === "pending").length,
      payrollProcessed: payList.filter((p: any) => p.status === "processed").length,
      payrollTotal: totalPay,
      openJobs: (j || []).filter((x: any) => x.status === "active").length,
      totalCandidates: candList.length,
      hiredThisMonth: hiredCount,
      notificationsUnread: nt?.length || 0,
    });

    setEmployees(empList);
    setOnboarding(ob || []);
    setLeaveRequests(lr || []);
    setPayroll(payList);
    setNotifications(nt || []);
    setJobs(j || []);
    setCandidates(candList);
    setDeptData(depts);
    setLastUpdated(new Date());
    setLoading(false);
  };

  // Initial load + real-time subscriptions
  useEffect(() => {
    loadAllData();

    // Subscribe to changes across all tables
    const channels = [
      supabase.channel("dash-employees").on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => loadAllData()).subscribe(),
      supabase.channel("dash-candidates").on("postgres_changes", { event: "*", schema: "public", table: "candidates" }, () => loadAllData()).subscribe(),
      supabase.channel("dash-jobs").on("postgres_changes", { event: "*", schema: "public", table: "job_postings" }, () => loadAllData()).subscribe(),
      supabase.channel("dash-leave").on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, () => loadAllData()).subscribe(),
      supabase.channel("dash-payroll").on("postgres_changes", { event: "*", schema: "public", table: "payroll_records" }, () => loadAllData()).subscribe(),
      supabase.channel("dash-onboarding").on("postgres_changes", { event: "*", schema: "public", table: "onboarding_requests" }, () => loadAllData()).subscribe(),
      supabase.channel("dash-branches").on("postgres_changes", { event: "*", schema: "public", table: "branches" }, () => loadAllData()).subscribe(),
      supabase.channel("dash-notifications").on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => loadAllData()).subscribe(),
      supabase.channel("dash-announcements").on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => loadAllData()).subscribe(),
      supabase.channel("dash-attendance").on("postgres_changes", { event: "*", schema: "public", table: "attendance_records" }, () => loadAllData()).subscribe(),
      supabase.channel("dash-training").on("postgres_changes", { event: "*", schema: "public", table: "training_enrollments" }, () => loadAllData()).subscribe(),
      supabase.channel("dash-disciplinary").on("postgres_changes", { event: "*", schema: "public", table: "disciplinary_records" }, () => loadAllData()).subscribe(),
    ];

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setFabOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const pieData = Object.entries(deptData ?? {}).map(([name, value]) => ({ name, value }));
  const currentMonthLabel = new Date().toLocaleDateString("en-US", { month: "long" });

  const showLeave = can("leave");
  const showPayroll = can("payroll");
  const showHrInsights = can("attendance") || can("training") || can("disciplinary");
  const showAnalyticsCharts = can("analytics");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Pull-to-refresh indicator */}
      {isPulling && pullDistance > 10 && (
        <div
          className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-[#253C7D] text-white transition-all"
          style={{ height: `${Math.min(pullDistance, PULL_THRESHOLD)}px` }}
        >
          <i className={`ri-refresh-line text-lg ${pullDistance >= PULL_THRESHOLD ? "animate-spin" : ""}`} />
          <span className="text-xs ml-2">{pullDistance >= PULL_THRESHOLD ? "Release to refresh" : "Pull to refresh"}</span>
        </div>
      )}

      {/* Live Status Bar */}
      <div
        className="bg-[#1A1A1A] text-white px-6 lg:px-10 py-2 flex items-center justify-between"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="hidden sm:inline">Live Dashboard — data updates in real-time</span>
          <span className="sm:hidden">Live</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[11px] text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/10 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            title="Refresh dashboard"
          >
            <i className={`ri-refresh-line ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#253C7D] via-[#29ABE2] to-[#74C8EC] text-white">
        <div className="px-6 lg:px-10 pt-6 pb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mt-4">
            HR / Command / Center
          </h1>
          <div className="flex gap-8 mt-10">
            <div>
              <p className="text-2xl md:text-3xl font-bold">{stats.branches}</p>
              <p className="text-sm text-white/70 mt-1">Active Branches</p>
            </div>
            <div className="relative -top-3">
              <p className="text-2xl md:text-3xl font-bold">{stats.notificationsUnread}</p>
              <p className="text-sm text-white/70 mt-1">Alerts</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold">{stats.activeEmployees}</p>
              <p className="text-sm text-white/70 mt-1">Active Employees</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats Grid */}
      <section className="bg-[#F5F5F0] px-6 lg:px-10 py-10 md:py-14">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Real-time Metrics</p>
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] mb-8 md:mb-10">Workforce / Analytics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Employees", value: stats.employees.toLocaleString(), icon: "ri-user-3-line", color: "text-[#253C7D]", link: "/employees", module: "employees" },
            { label: "Active Now", value: stats.activeEmployees.toLocaleString(), icon: "ri-user-follow-line", color: "text-emerald-600", link: "/employees", module: "employees" },
            { label: "Open Roles", value: stats.openJobs.toString(), icon: "ri-briefcase-line", color: "text-blue-600", link: "/hire", module: "hire" },
            { label: "Pending Leaves", value: stats.leavePending.toString(), icon: "ri-time-line", color: "text-amber-600", link: "/leave", module: "leave" },
            { label: "Onboarding", value: stats.onboardingPending.toString(), icon: "ri-user-add-line", color: "text-violet-600", link: "/onboarding", module: "onboarding" },
            { label: "Candidates", value: stats.totalCandidates.toString(), icon: "ri-team-line", color: "text-rose-600", link: "/hire", module: "hire" },
            { label: `Payroll (${currentMonthLabel.slice(0, 3)})`, value: `$${(stats.payrollTotal / 1000).toFixed(1)}k`, icon: "ri-money-dollar-circle-line", color: "text-teal-600", link: "/payroll-module", module: "payroll" },
            { label: "Processed", value: `${stats.payrollProcessed}`, icon: "ri-check-double-line", color: "text-green-600", link: "/payroll-module", module: "payroll" },
          ].filter((s) => can(s.module)).map((s) => (
            <Link
              key={s.label}
              to={s.link}
              className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 hover:border-[#253C7D]/20 hover:shadow-sm transition-all group"
            >
              <i className={`${s.icon} ${s.color} text-xl w-8 h-8 flex items-center justify-center mb-3`} />
              <p className="text-xl font-bold text-gray-900 group-hover:text-[#253C7D] transition-colors">{s.value}</p>
              <p className="text-[11px] text-gray-500 mt-1">{s.label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Onboarding Pipeline */}
      {can("onboarding") && (
        <section className="bg-white px-6 lg:px-10 py-10 md:py-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Onboarding Pipeline</h2>
            <span className="text-[13px] text-gray-500">{onboarding.length} pending approvals</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {onboarding.length > 0 ? onboarding.map((o) => (
              <Link
                to="/onboarding"
                key={o.id}
                className="min-w-[220px] rounded-2xl p-5 bg-gradient-to-br from-[#253C7D] to-[#29ABE2] text-white relative overflow-hidden hover:shadow-md transition-shadow"
              >
                <span className="absolute top-4 right-4 bg-white/20 backdrop-blur text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  Day {o.day_count}
                </span>
                <div className="mt-8">
                  <p className="text-base font-semibold">{o.employees?.first_name} {o.employees?.last_name}</p>
                  <p className="text-[13px] text-white/80 mt-1">{o.employees?.role || "New Hire"}</p>
                  <p className="text-[11px] text-white/60 mt-3 capitalize">Stage: {o.stage.replace("_", " ")}</p>
                </div>
              </Link>
            )) : (
              <div className="min-w-[220px] rounded-2xl p-5 bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-gray-400 text-center">
                <i className="ri-user-add-line text-2xl mb-2" />
                <p className="text-[13px] font-medium">No pending onboarding</p>
              </div>
            )}
            <Link
              to="/onboarding"
              className="min-w-[220px] rounded-2xl p-5 bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-[#253C7D] hover:text-[#253C7D] transition-colors"
            >
              <i className="ri-add-line text-3xl mb-2" />
              <span className="text-[13px] font-medium">View All</span>
            </Link>
          </div>
        </section>
      )}

      {/* Pending Actions + Payroll Split */}
      {(showLeave || showPayroll) && (
        <section className="bg-white px-6 lg:px-10 py-10 md:py-14">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Pending Actions / Leave */}
            {showLeave && (
              <div className={showPayroll ? "lg:w-[55%]" : "lg:w-full"}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-[#1A1A1A]" />
                  <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Pending Actions</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-6">Leave Requests</h2>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  {/* Desktop table header */}
                  <div className="hidden sm:grid grid-cols-4 bg-gray-50 px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    <span>Employee</span>
                    <span>Type</span>
                    <span>Dates</span>
                    <span>Status</span>
                  </div>
                  {leaveRequests.map((l) => (
                    <Fragment key={l.id}>
                      {/* Desktop row */}
                      <div key={`desk-${l.id}`} className="hidden sm:grid grid-cols-4 px-4 py-3 border-t border-gray-50 text-[13px]">
                        <span className="text-gray-900 font-medium">
                          {l.employees ? `${l.employees.first_name} ${l.employees.last_name}` : "Unknown"}
                        </span>
                        <span className="text-gray-600 capitalize">{l.leave_type}</span>
                        <span className="text-gray-500">
                          {l.start_date?.slice(5)} - {l.end_date?.slice(5)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${ l.status === "approved" ? "bg-green-500" : l.status === "pending" ? "bg-amber-500" : "bg-red-500" }`} />
                          <span className="text-gray-600 capitalize">{l.status}</span>
                        </span>
                      </div>
                      {/* Mobile card */}
                      <div key={`mob-${l.id}`} className="sm:hidden flex items-center justify-between px-4 py-3 border-t border-gray-50">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 truncate">
                            {l.employees ? `${l.employees.first_name} ${l.employees.last_name}` : "Unknown"}
                          </p>
                          <p className="text-[11px] text-gray-500 capitalize mt-0.5">
                            {l.leave_type} &middot; {l.start_date?.slice(5)} – {l.end_date?.slice(5)}
                          </p>
                        </div>
                        <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize ml-2 ${
                          l.status === "approved" ? "bg-green-100 text-green-700" : l.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        }`}>
                          {l.status}
                        </span>
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-[13px] font-semibold text-gray-900">Auto-Approval</span>
                  <span className="flex items-center gap-1 text-[11px] text-green-600 font-medium">
                    <i className="ri-checkbox-circle-fill text-green-500" />
                    Verified
                  </span>
                </div>
              </div>
            )}

            {/* Right: Payroll Overview */}
            {showPayroll && (
              <div className={showLeave ? "lg:w-[45%]" : "lg:w-full"}>
                <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-6">{currentMonthLabel} Payroll</h2>
                <div className="border border-gray-100 rounded-xl p-5 md:p-6 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[13px] text-gray-500">Total Net Pay</span>
                    <span className="text-lg font-bold text-gray-900">
                      ${(stats.payrollTotal / 1000).toFixed(1)}k
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[13px] text-gray-500">Processed</span>
                    <span className="text-[13px] font-semibold text-gray-900">
                      {stats.payrollProcessed} / {payroll.length} employees
                    </span>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={payroll.map((p, i) => ({ name: `E${i + 1}`, net: Number(p.net_pay / 1000).toFixed(1), status: p.status }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}k`} />
                        <Tooltip
                          contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                          formatter={(value: any) => [`$${value}k`, "Net Pay"]}
                        />
                        <Bar dataKey="net" fill="#253C7D" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Hiring Overview */}
      {can("hire") && (
        <section className="bg-[#FAFAF8] px-6 lg:px-10 py-10 md:py-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Recruitment</p>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Hiring Overview</h2>
            </div>
            <Link to="/hire" className="text-[13px] text-[#253C7D] font-semibold hover:underline">
              View All <i className="ri-arrow-right-line" />
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Open Positions</h3>
              <div className="space-y-3">
                {jobs.filter((j) => j.status === "active").slice(0, 5).map((j) => (
                  <Link to="/hire" key={j.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">{j.title}</p>
                      <p className="text-[11px] text-gray-500">{j.department} &middot; {j.location}</p>
                    </div>
                    <span className="text-[11px] text-[#253C7D] font-medium">${j.salary_min?.toLocaleString()}k+</span>
                  </Link>
                ))}
                {jobs.filter((j) => j.status === "active").length === 0 && (
                  <p className="text-[13px] text-gray-400 text-center py-4">No open positions</p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Recent Applicants</h3>
              <div className="space-y-3">
                {candidates.slice(0, 5).map((c) => (
                  <Link to={`/hire/candidate/${c.id}`} key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] font-bold text-xs">
                      {c.full_name?.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{c.full_name}</p>
                      <p className="text-[11px] text-gray-500">{c.stage} &middot; {new Date(c.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                  </Link>
                ))}
                {candidates.length === 0 && (
                  <p className="text-[13px] text-gray-400 text-center py-4">No applicants yet</p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Hiring Funnel</h3>
              <div className="space-y-2">
                {[
                  { stage: "Applied", count: candidates.filter((c) => c.stage === "applied").length, color: "bg-gray-200" },
                  { stage: "Screening", count: candidates.filter((c) => c.stage === "screening").length, color: "bg-amber-200" },
                  { stage: "Interview", count: candidates.filter((c) => c.stage === "interview").length, color: "bg-blue-200" },
                  { stage: "Offer", count: candidates.filter((c) => c.stage === "offer").length, color: "bg-emerald-200" },
                  { stage: "Hired", count: candidates.filter((c) => c.stage === "hired").length, color: "bg-[#253C7D]" },
                ].map((f) => (
                  <div key={f.stage} className="flex items-center gap-3">
                    <span className="text-[12px] text-gray-500 w-20">{f.stage}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${f.color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max((f.count / Math.max(candidates.length, 1)) * 100, 8)}%` }}
                      />
                    </div>
                    <span className="text-[12px] font-semibold text-gray-700 w-8 text-right">{f.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Announcements Section */}
      {can("announcements") && (
        <section className="bg-white px-6 lg:px-10 py-10 md:py-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Company</p>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Latest Announcements</h2>
            </div>
            <Link to="/announcements" className="text-[13px] text-[#253C7D] font-semibold hover:underline">
              View All <i className="ri-arrow-right-line" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.slice(0, 4).map((a) => {
              const catColors: Record<string, string> = { event: "text-violet-600 bg-violet-50", policy: "text-amber-600 bg-amber-50", news: "text-emerald-600 bg-emerald-50", benefits: "text-sky-600 bg-sky-50", compliance: "text-red-600 bg-red-50", hr: "text-[#253C7D] bg-[#253C7D]/10", general: "text-gray-600 bg-gray-100" };
              const catIcons: Record<string, string> = { event: "ri-calendar-event-line", policy: "ri-file-text-line", news: "ri-newspaper-line", benefits: "ri-heart-pulse-line", compliance: "ri-shield-check-line", hr: "ri-user-settings-line", general: "ri-information-line" };
              const colClass = catColors[a.category] || catColors.general;
              const iconClass = catIcons[a.category] || catIcons.general;
              const daysAgo = Math.floor((Date.now() - new Date(a.published_at).getTime()) / 86400000);
              return (
                <Link to="/announcements" key={a.id} className="flex gap-3 p-4 border border-gray-100 rounded-xl hover:border-[#253C7D]/20 transition-all">
                  <div className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-lg ${colClass}`}>
                    <i className={`${iconClass} text-sm`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-semibold text-gray-900 leading-tight line-clamp-1">{a.title}</p>
                      {a.pinned && <i className="ri-pushpin-line text-[#253C7D] text-xs shrink-0 mt-0.5" />}
                    </div>
                    <p className="text-[12px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{a.content}</p>
                    <p className="text-[11px] text-gray-400 mt-2">{daysAgo === 0 ? "Today" : `${daysAgo}d ago`} &middot; {a.author_name}</p>
                  </div>
                </Link>
              );
            })}
            {announcements.length === 0 && (
              <div className="col-span-2 text-center py-8 border border-dashed border-gray-200 rounded-xl">
                <p className="text-[13px] text-gray-400">No announcements yet</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* HR Analytics KPI Widgets */}
      {showHrInsights && (
        <section className="bg-[#F5F5F0] px-6 lg:px-10 py-10 md:py-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Live Intelligence</p>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">HR Analytics KPIs</h2>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-gray-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#253C7D] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#253C7D]" />
              </span>
              Last 7 days
            </div>
          </div>

          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {[
              { label: "Attendance Rate", value: `${hrKpis.attendanceRate}%`, icon: "ri-user-follow-line", color: "text-emerald-600", bg: "bg-emerald-50", link: "/attendance", module: "attendance", note: "Last 7 days" },
              { label: "Avg Hours/Day", value: `${hrKpis.avgHoursWorked}h`, icon: "ri-timer-2-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", link: "/attendance", module: "attendance", note: "Per employee" },
              { label: "Late Arrival Rate", value: `${hrKpis.lateRate}%`, icon: "ri-time-line", color: hrKpis.lateRate > 15 ? "text-red-600" : "text-amber-600", bg: hrKpis.lateRate > 15 ? "bg-red-50" : "bg-amber-50", link: "/attendance", module: "attendance", note: "Of check-ins" },
              { label: "Training Completion", value: `${hrKpis.trainingCompletionRate}%`, icon: "ri-graduation-cap-line", color: "text-violet-600", bg: "bg-violet-50", link: "/training", module: "training", note: "All enrollments" },
              { label: "Active Trainings", value: hrKpis.inProgressTrainings.toString(), icon: "ri-book-open-line", color: "text-sky-600", bg: "bg-sky-50", link: "/training", module: "training", note: "In progress" },
              { label: "Open Cases", value: hrKpis.openDisciplinaryCases.toString(), icon: "ri-alert-line", color: hrKpis.openDisciplinaryCases > 3 ? "text-red-600" : "text-orange-600", bg: hrKpis.openDisciplinaryCases > 3 ? "bg-red-50" : "bg-orange-50", link: "/disciplinary", module: "disciplinary", note: "Disciplinary" },
            ].filter((kpi) => can(kpi.module)).map((kpi) => (
              <Link key={kpi.label} to={kpi.link} className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-[#253C7D]/20 transition-all group">
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg mb-2.5 ${kpi.bg}`}>
                  <i className={`${kpi.icon} ${kpi.color} text-sm`} />
                </div>
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[11px] font-semibold text-gray-700 mt-1 leading-tight">{kpi.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{kpi.note}</p>
              </Link>
            ))}
          </div>

          {/* Attendance Trend Sparkline */}
          {can("attendance") && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-semibold text-gray-900">7-Day Attendance Trend</h3>
                <Link to="/attendance" className="text-[12px] text-[#253C7D] font-semibold hover:underline">Full Report <i className="ri-arrow-right-line" /></Link>
              </div>
              <div className="flex items-end gap-2 h-20">
                {hrKpis.attendanceTrend.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center" style={{ height: "56px" }}>
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          d.rate >= 85 ? "bg-emerald-400" : d.rate >= 70 ? "bg-amber-400" : "bg-red-400"
                        }`}
                        style={{ height: `${Math.max(8, d.rate * 0.56)}px` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400">{d.day}</span>
                    <span className={`text-[10px] font-bold ${
                      d.rate >= 85 ? "text-emerald-600" : d.rate >= 70 ? "text-amber-600" : "text-red-500"
                    }`}>{d.rate > 0 ? `${d.rate}%` : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Notifications Banner */}
      {can("notifications") && (
        <section className="bg-[#F5F5F0] px-6 lg:px-10 py-10 md:py-14 text-center">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-4">System Notice</p>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            All {stats.branches} branches are now synchronized under the unified payroll engine. Please review branch exceptions before monthly close.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            {notifications.map((n) => (
              <div key={n.id} className="bg-white border border-gray-100 rounded-lg px-4 py-3 text-left max-w-xs">
                <p className="text-[12px] font-semibold text-gray-900">{n.title}</p>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{n.message}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Analytics Charts */}
      {showAnalyticsCharts && (
        <section className="bg-white px-6 lg:px-10 py-10 md:py-14">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-6">Analytics Charts</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Attendance */}
            <div className="border border-gray-100 rounded-xl p-5 md:p-6">
              <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Weekly Attendance Overview</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceData}>
                    <defs>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#253C7D" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#253C7D" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E11D48" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#E11D48" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                    <Area type="monotone" dataKey="present" stroke="#253C7D" fill="url(#colorPresent)" strokeWidth={2} />
                    <Area type="monotone" dataKey="absent" stroke="#E11D48" fill="url(#colorAbsent)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Distribution */}
            <div className="border border-gray-100 rounded-xl p-5 md:p-6">
              <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Department Distribution</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                    <span className="text-[11px] text-gray-600">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hiring Trend */}
            <div className="border border-gray-100 rounded-xl p-5 md:p-6 lg:col-span-2">
              <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Hiring vs Termination Trend</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hiringTrend} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                    <Bar dataKey="hires" fill="#253C7D" radius={[4, 4, 0, 0]} name="Hires" />
                    <Bar dataKey="terminations" fill="#E11D48" radius={[4, 4, 0, 0]} name="Terminations" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Action Shortcuts */}
      <section className="bg-white px-6 lg:px-10 py-10 md:py-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Administrative Actions</h2>
          <p className="text-[13px] text-gray-500 mt-2">Quick access to core HR modules and operations</p>
        </div>
        {can("payroll") && (
          <div className="flex justify-center mb-8">
            <Link
              to="/payroll-module"
              className="inline-flex items-center gap-2 bg-[#3D2B1F] text-white px-6 py-3 rounded-full text-[13px] font-semibold hover:bg-[#2a1d15] transition-colors"
            >
              Process Payroll
              <i className="ri-arrow-right-line" />
            </Link>
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          {ADMIN_ACTIONS.filter((item) => can(item.module)).map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="flex flex-col items-center gap-2 bg-gray-50 hover:bg-[#253C7D]/5 border border-gray-100 hover:border-[#253C7D]/20 rounded-xl px-5 py-4 w-[100px] transition-colors group"
            >
              <i className={`${item.icon} text-lg text-gray-600 group-hover:text-[#253C7D] w-6 h-6 flex items-center justify-center transition-colors`} />
              <span className="text-[11px] font-medium text-gray-600 group-hover:text-[#253C7D] transition-colors whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Mobile FAB — Quick Actions */}
      <div className="lg:hidden fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2" ref={fabRef}>
        {/* Action list */}
        {fabOpen && (
          <div className="flex flex-col items-end gap-2 mb-1">
            {QUICK_ACTIONS.filter((action) => can(action.module)).map((action) => (
              <button
                key={action.label}
                onClick={() => { setFabOpen(false); navigate(action.path); }}
                className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 cursor-pointer"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
              >
                <div className="flex flex-col items-start">
                  <span className="text-[13px] font-semibold text-gray-900 whitespace-nowrap">{action.label}</span>
                  <span className="text-[11px] text-gray-400">{action.note}</span>
                </div>
                <div className={`w-9 h-9 rounded-xl ${action.color} flex items-center justify-center shrink-0`}>
                  <i className={`${action.icon} text-white text-base w-5 h-5 flex items-center justify-center`} />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* FAB trigger */}
        <button
          onClick={() => setFabOpen((v) => !v)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all duration-200 active:scale-95 ${
            fabOpen ? "bg-gray-800 rotate-45" : "bg-[#253C7D]"
          }`}
          style={{ boxShadow: "0 6px 24px rgba(13,115,119,0.4)" }}
          aria-label="Quick actions"
        >
          <i className={`${fabOpen ? "ri-close-line" : "ri-add-line"} text-2xl w-6 h-6 flex items-center justify-center`} />
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-[#F5F5F0] border-t border-gray-200/50 px-6 lg:px-10 py-10 md:py-14">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="lg:w-[40%]">
            <h3 className="text-2xl font-bold text-[#1A1A1A] leading-tight">
              HR Management /<br />System
            </h3>
            <p className="text-[13px] text-gray-500 mt-4 leading-relaxed max-w-sm">
              A unified platform for managing human resources across all {stats.branches} branches. Streamline onboarding, payroll, leave, and workforce analytics in one place.
            </p>
            <div className="mt-6">
              <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Support Email</label>
              <input
                type="email"
                placeholder="support@hrmops.com"
                className="mt-1 w-full max-w-xs bg-transparent border-b border-gray-300 py-2 text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            <button className="mt-6 inline-flex items-center gap-2 border border-gray-300 rounded-lg px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:border-gray-400 transition-colors">
              Contact Support
            </button>
          </div>
          <div className="lg:w-[60%] grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Operations</p>
              <div className="space-y-2">
                {can("payroll") && <Link to="/payroll-module" className="block text-[13px] text-gray-600 hover:text-gray-900">Payroll</Link>}
                {can("finance") && <Link to="/finance" className="block text-[13px] text-gray-600 hover:text-gray-900">Finance</Link>}
                {can("it-management") && <Link to="/it-management" className="block text-[13px] text-gray-600 hover:text-gray-900">IT Management</Link>}
                {can("analytics") && <Link to="/analytics" className="block text-[13px] text-gray-600 hover:text-gray-900">Analytics</Link>}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Workforce</p>
              <div className="space-y-2">
                {can("hire") && <Link to="/hire" className="block text-[13px] text-gray-600 hover:text-gray-900">Hire</Link>}
                {can("offboard") && <Link to="/offboard" className="block text-[13px] text-gray-600 hover:text-gray-900">Off Board</Link>}
                {can("org-chart") && <Link to="/org-chart" className="block text-[13px] text-gray-600 hover:text-gray-900">Org Chart</Link>}
                {can("tools") && <Link to="/tools" className="block text-[13px] text-gray-600 hover:text-gray-900">Tools</Link>}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">System</p>
              <div className="space-y-2">
                {can("benefits") && <Link to="/benefits" className="block text-[13px] text-gray-600 hover:text-gray-900">Benefits</Link>}
                {can("settings") && <Link to="/settings" className="block text-[13px] text-gray-600 hover:text-gray-900">Settings</Link>}
                {can("unity-apps") && <Link to="/unity-apps" className="block text-[13px] text-gray-600 hover:text-gray-900">Unity Apps</Link>}
                <Link to="/" className="block text-[13px] text-gray-600 hover:text-gray-900">Help Center</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-gray-200/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-gray-400">2026 HRM_OPS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/settings" className="text-[11px] text-gray-500 hover:text-gray-700">Privacy</Link>
            <Link to="/settings" className="text-[11px] text-gray-500 hover:text-gray-700">Terms</Link>
            <Link to="/settings" className="text-[11px] text-gray-500 hover:text-gray-700">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
