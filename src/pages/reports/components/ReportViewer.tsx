import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";

interface ReportConfig {
  module: string;
  dateFrom: string;
  dateTo: string;
  employeeSearch?: string;
  departmentFilter?: string;
  branchFilter?: string;
}

interface LeaveRow {
  id: string;
  employee: string;
  department: string;
  branch: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
}

interface PayrollRow {
  id: string;
  employee: string;
  department: string;
  branch: string;
  month: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  net_pay: number;
  status: string;
}

interface HeadcountRow {
  branch: string;
  department: string;
  employee_count: number;
  active: number;
  onboarding: number;
}

interface ExpenseRow {
  id: string;
  description: string;
  category: string;
  amount: number;
  submitted_by: string;
  status: string;
  date: string;
}

interface HireRow {
  id: string;
  name: string;
  position: string;
  stage: string;
  status: string;
  applied_date: string;
}

interface DailyLogRow {
  id: string;
  employee: string;
  department: string;
  branch: string;
  date: string;
  time: string;
  activity: string;
  notes: string;
}

interface RoomBookingRow {
  id: string;
  room_name: string;
  title: string;
  employee: string;
  department: string;
  branch: string;
  date: string;
  time: string;
  attendees: number;
  status: string;
}

interface OnboardingRow {
  id: string;
  employee: string;
  role: string;
  department: string;
  branch: string;
  stage: string;
  status: string;
  verified_docs: string;
  requested_by: string;
  started_date: string;
}

interface OnboardingTaskRow {
  id: string;
  task_name: string;
  candidate: string;
  employee?: string;
  department: string;
  branch: string;
  category: string;
  priority: string;
  assigned_to: string;
  due_date: string;
  status: string;
  completed_by: string;
  completed_at: string;
  verified_at: string;
}

type ReportRow =
  | LeaveRow
  | PayrollRow
  | HeadcountRow
  | ExpenseRow
  | HireRow
  | DailyLogRow
  | RoomBookingRow
  | OnboardingRow
  | OnboardingTaskRow;

const matchesEmployeeFilters = (
  row: { employee?: string; department?: string; branch?: string },
  config: ReportConfig
) => {
  if (config.employeeSearch && !row.employee?.toLowerCase().includes(config.employeeSearch.toLowerCase())) return false;
  if (config.departmentFilter && row.department !== config.departmentFilter) return false;
  if (config.branchFilter && row.branch !== config.branchFilter) return false;
  return true;
};

interface Props {
  config: ReportConfig;
  onDataReady: (rows: ReportRow[], columns: string[]) => void;
}

const STATUS_COLOR: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
  pending: "bg-amber-50 text-amber-700 border border-amber-200/60",
  rejected: "bg-red-50 text-red-700 border border-red-200/60",
  cancelled: "bg-gray-100 text-gray-600 border border-gray-200/60",
  paid: "bg-emerald-50 text-emerald-700",
  processed: "bg-sky-50 text-sky-700",
  active: "bg-emerald-50 text-emerald-700",
  open: "bg-amber-50 text-amber-700",
  hired: "bg-emerald-50 text-emerald-700",
  interview: "bg-sky-50 text-sky-700",
  screening: "bg-violet-50 text-violet-700",
  document: "bg-amber-50 text-amber-700 border border-amber-200/60",
  it_setup: "bg-blue-50 text-blue-700 border border-blue-200/60",
  training: "bg-purple-50 text-purple-700 border border-purple-200/60",
  complete: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
};

