import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";

interface ReportConfig {
  module: string;
  dateFrom: string;
  dateTo: string;
  employeeSearch?: string;
  departmentFilter?: string;
  branchFilter?: string;
  recordStatus?: "all" | "active" | "deleted";
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
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
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
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
}

interface HeadcountRow {
  branch: string;
  department: string;
  employee_count: number;
  active: number;
  onboarding: number;
  deleted_count: number;
}

interface ExpenseRow {
  id: string;
  description: string;
  category: string;
  amount: number;
  submitted_by: string;
  status: string;
  date: string;
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
}

interface HireRow {
  id: string;
  name: string;
  position: string;
  stage: string;
  status: string;
  applied_date: string;
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
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
  status?: string;
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
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
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
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
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
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
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
}

interface ShiftRow {
  id: string;
  shift_date: string;
  shift_name: string;
  employee: string;
  department: string;
  branch: string;
  time: string;
  hours: number;
  capacity: number;
  staffing: string;
  status: string;
  notes: string;
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
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
  | OnboardingTaskRow
  | ShiftRow;

const matchesEmployeeFilters = (
  row: { employee?: string; department?: string; branch?: string; deleted_at?: string | null; status?: string },
  config: ReportConfig
) => {
  if (config.recordStatus === "active" && (row.deleted_at || row.status === "deleted")) return false;
  if (config.recordStatus === "deleted" && !row.deleted_at && row.status !== "deleted") return false;
  if (config.employeeSearch && !row.employee?.toLowerCase().includes(config.employeeSearch.toLowerCase())) return false;
  if (config.departmentFilter && row.department !== config.departmentFilter) return false;
  if (config.branchFilter && row.branch !== config.branchFilter) return false;
  return true;
};

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
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

interface Props {
  config: ReportConfig;
  onDataReady: (rows: ReportRow[], columns: string[]) => void;
}

const STATUS_COLOR: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
  pending: "bg-amber-50 text-amber-700 border border-amber-200/70",
  rejected: "bg-red-50 text-red-700 border border-red-200/70",
  cancelled: "bg-gray-100 text-gray-600 border border-gray-200/70",
  paid: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
  processed: "bg-sky-50 text-sky-700 border border-sky-200/70",
  active: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
  open: "bg-amber-50 text-amber-700 border border-amber-200/70",
  scheduled: "bg-blue-50 text-blue-700 border border-blue-200/70",
  filled: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
  hired: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
  interview: "bg-sky-50 text-sky-700 border border-sky-200/70",
  screening: "bg-violet-50 text-violet-700 border border-violet-200/70",
  document: "bg-amber-50 text-amber-700 border border-amber-200/70",
  it_setup: "bg-blue-50 text-blue-700 border border-blue-200/70",
  training: "bg-purple-50 text-purple-700 border border-purple-200/70",
  complete: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
  deleted: "bg-rose-50 text-rose-700 border border-rose-300 font-bold",
};