export default function ReportViewer({ config, onDataReady }: Props) {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Record<string, string | number>>({});
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const pageWindow = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };

  // Reset page when data changes
  useEffect(() => { setPage(1); }, [rows]);

  const fetchLeave = useCallback(async () => {
    let q = supabase
      .from("leave_requests")
      .select("id, leave_type, start_date, end_date, days, status, employees(first_name, last_name, department, branches(name))")
      .order("created_at", { ascending: false });
    // Overlap, not containment: a leave request that starts before the
    // window and ends inside it (or vice versa) still belongs in the report.
    if (config.dateFrom) q = q.gte("end_date", config.dateFrom);
    if (config.dateTo) q = q.lte("start_date", config.dateTo);
    const { data } = await q;
    const mapped: LeaveRow[] = (data || [])
      .map((r: any) => ({
        id: r.id,
        employee: `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim(),
        department: r.employees?.department || "—",
        branch: r.employees?.branches?.name || "—",
        leave_type: r.leave_type,
        start_date: r.start_date,
        end_date: r.end_date,
        days: r.days,
        status: r.status,
      }))
      .filter((r) => matchesEmployeeFilters(r, config));
    const cols = ["Employee", "Department", "Type", "Start Date", "End Date", "Days", "Status"];
    setRows(mapped);
    setColumns(cols);
    const totalDays = mapped.reduce((s, r) => s + r.days, 0);
    const approved = mapped.filter((r) => r.status === "approved").length;
    setSummary({ "Total Requests": mapped.length, "Total Days": totalDays, Approved: approved, Pending: mapped.filter((r) => r.status === "pending").length });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchPayroll = useCallback(async () => {
    let q = supabase
      .from("payroll_records")
      .select("id, month, base_salary, bonus, deductions, net_pay, status, employees(first_name, last_name, department, branches(name))")
      .order("month", { ascending: false });
    if (config.dateFrom) q = q.gte("month", config.dateFrom.substring(0, 7));
    if (config.dateTo) q = q.lte("month", config.dateTo.substring(0, 7));
    const { data } = await q;
    const mapped: PayrollRow[] = (data || [])
      .map((r: any) => ({
        id: r.id,
        employee: `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim(),
        department: r.employees?.department || "—",
        branch: r.employees?.branches?.name || "—",
        month: r.month,
        base_salary: r.base_salary,
        bonus: r.bonus,
        deductions: r.deductions,
        net_pay: r.net_pay,
        status: r.status,
      }))
      .filter((r) => matchesEmployeeFilters(r, config));
    const cols = ["Employee", "Department", "Month", "Base Salary", "Bonus", "Deductions", "Net Pay", "Status"];
    setRows(mapped);
    setColumns(cols);
    const total = mapped.reduce((s, r) => s + Number(r.net_pay), 0);
    setSummary({ "Total Records": mapped.length, "Total Net Pay": `$${total.toLocaleString()}`, Paid: mapped.filter((r) => r.status === "paid").length, Pending: mapped.filter((r) => r.status === "pending").length });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchHeadcount = useCallback(async () => {
    const { data: emps } = await supabase
      .from("employees")
      .select("id, department, status, branches(name)");
    const map: Record<string, HeadcountRow> = {};
    (emps || []).forEach((e: any) => {
      const key = `${e.branches?.name || "Unassigned"}||${e.department || "General"}`;
      if (!map[key]) map[key] = { branch: e.branches?.name || "Unassigned", department: e.department || "General", employee_count: 0, active: 0, onboarding: 0 };
      map[key].employee_count++;
      if (e.status === "active") map[key].active++;
      if (e.status === "onboarding") map[key].onboarding++;
    });
    const mapped = Object.values(map)
      .filter((r) => (!config.departmentFilter || r.department === config.departmentFilter) && (!config.branchFilter || r.branch === config.branchFilter))
      .sort((a, b) => b.employee_count - a.employee_count);
    const cols = ["Branch", "Department", "Total Headcount", "Active", "Onboarding"];
    setRows(mapped);
    setColumns(cols);
    const total = mapped.reduce((s, r) => s + r.employee_count, 0);
    setSummary({ "Total Employees": total, Branches: new Set(mapped.map((r) => r.branch)).size, Departments: new Set(mapped.map((r) => r.department)).size });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchExpenses = useCallback(async () => {
    let q = supabase
      .from("expense_records")
      .select("id, description, category, amount, submitted_by, status, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (config.dateFrom) q = q.gte("created_at", config.dateFrom);
    if (config.dateTo) q = q.lte("created_at", config.dateTo + "T23:59:59");
    const { data } = await q;
    const mapped: ExpenseRow[] = (data || []).map((r: any) => ({
      id: r.id,
      description: r.description,
      category: r.category,
      amount: r.amount,
      submitted_by: r.submitted_by,
      status: r.status,
      date: r.created_at?.substring(0, 10) || "",
    }));
    const cols = ["Description", "Category", "Amount", "Submitted By", "Date", "Status"];
    setRows(mapped);
    setColumns(cols);
    const total = mapped.reduce((s, r) => s + Number(r.amount), 0);
    const paid = mapped.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);
    setSummary({ "Total Records": mapped.length, "Total Amount": `$${total.toLocaleString()}`, "Amount Paid": `$${paid.toLocaleString()}`, "Pending Approval": mapped.filter((r) => r.status === "pending").length });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchHire = useCallback(async () => {
    let q = supabase
      .from("candidates")
      .select("id, full_name, stage, applied_at, job_postings(title)")
      .is("deleted_at", null)
      .order("applied_at", { ascending: false });
    if (config.dateFrom) q = q.gte("applied_at", config.dateFrom);
    if (config.dateTo) q = q.lte("applied_at", config.dateTo + "T23:59:59");
    const { data } = await q;
    const mapped: HireRow[] = (data || []).map((r: any) => ({
      id: r.id,
      name: r.full_name || "",
      position: r.job_postings?.title || "—",
      stage: r.stage,
      status: r.stage,
      applied_date: r.applied_at?.substring(0, 10) || "",
    }));
    const cols = ["Candidate", "Position", "Stage", "Status", "Applied Date"];
    setRows(mapped);
    setColumns(cols);
    setSummary({ "Total Candidates": mapped.length, Hired: mapped.filter((r) => r.status === "hired").length, "In Progress": mapped.filter((r) => !["hired", "rejected"].includes(r.status)).length, Rejected: mapped.filter((r) => r.status === "rejected").length });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchDailyLogs = useCallback(async () => {
    let q = supabase
      .from("work_logs")
      .select("id, log_date, start_time, end_time, activity, notes, employees(first_name, last_name, department, branches(name))")
      .is("deleted_at", null)
      .order("log_date", { ascending: false });
    if (config.dateFrom) q = q.gte("log_date", config.dateFrom);
    if (config.dateTo) q = q.lte("log_date", config.dateTo);
    const { data } = await q;
    const fmt = (t: string | null) => (t ? new Date(`2000-01-01T${t}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "");
    const mapped: DailyLogRow[] = (data || [])
      .map((r: any) => ({
        id: r.id,
        employee: `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim(),
        department: r.employees?.department || "—",
        branch: r.employees?.branches?.name || "—",
        date: r.log_date,
        time: r.start_time || r.end_time ? `${fmt(r.start_time)} – ${fmt(r.end_time)}` : "—",
        activity: r.activity,
        notes: r.notes || "",
      }))
      .filter((r) => matchesEmployeeFilters(r, config));
    const cols = ["Employee", "Department", "Branch", "Date", "Time", "Activity", "Notes"];
    setRows(mapped);
    setColumns(cols);
    setSummary({
      "Total Entries": mapped.length,
      "Employees Logged": new Set(mapped.map((r) => r.employee)).size,
      "Date Range": mapped.length ? `${mapped[mapped.length - 1].date} → ${mapped[0].date}` : "—",
    });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchRoomBookings = useCallback(async () => {
    let q = supabase
      .from("room_bookings")
      .select("id, title, date, start_time, end_time, attendees_count, status, meeting_rooms(name, floor), employees:booked_by(first_name, last_name, department, branches(name))")
      .order("date", { ascending: false })
      .order("start_time", { ascending: false });
    if (config.dateFrom) q = q.gte("date", config.dateFrom);
    if (config.dateTo) q = q.lte("date", config.dateTo);
    const { data, error } = await q;
    if (error) {
      console.error("fetchRoomBookings error:", error);
    }
    const fmtTime = (t: string | null) => (t ? new Date(`2000-01-01T${t}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "");
    const mapped: RoomBookingRow[] = (data || [])
      .map((r: any) => {
        const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim();
        const roomFloor = r.meeting_rooms?.floor || (r.meeting_rooms?.name?.includes("VIP") ? 5 : 3);
        const roomDisplay = r.meeting_rooms?.name
          ? `${r.meeting_rooms.name} (Floor ${roomFloor})`
          : "—";
        return {
          id: r.id,
          room_name: roomDisplay,
          title: r.title,
          employee: empName || "Unknown",
          department: r.employees?.department || "—",
          branch: r.employees?.branches?.name || "—",
          date: r.date,
          time: r.start_time || r.end_time ? `${fmtTime(r.start_time)} – ${fmtTime(r.end_time)}` : "—",
          attendees: r.attendees_count || 1,
          status: r.status || "approved",
        };
      })
      .filter((r) => matchesEmployeeFilters(r, config));
    const cols = ["Room", "Title", "Booked By", "Department", "Branch", "Date", "Time", "Attendees", "Status"];
    setRows(mapped);
    setColumns(cols);
    const approved = mapped.filter((r) => r.status === "approved").length;
    const pending = mapped.filter((r) => r.status === "pending").length;
    const cancelled = mapped.filter((r) => r.status === "cancelled").length;
    const rejected = mapped.filter((r) => r.status === "rejected").length;
    setSummary({
      "Total Bookings": mapped.length,
      Approved: approved,
      Pending: pending,
      "Cancelled / Rejected": cancelled + rejected,
    });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchOnboarding = useCallback(async () => {
    let q = supabase
      .from("onboarding_requests")
      .select("id, stage, status, day_count, requested_by, created_at, employees(id, first_name, last_name, role, department, branches(name)), onboarding_documents(id, status)")
      .order("created_at", { ascending: false });

    if (config.dateFrom) q = q.gte("created_at", config.dateFrom);
    if (config.dateTo) q = q.lte("created_at", config.dateTo + "T23:59:59");

    const { data, error } = await q;
    if (error) console.error("fetchOnboarding error:", error);

    const STAGE_LABELS: Record<string, string> = {
      document: "Document Collection",
      it_setup: "IT & Equipment Setup",
      training: "Training & Orientation",
      complete: "Final Sign-off",
    };

    const mapped: OnboardingRow[] = (data || [])
      .map((r: any) => {
        const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim();
        const totalDocs = r.onboarding_documents?.length || 0;
        const verifiedDocs = (r.onboarding_documents || []).filter((d: any) => d.status === "complete").length;
        const docProgress = totalDocs > 0 ? `${verifiedDocs}/${totalDocs} verified` : "0 verified";

        return {
          id: r.id,
          employee: empName || "Unknown Candidate",
          role: r.employees?.role || "—",
          department: r.employees?.department || "—",
          branch: r.employees?.branches?.name || "—",
          stage: STAGE_LABELS[r.stage] || r.stage || "Document Collection",
          status: r.status || "pending",
          verified_docs: docProgress,
          requested_by: r.requested_by || "Admin",
          started_date: r.created_at?.substring(0, 10) || "—",
        };
      })
      .filter((r) => matchesEmployeeFilters(r, config));

    const cols = ["Employee", "Role", "Department", "Branch", "Stage", "Status", "Verified Docs", "Requested By", "Started Date"];
    setRows(mapped);
    setColumns(cols);

    const completed = mapped.filter((r) => r.status === "completed").length;
    const approved = mapped.filter((r) => r.status === "approved" || r.status === "in_progress").length;
    const pending = mapped.filter((r) => r.status === "pending").length;

    setSummary({
      "Total Onboarding": mapped.length,
      "Approved & Active": approved,
      "Completed / Graduated": completed,
      "Pending Approval": pending,
    });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchOnboardingTasks = useCallback(async () => {
    let q = supabase
      .from("onboarding_checklist_tasks")
      .select("id, task_name, description, category, priority, assigned_to, assigned_to_role, due_date, completed, completed_by, completed_at, sort_order, onboarding_requests(id, stage, status, employees(id, first_name, last_name, department, branches(name)))")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    if (config.dateFrom) q = q.gte("due_date", config.dateFrom);
    if (config.dateTo) q = q.lte("due_date", config.dateTo);

    const { data, error } = await q;
    if (error) console.error("fetchOnboardingTasks error:", error);

    const CATEGORY_LABELS: Record<string, string> = {
      documents: "Documents",
      it_setup: "IT Setup",
      training: "Training",
      general: "General & Culture",
    };

    const formatDateTime = (iso: string | null) => {
      if (!iso) return "—";
      try {
        const d = new Date(iso);
        return d.toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      } catch {
        return iso;
      }
    };

    const mapped: OnboardingTaskRow[] = (data || [])
      .map((r: any) => {
        const emp = r.onboarding_requests?.employees;
        const candidateName = emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "—";
        const isDone = Boolean(r.completed);

        return {
          id: r.id,
          task_name: r.task_name,
          candidate: candidateName,
          employee: candidateName,
          department: emp?.department || "—",
          branch: emp?.branches?.name || "—",
          category: CATEGORY_LABELS[r.category] || r.category || "General",
          priority: r.priority || "medium",
          assigned_to: r.assigned_to ? `${r.assigned_to}${r.assigned_to_role ? ` (${r.assigned_to_role})` : ""}` : "Unassigned",
          due_date: r.due_date || "No deadline",
          status: isDone ? "completed" : "pending",
          completed_by: r.completed_by || "—",
          completed_at: r.completed_at ? r.completed_at.substring(0, 10) : "—",
          verified_at: formatDateTime(r.completed_at),
        };
      })
      .filter((r) => matchesEmployeeFilters(r, config));

    const cols = ["Task Name", "Candidate", "Department", "Branch", "Category", "Priority", "Assigned To", "Due Date", "Status", "Verified By", "Verified Date & Time"];
    setRows(mapped);
    setColumns(cols);

    const todayStr = new Date().toISOString().substring(0, 10);
    const completedCount = mapped.filter((r) => r.status === "completed").length;
    const pendingCount = mapped.filter((r) => r.status === "pending").length;
    const overdueCount = mapped.filter((r) => r.status === "pending" && r.due_date !== "No deadline" && r.due_date < todayStr).length;

    setSummary({
      "Total Tasks": mapped.length,
      "Completed / Verified": completedCount,
      "Pending Tasks": pendingCount,
      "Overdue Tasks": overdueCount,
    });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  useEffect(() => {
    setLoading(true);
    const run = async () => {
      if (config.module === "leave") await fetchLeave();
      else if (config.module === "payroll") await fetchPayroll();
      else if (config.module === "headcount") await fetchHeadcount();
      else if (config.module === "expenses") await fetchExpenses();
      else if (config.module === "hire") await fetchHire();
      else if (config.module === "onboarding") await fetchOnboarding();
      else if (config.module === "onboarding-tasks") await fetchOnboardingTasks();
      else if (config.module === "daily-logs") await fetchDailyLogs();
      else if (config.module === "meeting-rooms") await fetchRoomBookings();
      setLoading(false);
    };
    run();
  }, [config, fetchLeave, fetchPayroll, fetchHeadcount, fetchExpenses, fetchHire, fetchOnboarding, fetchOnboardingTasks, fetchDailyLogs, fetchRoomBookings]);

  // Real-time live synchronization: re-fetches automatically when database records change
  useEffect(() => {
    const tableMap: Record<string, string> = {
      leave: "leave_requests",
      payroll: "payroll_records",
      headcount: "employees",
      expenses: "expense_records",
      hire: "candidates",
      onboarding: "onboarding_requests",
      "onboarding-tasks": "onboarding_checklist_tasks",
      "daily-logs": "work_logs",
      "meeting-rooms": "room_bookings",
    };
    const targetTable = tableMap[config.module];
    if (!targetTable) return;

    const channel = supabase
      .channel(`report_realtime_${config.module}`)
      .on("postgres_changes", { event: "*", schema: "public", table: targetTable }, () => {
        if (config.module === "leave") fetchLeave();
        else if (config.module === "payroll") fetchPayroll();
        else if (config.module === "headcount") fetchHeadcount();
        else if (config.module === "expenses") fetchExpenses();
        else if (config.module === "hire") fetchHire();
        else if (config.module === "onboarding") fetchOnboarding();
        else if (config.module === "onboarding-tasks") fetchOnboardingTasks();
        else if (config.module === "daily-logs") fetchDailyLogs();
        else if (config.module === "meeting-rooms") fetchRoomBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [config.module, fetchLeave, fetchPayroll, fetchHeadcount, fetchExpenses, fetchHire, fetchOnboarding, fetchOnboardingTasks, fetchDailyLogs, fetchRoomBookings]);

  const REPORT_COLUMN_KEY_MAP: Record<string, string> = {
    "Employee": "employee", "Department": "department", "Type": "leave_type", "Start Date": "start_date",
    "End Date": "end_date", "Days": "days", "Status": "status", "Month": "month",
    "Base Salary": "base_salary", "Bonus": "bonus", "Deductions": "deductions", "Net Pay": "net_pay",
    "Branch": "branch", "Total Headcount": "employee_count", "Active": "active", "Onboarding": "onboarding",
    "Description": "description", "Category": "category", "Amount": "amount", "Submitted By": "submitted_by",
    "Date": "date", "Candidate": "candidate", "Position": "position", "Stage": "stage", "Applied Date": "applied_date",
    "Room": "room_name", "Title": "title", "Booked By": "employee", "Attendees": "attendees", "Time": "time",
    "Role": "role", "Verified Docs": "verified_docs", "Requested By": "requested_by", "Started Date": "started_date",
    "Task Name": "task_name", "Priority": "priority", "Assigned To": "assigned_to", "Due Date": "due_date",
    "Verified By": "completed_by", "Verified Date & Time": "verified_at", "Verified At": "verified_at", "Completed Date": "completed_at",
  };

  const renderCell = (col: string, row: ReportRow) => {
    const key = REPORT_COLUMN_KEY_MAP[col] || col.toLowerCase().replace(/ /g, "_");
    const val = (row as any)[key] ?? "—";

    if (col === "Status" || col === "status") {
      return (
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_COLOR[String(val).toLowerCase()] || "bg-gray-100 text-gray-700"}`}>
          {String(val)}
        </span>
      );
    }
    if (col === "Priority") {
      const p = String(val).toLowerCase();
      const pBg =
        p === "high"
          ? "bg-red-50 text-red-700 border-red-200"
          : p === "medium"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";
      return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${pBg} uppercase`}>{String(val)}</span>;
    }
    if (col === "Stage" || col === "Category") {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800">{String(val)}</span>;
    }
    if (col === "Verified Docs") {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#253C7D] border border-blue-200">{String(val)}</span>;
    }
    if (col === "Verified Date & Time" || col === "Verified At") {
      return val && val !== "—" ? (
        <span className="text-[11px] text-slate-600 font-medium whitespace-nowrap">{String(val)}</span>
      ) : (
        <span className="text-slate-400 italic">—</span>
      );
    }
    if (col.includes("Salary") || col.includes("Pay") || col.includes("Bonus") || col.includes("Deduct") || col === "Amount") {
      return `$${Number(val || 0).toLocaleString()}`;
    }
    return String(val ?? "—");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div id="report-content">
      {/* Summary Cards */}
      {Object.keys(summary).length > 0 && (
        <div className={`grid gap-4 mb-6 grid-cols-2 lg:grid-cols-${Math.min(Object.keys(summary).length, 4)}`}>
          {Object.entries(summary).map(([k, v]) => (
            <div key={k} className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{k}</p>
              <p className="text-2xl font-bold text-gray-900">{v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-xl text-gray-400">
          <i className="ri-file-search-line text-3xl mb-2" />
          <p className="text-sm">No data found for selected filters</p>
        </div>
      ) : (() => {
        const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
        const safePage = Math.min(page, totalPages);
        const pageStart = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
        const pageEnd = Math.min(safePage * pageSize, rows.length);
        const pagedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
        return (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {columns.map((col) => (
                      <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      {columns.map((col) => (
                        <td key={col} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {renderCell(col, row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 10 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 mt-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-[11px] text-gray-500">
                    Showing <span className="font-semibold text-gray-700">{pageStart}</span>–<span className="font-semibold text-gray-700">{pageEnd}</span> of <span className="font-semibold text-gray-700">{rows.length}</span> records
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-400">Per page</span>
                    <select
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-[11px] bg-white text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
                    >
                      {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <i className="ri-arrow-left-s-line" />
                  </button>
                  {pageWindow(safePage, totalPages).map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-[11px] text-gray-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${p === safePage ? "bg-[#253C7D] text-white" : "text-gray-600 hover:bg-gray-100"}`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <i className="ri-arrow-right-s-line" />
                  </button>
                </div>
              </div>
            )}
          </>
        );
      })()
      }
      <p className="text-xs text-gray-400 mt-3 text-right">{rows.length} records</p>
    </div>
  );
}