export default function ReportViewer({ config, onDataReady }: Props) {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Record<string, string | number>>({});
  const [pageSize, setPageSize] = useState<number | "all">(25);
  const [page, setPage] = useState(1);
  const [inTableSearch, setInTableSearch] = useState("");
  const [density, setDensity] = useState<"comfortable" | "compact">("compact");

  // In-table real-time instant search across all row values
  const displayRows = useMemo(() => {
    if (!inTableSearch.trim()) return rows;
    const q = inTableSearch.toLowerCase().trim();
    return rows.filter((r) =>
      Object.values(r).some((v) =>
        String(v || "").toLowerCase().includes(q)
      )
    );
  }, [rows, inTableSearch]);

  const effectivePageSize = pageSize === "all" ? Math.max(1, displayRows.length) : pageSize;
  const totalPages = Math.max(1, Math.ceil(displayRows.length / effectivePageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = pageSize === "all" ? displayRows : displayRows.slice((safePage - 1) * effectivePageSize, safePage * effectivePageSize);
  const pageStart = displayRows.length === 0 ? 0 : (safePage - 1) * (typeof pageSize === "number" ? pageSize : displayRows.length) + 1;
  const pageEnd = Math.min(safePage * (typeof pageSize === "number" ? pageSize : displayRows.length), displayRows.length);

  const pageWindow = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };

  // Reset page when data or in-table search changes
  useEffect(() => { setPage(1); }, [rows, inTableSearch, pageSize]);

  const fetchLeave = useCallback(async () => {
    let q = supabase
      .from("leave_requests")
      .select("id, leave_type, start_date, end_date, days, status, deleted_at, deleted_by, employees(first_name, last_name, department, branches(name))")
      .order("created_at", { ascending: false });

    if (config.dateFrom) q = q.gte("end_date", config.dateFrom);
    if (config.dateTo) q = q.lte("start_date", config.dateTo);
    const { data } = await q;

    const mapped: LeaveRow[] = (data || [])
      .map((r: any) => {
        const isDeleted = Boolean(r.deleted_at);
        return {
          id: r.id,
          employee: `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim(),
          department: r.employees?.department || "—",
          branch: r.employees?.branches?.name || "—",
          leave_type: r.leave_type,
          start_date: r.start_date,
          end_date: r.end_date,
          days: r.days,
          status: isDeleted ? "deleted" : r.status,
          deleted_at: r.deleted_at || null,
          deleted_by: r.deleted_by || "—",
          deleted_at_formatted: formatDateTime(r.deleted_at),
        };
      })
      .filter((r) => matchesEmployeeFilters(r, config));

    const cols = ["Employee", "Department", "Type", "Start Date", "End Date", "Days", "Status", "Deleted By", "Deleted Date & Time"];
    setRows(mapped);
    setColumns(cols);

    const totalDays = mapped.filter((r) => r.status !== "deleted").reduce((s, r) => s + r.days, 0);
    const approved = mapped.filter((r) => r.status === "approved").length;
    const pending = mapped.filter((r) => r.status === "pending").length;
    const deletedCount = mapped.filter((r) => r.status === "deleted" || Boolean(r.deleted_at)).length;

    setSummary({
      "Total Requests": mapped.length,
      "Total Days": totalDays,
      Approved: approved,
      Pending: pending,
      ...(deletedCount > 0 ? { "Deleted Requests": deletedCount } : {}),
    });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchPayroll = useCallback(async () => {
    let q = supabase
      .from("payroll_records")
      .select("id, month, base_salary, bonus, deductions, net_pay, status, deleted_at, deleted_by, employees(first_name, last_name, department, branches(name))")
      .order("month", { ascending: false });

    if (config.dateFrom) q = q.gte("month", config.dateFrom.substring(0, 7));
    if (config.dateTo) q = q.lte("month", config.dateTo.substring(0, 7));
    const { data } = await q;

    const mapped: PayrollRow[] = (data || [])
      .map((r: any) => {
        const isDeleted = Boolean(r.deleted_at);
        return {
          id: r.id,
          employee: `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim(),
          department: r.employees?.department || "—",
          branch: r.employees?.branches?.name || "—",
          month: r.month,
          base_salary: r.base_salary,
          bonus: r.bonus,
          deductions: r.deductions,
          net_pay: r.net_pay,
          status: isDeleted ? "deleted" : r.status,
          deleted_at: r.deleted_at || null,
          deleted_by: r.deleted_by || "—",
          deleted_at_formatted: formatDateTime(r.deleted_at),
        };
      })
      .filter((r) => matchesEmployeeFilters(r, config));

    const cols = ["Employee", "Department", "Month", "Base Salary", "Bonus", "Deductions", "Net Pay", "Status", "Deleted By", "Deleted Date & Time"];
    setRows(mapped);
    setColumns(cols);

    const total = mapped.filter((r) => r.status !== "deleted").reduce((s, r) => s + Number(r.net_pay), 0);
    const paid = mapped.filter((r) => r.status === "paid").length;
    const pending = mapped.filter((r) => r.status === "pending").length;
    const deletedCount = mapped.filter((r) => r.status === "deleted" || Boolean(r.deleted_at)).length;

    setSummary({
      "Total Records": mapped.length,
      "Total Net Pay": `$${total.toLocaleString()}`,
      Paid: paid,
      Pending: pending,
      ...(deletedCount > 0 ? { "Deleted Records": deletedCount } : {}),
    });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchHeadcount = useCallback(async () => {
    const { data: emps } = await supabase
      .from("employees")
      .select("id, department, status, deleted_at, deleted_by, branches(name)");

    const map: Record<string, HeadcountRow> = {};
    (emps || []).forEach((e: any) => {
      const key = `${e.branches?.name || "Unassigned"}||${e.department || "General"}`;
      if (!map[key]) map[key] = {
        branch: e.branches?.name || "Unassigned",
        department: e.department || "General",
        employee_count: 0,
        active: 0,
        onboarding: 0,
        deleted_count: 0,
      };
      map[key].employee_count++;
      if (e.deleted_at || e.status === "inactive" || e.status === "terminated") {
        map[key].deleted_count++;
      } else if (e.status === "active") {
        map[key].active++;
      } else if (e.status === "onboarding") {
        map[key].onboarding++;
      }
    });

    const mapped = Object.values(map)
      .filter((r) => (!config.departmentFilter || r.department === config.departmentFilter) && (!config.branchFilter || r.branch === config.branchFilter))
      .sort((a, b) => b.employee_count - a.employee_count);

    const cols = ["Branch", "Department", "Total Headcount", "Active", "Onboarding", "Deleted / Inactive"];
    setRows(mapped);
    setColumns(cols);

    const total = mapped.reduce((s, r) => s + r.employee_count, 0);
    const activeTotal = mapped.reduce((s, r) => s + r.active, 0);
    const deletedTotal = mapped.reduce((s, r) => s + r.deleted_count, 0);

    setSummary({
      "Total Employees": total,
      "Active Staff": activeTotal,
      "Deleted / Inactive": deletedTotal,
      Branches: new Set(mapped.map((r) => r.branch)).size,
      Departments: new Set(mapped.map((r) => r.department)).size,
    });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchExpenses = useCallback(async () => {
    let q = supabase
      .from("expense_records")
      .select("id, description, category, amount, submitted_by, status, created_at, deleted_at, deleted_by")
      .order("created_at", { ascending: false });

    if (config.dateFrom) q = q.gte("created_at", config.dateFrom);
    if (config.dateTo) q = q.lte("created_at", config.dateTo + "T23:59:59");
    const { data } = await q;

    const mapped: ExpenseRow[] = (data || [])
      .map((r: any) => {
        const isDeleted = Boolean(r.deleted_at);
        return {
          id: r.id,
          description: r.description,
          category: r.category,
          amount: r.amount,
          submitted_by: r.submitted_by,
          status: isDeleted ? "deleted" : r.status,
          date: r.created_at?.substring(0, 10) || "",
          deleted_at: r.deleted_at || null,
          deleted_by: r.deleted_by || "—",
          deleted_at_formatted: formatDateTime(r.deleted_at),
        };
      })
      .filter((r) => matchesEmployeeFilters(r, config));

    const cols = ["Description", "Category", "Amount", "Submitted By", "Date", "Status", "Deleted By", "Deleted Date & Time"];
    setRows(mapped);
    setColumns(cols);

    const total = mapped.filter((r) => r.status !== "deleted").reduce((s, r) => s + Number(r.amount), 0);
    const paid = mapped.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);
    const pending = mapped.filter((r) => r.status === "pending").length;
    const deletedCount = mapped.filter((r) => r.status === "deleted" || Boolean(r.deleted_at)).length;

    setSummary({
      "Total Records": mapped.length,
      "Total Amount": `$${total.toLocaleString()}`,
      "Amount Paid": `$${paid.toLocaleString()}`,
      "Pending Approval": pending,
      ...(deletedCount > 0 ? { "Deleted Records": deletedCount } : {}),
    });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchHire = useCallback(async () => {
    let q = supabase
      .from("candidates")
      .select("id, full_name, stage, applied_at, deleted_at, deleted_by, job_postings(title)")
      .order("applied_at", { ascending: false });

    if (config.dateFrom) q = q.gte("applied_at", config.dateFrom);
    if (config.dateTo) q = q.lte("applied_at", config.dateTo + "T23:59:59");
    const { data } = await q;

    const mapped: HireRow[] = (data || [])
      .map((r: any) => {
        const isDeleted = Boolean(r.deleted_at);
        return {
          id: r.id,
          name: r.full_name || "",
          position: r.job_postings?.title || "—",
          stage: r.stage,
          status: isDeleted ? "deleted" : r.stage,
          applied_date: r.applied_at?.substring(0, 10) || "",
          deleted_at: r.deleted_at || null,
          deleted_by: r.deleted_by || "—",
          deleted_at_formatted: formatDateTime(r.deleted_at),
        };
      })
      .filter((r) => matchesEmployeeFilters(r, config));

    const cols = ["Candidate", "Position", "Stage", "Status", "Applied Date", "Deleted By", "Deleted Date & Time"];
    setRows(mapped);
    setColumns(cols);

    const hired = mapped.filter((r) => r.status === "hired").length;
    const inProgress = mapped.filter((r) => !["hired", "rejected", "deleted"].includes(r.status)).length;
    const rejected = mapped.filter((r) => r.status === "rejected").length;
    const deletedCount = mapped.filter((r) => r.status === "deleted" || Boolean(r.deleted_at)).length;

    setSummary({
      "Total Candidates": mapped.length,
      Hired: hired,
      "In Progress": inProgress,
      Rejected: rejected,
      ...(deletedCount > 0 ? { "Deleted Candidates": deletedCount } : {}),
    });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchDailyLogs = useCallback(async () => {
    let q = supabase
      .from("work_logs")
      .select("id, log_date, start_time, end_time, activity, notes, deleted_at, deleted_by, employees(first_name, last_name, department, branches(name))")
      .order("log_date", { ascending: false });

    if (config.dateFrom) q = q.gte("log_date", config.dateFrom);
    if (config.dateTo) q = q.lte("log_date", config.dateTo);
    const { data } = await q;

    const fmt = (t: string | null) => (t ? new Date(`2000-01-01T${t}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "");
    const mapped: DailyLogRow[] = (data || [])
      .map((r: any) => {
        const isDeleted = Boolean(r.deleted_at);
        return {
          id: r.id,
          employee: `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim(),
          department: r.employees?.department || "—",
          branch: r.employees?.branches?.name || "—",
          date: r.log_date,
          time: r.start_time || r.end_time ? `${fmt(r.start_time)} – ${fmt(r.end_time)}` : "—",
          activity: r.activity,
          notes: r.notes || "",
          status: isDeleted ? "deleted" : "logged",
          deleted_at: r.deleted_at || null,
          deleted_by: r.deleted_by || "—",
          deleted_at_formatted: formatDateTime(r.deleted_at),
        };
      })
      .filter((r) => matchesEmployeeFilters(r, config));

    const cols = ["Employee", "Department", "Branch", "Date", "Time", "Activity", "Deleted By", "Deleted Date & Time", "Notes"];
    setRows(mapped);
    setColumns(cols);

    const deletedCount = mapped.filter((r) => r.status === "deleted" || Boolean(r.deleted_at)).length;
    setSummary({
      "Total Entries": mapped.length,
      "Employees Logged": new Set(mapped.map((r) => r.employee)).size,
      "Date Range": mapped.length ? `${mapped[mapped.length - 1].date} → ${mapped[0].date}` : "—",
      ...(deletedCount > 0 ? { "Deleted Entries": deletedCount } : {}),
    });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchRoomBookings = useCallback(async () => {
    let q = supabase
      .from("room_bookings")
      .select("id, title, date, start_time, end_time, attendees_count, status, deleted_at, deleted_by, meeting_rooms(name, floor), employees:booked_by(first_name, last_name, department, branches(name))")
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
        const isDeleted = Boolean(r.deleted_at);

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
          status: isDeleted ? "deleted" : (r.status || "approved"),
          deleted_at: r.deleted_at || null,
          deleted_by: r.deleted_by || "—",
          deleted_at_formatted: formatDateTime(r.deleted_at),
        };
      })
      .filter((r) => matchesEmployeeFilters(r, config));

    const cols = ["Room", "Title", "Booked By", "Department", "Branch", "Date", "Time", "Attendees", "Status", "Deleted By", "Deleted Date & Time"];
    setRows(mapped);
    setColumns(cols);

    const approved = mapped.filter((r) => r.status === "approved").length;
    const pending = mapped.filter((r) => r.status === "pending").length;
    const cancelled = mapped.filter((r) => r.status === "cancelled").length;
    const rejected = mapped.filter((r) => r.status === "rejected").length;
    const deletedCount = mapped.filter((r) => r.status === "deleted" || Boolean(r.deleted_at)).length;

    setSummary({
      "Total Bookings": mapped.length,
      Approved: approved,
      Pending: pending,
      "Cancelled / Rejected": cancelled + rejected,
      ...(deletedCount > 0 ? { "Deleted Bookings": deletedCount } : {}),
    });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchShifts = useCallback(async () => {
    let shiftQuery = supabase
      .from("shifts")
      .select("id, name, branch_id, department, start_time, end_time, shift_date, capacity, color, notes, deleted_at, deleted_by, branches(name)")
      .order("shift_date", { ascending: false })
      .order("start_time", { ascending: true });

    if (config.dateFrom) shiftQuery = shiftQuery.gte("shift_date", config.dateFrom);
    if (config.dateTo) shiftQuery = shiftQuery.lte("shift_date", config.dateTo);

    const [{ data: shiftData, error: sErr }, { data: assignData, error: aErr }] = await Promise.all([
      shiftQuery,
      supabase
        .from("shift_assignments")
        .select("id, shift_id, employee_id, status, deleted_at, deleted_by, employees(first_name, last_name, department, role, branches(name))"),
    ]);

    if (sErr) console.error("fetchShifts shifts error:", sErr);
    if (aErr) console.error("fetchShifts assignments error:", aErr);

    const calcHours = (start?: string, end?: string): number => {
      if (!start || !end) return 0;
      const [sH, sM] = start.split(":").map(Number);
      const [eH, eM] = end.split(":").map(Number);
      let sm = sH * 60 + sM;
      let em = eH * 60 + eM;
      if (em < sm) em += 24 * 60;
      return Math.round(((em - sm) / 60) * 10) / 10;
    };

    const mapped: ShiftRow[] = [];
    const shiftsList = shiftData || [];
    const assignsList = assignData || [];

    shiftsList.forEach((s: any) => {
      const shiftAssigns = assignsList.filter((a: any) => a.shift_id === s.id);
      const durationHours = calcHours(s.start_time, s.end_time);
      const timeDisplay = s.start_time && s.end_time ? `${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)}` : "—";
      const branchName = s.branches?.name || "—";
      const capacity = s.capacity || 1;
      const activeShiftAssigns = shiftAssigns.filter((a: any) => !a.deleted_at && !s.deleted_at);

      if (shiftAssigns.length > 0) {
        shiftAssigns.forEach((a: any) => {
          const empName = `${a.employees?.first_name || ""} ${a.employees?.last_name || ""}`.trim() || "Assigned Staff";
          const empDept = a.employees?.department || s.department || "—";
          const empBranch = a.employees?.branches?.name || branchName;
          const isDeleted = Boolean(a.deleted_at || s.deleted_at);
          const delAt = a.deleted_at || s.deleted_at;
          const delBy = a.deleted_by || s.deleted_by;

          mapped.push({
            id: a.id,
            shift_date: s.shift_date,
            shift_name: s.name,
            employee: empName,
            department: empDept,
            branch: empBranch,
            time: `${timeDisplay} (${durationHours}h)`,
            hours: durationHours,
            capacity: capacity,
            staffing: `${activeShiftAssigns.length}/${capacity}`,
            status: isDeleted ? "deleted" : (a.status || "scheduled"),
            notes: s.notes || "",
            deleted_at: delAt || null,
            deleted_by: delBy || "—",
            deleted_at_formatted: formatDateTime(delAt),
          });
        });
      } else {
        const isDeleted = Boolean(s.deleted_at);
        mapped.push({
          id: s.id,
          shift_date: s.shift_date,
          shift_name: s.name,
          employee: "— (Open / Needs Staff)",
          department: s.department || "—",
          branch: branchName,
          time: `${timeDisplay} (${durationHours}h)`,
          hours: durationHours,
          capacity: capacity,
          staffing: `0/${capacity}`,
          status: isDeleted ? "deleted" : "open",
          notes: s.notes || "",
          deleted_at: s.deleted_at || null,
          deleted_by: s.deleted_by || "—",
          deleted_at_formatted: formatDateTime(s.deleted_at),
        });
      }
    });

    const filtered = mapped.filter((r) => matchesEmployeeFilters(r, config));
    const cols = ["Shift Date", "Shift Name", "Employee", "Department", "Branch", "Time", "Hours", "Capacity", "Staffing", "Status", "Deleted By", "Deleted Date & Time", "Notes"];
    setRows(filtered);
    setColumns(cols);

    const activeRows = filtered.filter((r) => r.status !== "deleted");
    const totalScheduledHours = activeRows.reduce((acc, r) => acc + (r.status !== "open" ? r.hours : 0), 0);
    const assignedStaffCount = activeRows.filter((r) => r.status !== "open").length;
    const openSlotsCount = activeRows.filter((r) => r.status === "open").length;
    const totalCapacitySum = shiftsList.filter((s: any) => !s.deleted_at).reduce((acc: number, s: any) => acc + (s.capacity || 1), 0);
    const coveragePct = totalCapacitySum > 0 ? Math.round((assignedStaffCount / totalCapacitySum) * 100) : 100;
    const deletedCount = filtered.filter((r) => r.status === "deleted" || Boolean(r.deleted_at)).length;

    setSummary({
      "Total Shifts": shiftsList.length,
      "Scheduled Hours": `${Math.round(totalScheduledHours * 10) / 10} hrs`,
      "Staff Assigned": assignedStaffCount,
      "Open Slots": openSlotsCount,
      "Staffing Coverage": `${coveragePct}%`,
      ...(deletedCount > 0 ? { "Deleted Shifts / Slots": deletedCount } : {}),
    });

    onDataReady(filtered, cols);
  }, [config, onDataReady]);

  const fetchOnboarding = useCallback(async () => {
    let q = supabase
      .from("onboarding_requests")
      .select("id, stage, status, day_count, requested_by, created_at, deleted_at, deleted_by, employees(id, first_name, last_name, role, department, branches(name)), onboarding_documents(id, status)")
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
        const isDeleted = Boolean(r.deleted_at);

        return {
          id: r.id,
          employee: empName || "Unknown Candidate",
          role: r.employees?.role || "—",
          department: r.employees?.department || "—",
          branch: r.employees?.branches?.name || "—",
          stage: STAGE_LABELS[r.stage] || r.stage || "Document Collection",
          status: isDeleted ? "deleted" : (r.status || "pending"),
          verified_docs: docProgress,
          requested_by: r.requested_by || "Admin",
          started_date: r.created_at?.substring(0, 10) || "—",
          deleted_at: r.deleted_at || null,
          deleted_by: r.deleted_by || "—",
          deleted_at_formatted: formatDateTime(r.deleted_at),
        };
      })
      .filter((r) => matchesEmployeeFilters(r, config));

    const cols = ["Employee", "Role", "Department", "Branch", "Stage", "Status", "Verified Docs", "Requested By", "Started Date", "Deleted By", "Deleted Date & Time"];
    setRows(mapped);
    setColumns(cols);

    const completed = mapped.filter((r) => r.status === "completed").length;
    const approved = mapped.filter((r) => r.status === "approved" || r.status === "in_progress").length;
    const pending = mapped.filter((r) => r.status === "pending").length;
    const deletedCount = mapped.filter((r) => r.status === "deleted" || Boolean(r.deleted_at)).length;

    setSummary({
      "Total Onboarding": mapped.length,
      "Approved & Active": approved,
      "Completed / Graduated": completed,
      "Pending Approval": pending,
      ...(deletedCount > 0 ? { "Deleted Onboarding": deletedCount } : {}),
    });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchOnboardingTasks = useCallback(async () => {
    let q = supabase
      .from("onboarding_checklist_tasks")
      .select("id, task_name, description, category, priority, assigned_to, assigned_to_role, due_date, completed, completed_by, completed_at, deleted_at, deleted_by, sort_order, onboarding_requests(id, stage, status, employees(id, first_name, last_name, department, branches(name)))")
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

    const mapped: OnboardingTaskRow[] = (data || [])
      .map((r: any) => {
        const emp = r.onboarding_requests?.employees;
        const candidateName = emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "—";
        const isDone = Boolean(r.completed);
        const isDeleted = Boolean(r.deleted_at);

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
          status: isDeleted ? "deleted" : (isDone ? "completed" : "pending"),
          completed_by: r.completed_by || "—",
          completed_at: r.completed_at ? r.completed_at.substring(0, 10) : "—",
          verified_at: formatDateTime(r.completed_at),
          deleted_at: r.deleted_at || null,
          deleted_by: r.deleted_by || "—",
          deleted_at_formatted: formatDateTime(r.deleted_at),
        };
      })
      .filter((r) => matchesEmployeeFilters(r, config));

    const cols = ["Task Name", "Candidate", "Department", "Branch", "Category", "Priority", "Assigned To", "Due Date", "Status", "Verified By", "Verified Date & Time", "Deleted By", "Deleted Date & Time"];
    setRows(mapped);
    setColumns(cols);

    const todayStr = new Date().toISOString().substring(0, 10);
    const completedCount = mapped.filter((r) => r.status === "completed").length;
    const pendingCount = mapped.filter((r) => r.status === "pending").length;
    const overdueCount = mapped.filter((r) => r.status === "pending" && r.due_date !== "No deadline" && r.due_date < todayStr).length;
    const deletedCount = mapped.filter((r) => r.status === "deleted" || Boolean(r.deleted_at)).length;

    setSummary({
      "Total Tasks": mapped.length,
      "Completed / Verified": completedCount,
      "Pending Tasks": pendingCount,
      "Overdue Tasks": overdueCount,
      ...(deletedCount > 0 ? { "Deleted Tasks": deletedCount } : {}),
    });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  useEffect(() => {
    setLoading(true);
    const run = async () => {
      if (config.module === "leave") await fetchLeave();
      else if (config.module === "shifts") await fetchShifts();
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
  }, [config, fetchLeave, fetchShifts, fetchPayroll, fetchHeadcount, fetchExpenses, fetchHire, fetchOnboarding, fetchOnboardingTasks, fetchDailyLogs, fetchRoomBookings]);

  // Real-time live synchronization: re-fetches automatically when database records change
  useEffect(() => {
    const tableMap: Record<string, string | string[]> = {
      leave: "leave_requests",
      shifts: ["shifts", "shift_assignments"],
      payroll: "payroll_records",
      headcount: "employees",
      expenses: "expense_records",
      hire: "candidates",
      onboarding: "onboarding_requests",
      "onboarding-tasks": "onboarding_checklist_tasks",
      "daily-logs": "work_logs",
      "meeting-rooms": "room_bookings",
    };
    const target = tableMap[config.module];
    if (!target) return;

    const tables = Array.isArray(target) ? target : [target];
    const channels = tables.map((tbl) => {
      return supabase
        .channel(`report_realtime_${config.module}_${tbl}`)
        .on("postgres_changes", { event: "*", schema: "public", table: tbl }, () => {
          if (config.module === "leave") fetchLeave();
          else if (config.module === "shifts") fetchShifts();
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
    });

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [config.module, fetchLeave, fetchShifts, fetchPayroll, fetchHeadcount, fetchExpenses, fetchHire, fetchOnboarding, fetchOnboardingTasks, fetchDailyLogs, fetchRoomBookings]);

  const REPORT_COLUMN_KEY_MAP: Record<string, string> = {
    "Employee": "employee", "Department": "department", "Type": "leave_type", "Start Date": "start_date",
    "End Date": "end_date", "Days": "days", "Status": "status", "Month": "month",
    "Base Salary": "base_salary", "Bonus": "bonus", "Deductions": "deductions", "Net Pay": "net_pay",
    "Branch": "branch", "Total Headcount": "employee_count", "Active": "active", "Onboarding": "onboarding",
    "Deleted / Inactive": "deleted_count",
    "Description": "description", "Category": "category", "Amount": "amount", "Submitted By": "submitted_by",
    "Date": "date", "Candidate": "candidate", "Position": "position", "Stage": "stage", "Applied Date": "applied_date",
    "Room": "room_name", "Title": "title", "Booked By": "employee", "Attendees": "attendees", "Time": "time",
    "Role": "role", "Verified Docs": "verified_docs", "Requested By": "requested_by", "Started Date": "started_date",
    "Task Name": "task_name", "Priority": "priority", "Assigned To": "assigned_to", "Due Date": "due_date",
    "Verified By": "completed_by", "Verified Date & Time": "verified_at", "Verified At": "verified_at", "Completed Date": "completed_at",
    "Shift Date": "shift_date", "Shift Name": "shift_name", "Hours": "hours", "Capacity": "capacity", "Staffing": "staffing", "Notes": "notes",
    "Deleted By": "deleted_by", "Deleted Date & Time": "deleted_at_formatted", "Deleted At": "deleted_at_formatted",
  };

  const renderCell = (col: string, row: ReportRow) => {
    const key = REPORT_COLUMN_KEY_MAP[col] || col.toLowerCase().replace(/ /g, "_");
    const val = (row as any)[key] ?? "—";

    if (col === "Status" || col === "status") {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize whitespace-nowrap shadow-2xs ${STATUS_COLOR[String(val).toLowerCase()] || "bg-gray-100 text-gray-700"}`}>
          {String(val)}
        </span>
      );
    }
    if (col === "Deleted By") {
      return val && val !== "—" ? (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs whitespace-nowrap">
          <i className="ri-user-unfollow-line text-xs" />
          {String(val)}
        </span>
      ) : (
        <span className="text-gray-300 font-mono text-xs">—</span>
      );
    }
    if (col === "Deleted Date & Time" || col === "Deleted At") {
      return val && val !== "—" ? (
        <span className="text-[11px] text-rose-700 font-medium whitespace-nowrap inline-flex items-center gap-1">
          <i className="ri-calendar-close-line text-xs text-rose-500" />
          {String(val)}
        </span>
      ) : (
        <span className="text-gray-300 font-mono text-xs">—</span>
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
      return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${pBg} uppercase whitespace-nowrap`}>{String(val)}</span>;
    }
    if (col === "Stage" || col === "Category") {
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200/60 whitespace-nowrap">{String(val)}</span>;
    }
    if (col === "Verified Docs") {
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-[#253C7D] border border-blue-200 shadow-2xs whitespace-nowrap">{String(val)}</span>;
    }
    if (col === "Verified Date & Time" || col === "Verified At") {
      return val && val !== "—" ? (
        <span className="text-[11px] text-slate-700 font-medium whitespace-nowrap">{String(val)}</span>
      ) : (
        <span className="text-gray-300 font-mono text-xs">—</span>
      );
    }
    if (col.includes("Salary") || col.includes("Pay") || col.includes("Bonus") || col.includes("Deduct") || col === "Amount") {
      return <span className="font-semibold text-slate-900">${Number(val || 0).toLocaleString()}</span>;
    }
    if (col === "Employee" || col === "Candidate") {
      return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-bold text-[10px] flex items-center justify-center shrink-0">
            {String(val).charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-gray-900 whitespace-nowrap">{String(val)}</span>
        </div>
      );
    }
    return <span className="text-gray-700 whitespace-nowrap">{String(val ?? "—")}</span>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-56 bg-white rounded-2xl border border-gray-100 shadow-2xs">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-gray-400 font-medium">Loading report records...</p>
      </div>
    );
  }

  return (
    <div id="report-content" className="space-y-4">
      {/* Summary KPI Cards */}
      {Object.keys(summary).length > 0 && (
        <div className={`grid gap-3 grid-cols-2 md:grid-cols-${Math.min(Object.keys(summary).length, 4)}`}>
          {Object.entries(summary).map(([k, v]) => {
            const isDel = k.includes("Deleted");
            return (
              <div
                key={k}
                className={`bg-white border rounded-xl p-3.5 shadow-2xs transition-all hover:shadow-xs ${
                  isDel ? "border-rose-200 bg-rose-50/20" : "border-gray-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDel ? "text-rose-600" : "text-gray-400"}`}>
                    {k}
                  </p>
                  {isDel && <i className="ri-delete-bin-7-line text-rose-500 text-sm" />}
                </div>
                <p className={`text-2xl font-bold tracking-tight mt-1 ${isDel ? "text-rose-700" : "text-gray-900"}`}>
                  {v}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Productive Table Container Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Productivity Toolbar on Top of Table */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gray-50/70 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={inTableSearch}
                onChange={(e) => setInTableSearch(e.target.value)}
                placeholder="Instant search in this table..."
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all shadow-2xs"
              />
              {inTableSearch && (
                <button
                  onClick={() => setInTableSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-circle-fill text-xs" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
            {/* Density Selector */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200/80 shadow-2xs">
              <button
                onClick={() => setDensity("compact")}
                title="Compact Density"
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  density === "compact" ? "bg-[#253C7D] text-white" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-list-check text-xs" /> Compact
              </button>
              <button
                onClick={() => setDensity("comfortable")}
                title="Comfortable Density"
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  density === "comfortable" ? "bg-[#253C7D] text-white" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-layout-row-line text-xs" /> Roomy
              </button>
            </div>

            {/* Fast Page Size Pills */}
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <span className="hidden md:inline text-gray-400 font-medium">Show:</span>
              {[10, 25, 50, "all"].map((s) => (
                <button
                  key={String(s)}
                  onClick={() => { setPageSize(s as any); setPage(1); }}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer border ${
                    pageSize === s
                      ? "bg-[#253C7D] text-white border-[#253C7D]"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {displayRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <i className="ri-file-search-line text-4xl mb-2 text-gray-300" />
            <p className="text-sm font-semibold text-gray-600">No records found</p>
            <p className="text-xs text-gray-400 mt-0.5">Try clearing your filters or search terms</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[680px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-200/90 shadow-2xs">
                <tr>
                  <th className="px-3.5 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-10 text-center">
                    #
                  </th>
                  {columns.map((col) => {
                    const isDelCol = col.includes("Deleted");
                    return (
                      <th
                        key={col}
                        className={`px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                          isDelCol ? "text-rose-700 bg-rose-50/60" : "text-slate-600"
                        }`}
                      >
                        {col}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedRows.map((row, i) => {
                  const isRowDeleted = Boolean((row as any).deleted_at || (row as any).status === "deleted");
                  const rowIndex = pageStart + i;

                  return (
                    <tr
                      key={i}
                      className={`transition-colors group ${
                        isRowDeleted
                          ? "bg-rose-50/20 hover:bg-rose-50/40"
                          : i % 2 === 0
                          ? "bg-white hover:bg-slate-50/80"
                          : "bg-[#FAFAFA] hover:bg-slate-50/80"
                      }`}
                    >
                      <td className={`px-3.5 text-center text-xs font-mono text-gray-400 group-hover:text-gray-600 ${
                        density === "compact" ? "py-2" : "py-3"
                      }`}>
                        {rowIndex}
                      </td>
                      {columns.map((col) => (
                        <td
                          key={col}
                          className={`px-3.5 text-xs text-gray-700 whitespace-nowrap ${
                            density === "compact" ? "py-2" : "py-3"
                          }`}
                        >
                          {renderCell(col, row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Productive Attached Pagination Footer */}
        {displayRows.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-2 text-gray-500 font-medium">
              <span>
                Showing <span className="font-bold text-gray-800">{pageStart}</span>–<span className="font-bold text-gray-800">{pageEnd}</span> of <span className="font-bold text-gray-800">{displayRows.length}</span> records
              </span>
              {inTableSearch && (
                <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 text-[11px]">
                  Filtered from {rows.length} total
                </span>
              )}
            </div>

            {pageSize !== "all" && totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  onClick={() => setPage(1)}
                  disabled={safePage === 1}
                  title="First Page"
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                >
                  <i className="ri-skip-left-line text-xs" />
                </button>

                {/* Prev Page */}
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  title="Previous Page"
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                >
                  <i className="ri-arrow-left-s-line text-xs" />
                </button>

                {/* Page Number Pills */}
                {pageWindow(safePage, totalPages).map((p, idx) =>
                  p === "..." ? (
                    <span key={`ell-${idx}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-400 font-bold">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                        p === safePage
                          ? "bg-[#253C7D] text-white shadow-xs"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                {/* Next Page */}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  title="Next Page"
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                >
                  <i className="ri-arrow-right-s-line text-xs" />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={safePage === totalPages}
                  title="Last Page"
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                >
                  <i className="ri-skip-right-line text-xs" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}