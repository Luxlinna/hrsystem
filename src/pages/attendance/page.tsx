import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "@/components/Toast";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import { Link } from "react-router-dom";
import { notifyAttendanceEvent } from "@/lib/attendanceNotify";
import { toYMD, todayYMD as todayYMDLib, zonedParts } from "@/lib/date";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  role: string;
  avatar_url: string | null;
  branch_id?: string | null;
  branches?: { id: string; name: string } | null;
}

interface AttendanceRecord {
  id: number;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: "present" | "absent" | "late" | "half_day" | "remote" | "holiday";
  late_minutes: number;
  early_leave_minutes?: number | null;
  notes: string | null;
  employees?: Employee;
}

interface NewRecordForm {
  employee_id: string;
  date: string;
  clock_in: string;
  clock_out: string;
  status: string;
  late_minutes: number;
  notes: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; short: string; bg: string; text: string; border: string; icon: string; dot: string }
> = {
  present: {
    label: "Present",
    short: "P",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "ri-checkbox-circle-line",
    dot: "bg-emerald-500",
  },
  late: {
    label: "Late Arrival",
    short: "L",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "ri-time-line",
    dot: "bg-amber-500",
  },
  remote: {
    label: "Remote / WFH",
    short: "R",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    icon: "ri-home-office-line",
    dot: "bg-sky-500",
  },
  half_day: {
    label: "Half Day",
    short: "H",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    icon: "ri-sun-line",
    dot: "bg-orange-500",
  },
  absent: {
    label: "Absent",
    short: "A",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: "ri-close-circle-line",
    dot: "bg-rose-500",
  },
  holiday: {
    label: "Holiday / Off",
    short: "OFF",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: "ri-calendar-event-line",
    dot: "bg-purple-500",
  },
};

function formatTime(t: string | null) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function calcHours(clockIn: string | null, clockOut: string | null): string {
  if (!clockIn || !clockOut) return "—";
  const [ih, im] = clockIn.split(":").map(Number);
  const [oh, om] = clockOut.split(":").map(Number);
  let mins = oh * 60 + om - (ih * 60 + im);
  if (mins < 0) mins += 24 * 60; // overnight shift
  if (mins === 0) return "—";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function calcHoursNum(clockIn: string | null, clockOut: string | null): number {
  if (!clockIn || !clockOut) return 0;
  const [ih, im] = clockIn.split(":").map(Number);
  const [oh, om] = clockOut.split(":").map(Number);
  let mins = oh * 60 + om - (ih * 60 + im);
  if (mins < 0) mins += 24 * 60;
  return +(mins / 60).toFixed(1);
}

const initials = (first?: string, last?: string) =>
  `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

export default function AttendancePage() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin, loading: permsLoading } = usePermissions();
  const canViewAll = isAdmin || !!role?.attendance_view_all_employees;
  const canViewOwnBranch = !canViewAll && !!role?.attendance_view_own_branch;
  const canManage = canViewAll || canViewOwnBranch;

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  // Tabs & Views
  const [activeTab, setActiveTab] = useState<"records" | "live" | "matrix" | "summary">("records");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Filters & Historical Date Ranges
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [filterDatePreset, setFilterDatePreset] = useState<
    "all" | "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "this_year" | "last_year" | "single_date" | "custom_range"
  >("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [singleDate, setSingleDate] = useState(toYMD(new Date()));

  // Historical Date for "Live Who's In Today / Day Roster"
  const [rosterDate, setRosterDate] = useState(toYMD(new Date()));

  // Monthly Matrix Selector (YYYY-MM)
  const now = new Date();
  const [matrixMonth, setMatrixMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  // Modals & Panels
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Live Digital Clock State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [newRecord, setNewRecord] = useState<NewRecordForm>({
    employee_id: "",
    date: toYMD(new Date()),
    clock_in: "09:00",
    clock_out: "18:00",
    status: "present",
    late_minutes: 0,
    notes: "",
  });

  useEffect(() => {
    if (permsLoading) return;
    fetchData();
  }, [permsLoading, canViewAll, canViewOwnBranch, user?.email]);

  async function fetchData() {
    setLoading(true);

    if (canViewAll) {
      const [recRes, empRes] = await Promise.all([
        supabase
          .from("attendance_records")
          .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name))")
          .is("deleted_at", null)
          .order("date", { ascending: false })
          .limit(2000),
        supabase
          .from("employees")
          .select("id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name)")
          .eq("status", "active")
          .order("first_name"),
      ]);
      if (recRes.data) setRecords(recRes.data as unknown as AttendanceRecord[]);
      if (empRes.data) setEmployees(empRes.data as unknown as Employee[]);
      setLoading(false);
      return;
    }

    if (!user?.email) {
      setLoading(false);
      return;
    }

    const { data: me } = await supabase
      .from("employees")
      .select("id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name)")
      .eq("email", user.email)
      .maybeSingle();

    setMyEmployee(me as unknown as Employee | null);

    if (!me) {
      setEmployees([]);
      setRecords([]);
      setLoading(false);
      return;
    }

    if (canViewOwnBranch && me.branch_id) {
      const { data: team } = await supabase
        .from("employees")
        .select("id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name)")
        .eq("status", "active")
        .eq("branch_id", me.branch_id)
        .order("first_name");
      setEmployees((team as unknown as Employee[]) || []);

      const ids = (team || []).map((e) => e.id);
      const { data: recData } = ids.length
        ? await supabase
            .from("attendance_records")
            .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name))")
            .is("deleted_at", null)
            .in("employee_id", ids)
            .order("date", { ascending: false })
            .limit(2000)
        : { data: [] };
      setRecords((recData as unknown as AttendanceRecord[]) || []);
      setLoading(false);
      return;
    }

    setEmployees([me as unknown as Employee]);
    const { data: recData } = await supabase
      .from("attendance_records")
      .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name))")
      .eq("employee_id", me.id)
      .is("deleted_at", null)
      .order("date", { ascending: false })
      .limit(1000);
    setRecords((recData as unknown as AttendanceRecord[]) || []);
    setLoading(false);
  }

  // Today's date string, in the company timezone (Admin → Settings → Timezone).
  const todayYMD = todayYMDLib();

  // Current user's today attendance status
  const myTodayRecord = useMemo(() => {
    if (!myEmployee) return null;
    return records.find((r) => r.employee_id === myEmployee.id && r.date === todayYMD) || null;
  }, [myEmployee, records, todayYMD]);

  // Departments for filtering
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  // Comprehensive Historical Date Range Resolver
  const dateRangeBounds = useMemo(() => {
    const cur = new Date();
    if (filterDatePreset === "today") return { start: todayYMD, end: todayYMD };

    if (filterDatePreset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = toYMD(y);
      return { start: yStr, end: yStr };
    }

    if (filterDatePreset === "this_week") {
      const start = new Date(cur);
      start.setDate(cur.getDate() - cur.getDay()); // Sunday
      return { start: toYMD(start), end: todayYMD };
    }

    if (filterDatePreset === "last_week") {
      const start = new Date(cur);
      start.setDate(cur.getDate() - cur.getDay() - 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start: toYMD(start), end: toYMD(end) };
    }

    if (filterDatePreset === "this_month") {
      const start = new Date(cur.getFullYear(), cur.getMonth(), 1);
      return { start: toYMD(start), end: todayYMD };
    }

    if (filterDatePreset === "last_month") {
      const start = new Date(cur.getFullYear(), cur.getMonth() - 1, 1);
      const end = new Date(cur.getFullYear(), cur.getMonth(), 0);
      return { start: toYMD(start), end: toYMD(end) };
    }

    if (filterDatePreset === "this_year") {
      const start = new Date(cur.getFullYear(), 0, 1);
      return { start: toYMD(start), end: todayYMD };
    }

    if (filterDatePreset === "last_year") {
      const start = new Date(cur.getFullYear() - 1, 0, 1);
      const end = new Date(cur.getFullYear() - 1, 11, 31);
      return { start: toYMD(start), end: toYMD(end) };
    }

    if (filterDatePreset === "single_date" && singleDate) {
      return { start: singleDate, end: singleDate };
    }

    if (filterDatePreset === "custom_range") {
      return {
        start: fromDate || "1970-01-01",
        end: toDate || "2099-12-31",
      };
    }

    return null; // All dates
  }, [filterDatePreset, singleDate, fromDate, toDate, todayYMD]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterDepartment !== "all" && r.employees?.department !== filterDepartment) return false;

      if (dateRangeBounds) {
        if (r.date < dateRangeBounds.start || r.date > dateRangeBounds.end) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.toLowerCase();
        const role = (r.employees?.role || "").toLowerCase();
        const dept = (r.employees?.department || "").toLowerCase();
        const notes = (r.notes || "").toLowerCase();
        const dateStr = r.date.toLowerCase();
        if (!empName.includes(q) && !role.includes(q) && !dept.includes(q) && !notes.includes(q) && !dateStr.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [records, filterStatus, filterDepartment, dateRangeBounds, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = filteredRecords.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, filteredRecords.length);
  const pagedRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);

  const pageWindow = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterDepartment, filterStatus, filterDatePreset, fromDate, toDate, singleDate, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // KPI Metrics (Calculated dynamically based on selected date or today)
  const activeScopeRecords = useMemo(() => {
    if (dateRangeBounds) {
      return records.filter((r) => r.date >= dateRangeBounds.start && r.date <= dateRangeBounds.end);
    }
    return records;
  }, [records, dateRangeBounds]);

  const presentCount = useMemo(
    () => activeScopeRecords.filter((r) => r.status === "present" || r.status === "remote").length,
    [activeScopeRecords]
  );
  const lateCount = useMemo(() => activeScopeRecords.filter((r) => r.status === "late").length, [activeScopeRecords]);
  const absentCount = useMemo(() => activeScopeRecords.filter((r) => r.status === "absent").length, [activeScopeRecords]);
  const remoteCount = useMemo(() => activeScopeRecords.filter((r) => r.status === "remote").length, [activeScopeRecords]);
  const workingNow = useMemo(
    () => records.filter((r) => r.date === todayYMD && r.clock_in && !r.clock_out).length,
    [records, todayYMD]
  );

  // Records for the specific "Roster Date"
  const rosterRecords = useMemo(() => records.filter((r) => r.date === rosterDate), [records, rosterDate]);

  // Employee Summary & Ratings
  const employeeSummary = useMemo(() => {
    return employees.map((emp) => {
      const empRecords = activeScopeRecords.filter((r) => r.employee_id === emp.id);
      const present = empRecords.filter((r) => r.status === "present" || r.status === "remote").length;
      const late = empRecords.filter((r) => r.status === "late").length;
      const absent = empRecords.filter((r) => r.status === "absent").length;
      const remote = empRecords.filter((r) => r.status === "remote").length;
      const totalHours = empRecords.reduce((acc, r) => acc + calcHoursNum(r.clock_in, r.clock_out), 0);
      const totalLateMinutes = empRecords.reduce((acc, r) => acc + (r.late_minutes || 0), 0);
      const totalDays = empRecords.length;
      const attendanceRate = totalDays > 0 ? Math.round(((present + late) / totalDays) * 100) : 0;
      const lastSeen = empRecords[0]?.date || "—";
      const rosterRecord = rosterRecords.find((r) => r.employee_id === emp.id);

      return {
        ...emp,
        present,
        late,
        absent,
        remote,
        totalHours: +totalHours.toFixed(1),
        totalLateMinutes,
        totalDays,
        attendanceRate,
        lastSeen,
        rosterRecord,
      };
    });
  }, [employees, activeScopeRecords, rosterRecords]);

  // Filtered Summary
  const filteredSummary = useMemo(() => {
    return employeeSummary.filter((e) => {
      if (filterDepartment !== "all" && e.department !== filterDepartment) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = `${e.first_name} ${e.last_name}`.toLowerCase();
        const role = (e.role || "").toLowerCase();
        const dept = (e.department || "").toLowerCase();
        if (!name.includes(q) && !role.includes(q) && !dept.includes(q)) return false;
      }
      return true;
    });
  }, [employeeSummary, filterDepartment, searchQuery]);

  // Days array for Monthly Matrix
  const matrixDays = useMemo(() => {
    if (!matrixMonth) return [];
    const [yStr, mStr] = matrixMonth.split("-");
    const year = parseInt(yStr);
    const month = parseInt(mStr);
    const totalDays = new Date(year, month, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const dObj = new Date(year, month - 1, dayNum);
      return {
        dayNum,
        dateStr,
        dayName: dObj.toLocaleDateString("en-US", { weekday: "narrow" }),
        isWeekend: dObj.getDay() === 0 || dObj.getDay() === 6,
      };
    });
  }, [matrixMonth]);

  // Quick Self Check-In Action
  // This card only opens the day; checking out is done from Self-Service.
  const handleQuickClockIn = async () => {
    if (!myEmployee) return;
    const nowZ = zonedParts(currentTime);
    const nowTime = `${String(nowZ.hh).padStart(2, "0")}:${String(nowZ.mm).padStart(2, "0")}`;

    const { error } = await supabase.from("attendance_records").upsert(
      {
        employee_id: myEmployee.id,
        date: todayYMD,
        clock_in: nowTime,
        status: "present",
        late_minutes: 0,
      },
      { onConflict: "employee_id,date" }
    );
    if (error) {
      toast("Error", "Failed to check in", "error");
      return;
    }
    toast("Checked In Successfully", `Checked in at ${formatTime(nowTime)}`, "success");
    notifyAttendanceEvent({
      employeeName: `${myEmployee.first_name} ${myEmployee.last_name}`,
      employeeId: myEmployee.id,
      type: "in",
      isException: false,
      date: todayYMD,
      time: nowTime,
      branchName: myEmployee.branches?.name,
      department: myEmployee.department,
    });
    fetchData();
  };

  // Manual Log Attendance Save (Works for any past, present, or future date!)
  async function handleSaveNewRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!newRecord.employee_id || !newRecord.date || saving) return;
    setSaving(true);

    const { error } = await supabase.from("attendance_records").insert({
      employee_id: newRecord.employee_id,
      date: newRecord.date,
      clock_in: newRecord.clock_in || null,
      clock_out: newRecord.clock_out || null,
      status: newRecord.status,
      late_minutes: newRecord.status === "late" ? newRecord.late_minutes : 0,
      notes: newRecord.notes ? newRecord.notes.trim() : null,
    });

    setSaving(false);
    if (error) {
      const msg =
        error.code === "23505"
          ? `This employee already has an attendance record for ${newRecord.date}. Edit the existing record instead.`
          : "Failed to record attendance";
      toast("Error", msg, "error");
      return;
    }

    toast("Attendance Logged", `Record added for ${newRecord.date}.`, "success");
    setShowLogModal(false);
    setNewRecord({
      employee_id: "",
      date: todayYMD,
      clock_in: "09:00",
      clock_out: "18:00",
      status: "present",
      late_minutes: 0,
      notes: "",
    });
    fetchData();
  }

  // Update existing record
  async function handleUpdateRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRecord || saving) return;
    setSaving(true);

    const { error } = await supabase
      .from("attendance_records")
      .update({
        clock_in: editingRecord.clock_in || null,
        clock_out: editingRecord.clock_out || null,
        status: editingRecord.status,
        late_minutes: editingRecord.status === "late" ? editingRecord.late_minutes : 0,
        notes: editingRecord.notes ? editingRecord.notes.trim() : null,
      })
      .eq("id", editingRecord.id);

    setSaving(false);
    if (error) {
      toast("Error", "Failed to update record", "error");
      return;
    }

    toast("Attendance Updated", "Changes saved successfully.", "success");
    setEditingRecord(null);
    if (selectedRecord && selectedRecord.id === editingRecord.id) {
      setSelectedRecord(editingRecord);
    }
    fetchData();
  }

  // Delete Record
  async function handleDeleteRecord(id: number) {
    if (!confirm("Move this attendance record to the Recycle Bin? It can be restored later.")) return;
    const { error } = await supabase
      .from("attendance_records")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", id);
    if (error) {
      toast("Error", "Failed to move record to the Recycle Bin", "error");
      return;
    }
    toast("Record Moved", "Attendance entry moved to the Recycle Bin.", "success");
    setSelectedRecord(null);
    setEditingRecord(null);
    fetchData();
  }

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      toast("Export", "No records to export with current filters", "warning");
      return;
    }

    const headers = ["Employee", "Department", "Role", "Date", "Check In", "Check Out", "Hours", "Status", "Late (Min)", "Notes"];
    const rows = filteredRecords.map((r) => [
      `"${r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "Unknown"}"`,
      `"${r.employees?.department || ""}"`,
      `"${r.employees?.role || ""}"`,
      r.date,
      r.clock_in || "",
      r.clock_out || "",
      calcHours(r.clock_in, r.clock_out),
      r.status,
      r.late_minutes || 0,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_export_${dateRangeBounds?.start || "all"}_to_${dateRangeBounds?.end || "all"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Export Complete", `Exported ${filteredRecords.length} records to CSV`, "success");
  };

  // Quick Date Jump Helper for Roster View
  const changeRosterDate = (offsetDays: number) => {
    const d = new Date(`${rosterDate}T00:00:00`);
    d.setDate(d.getDate() + offsetDays);
    setRosterDate(toYMD(d));
  };

  if (loading && records.length === 0) {
    return (
      <div className="attendance-hub min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading attendance control center...</p>
      </div>
    );
  }

  return (
    <div className="attendance-hub min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Workforce Operations</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] font-bold">Attendance & Timesheets</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            Time & Attendance Hub
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
              Complete Historical Logs
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track daily check-ins, view past dates & monthly timesheet matrix, analyze punctuality, and backdate entries.
          </p>
        </div>

        {/* Live Digital Clock & Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Live Digital Clock Widget */}
          <div className="bg-white border border-gray-200/80 rounded-2xl px-4 py-2 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center text-sm shadow-xs">
              <i className="ri-time-line" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 leading-tight">
                {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
              <p className="text-[10px] font-bold text-gray-400">
                {currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
            </div>
          </div>

          {/* Full Report in the Reports Center */}
          <Link
            to={`/reports?module=${activeTab === "summary" ? "attendance-summary" : "attendance"}${
              dateRangeBounds ? `&from=${dateRangeBounds.start}&to=${dateRangeBounds.end}` : "&from=&to="
            }`}
            title="Open the full Attendance Report in the Reports Center (PDF / CSV / Excel export)"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <i className="ri-file-chart-line text-[#253C7D] text-sm" />
            Full Report
          </Link>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <i className="ri-file-excel-2-line text-emerald-600 text-sm" />
            Export CSV
          </button>

          {/* Manual Log Button (Can choose any old date) */}
          <button
            onClick={() => {
              if (!canViewAll) setNewRecord((p) => ({ ...p, employee_id: myEmployee?.id || "" }));
              setShowLogModal(true);
            }}
            disabled={!canViewAll && !myEmployee}
            className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
          >
            <i className="ri-add-circle-line text-base font-bold" />
            Log Attendance
          </button>
        </div>
      </div>

      {/* Quick Self Check-In Banner (For Employees) */}
      {myEmployee && (
        <div className="bg-gradient-to-r from-[#253C7D] to-[#17254E] rounded-3xl p-5 sm:p-6 text-white shadow-md mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center font-bold text-base border border-white/20">
              {initials(myEmployee.first_name, myEmployee.last_name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-sky-200">Personal Punch Card</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                Welcome, {myEmployee.first_name} {myEmployee.last_name}
              </h3>
              <p className="text-xs text-white/70 mt-0.5">
                {myTodayRecord?.clock_in
                  ? `Checked in at ${formatTime(myTodayRecord.clock_in)} · ${
                      myTodayRecord.clock_out ? `Checked out at ${formatTime(myTodayRecord.clock_out)}` : "Currently Working"
                    }`
                  : "You haven't checked in today yet."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!myTodayRecord?.clock_in ? (
              <button
                onClick={handleQuickClockIn}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-98 flex items-center gap-2"
              >
                <i className="ri-login-circle-line text-base font-bold" />
                Check In Now
              </button>
            ) : !myTodayRecord?.clock_out ? (
              <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-xs font-semibold text-sky-100 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Currently Working
              </div>
            ) : (
              <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
                <i className="ri-checkbox-circle-fill text-emerald-400" />
                Shift Completed Today ({calcHours(myTodayRecord.clock_in, myTodayRecord.clock_out)})
              </div>
            )}
          </div>
        </div>
      )}

      {/* Executive KPI Bar (Dynamic based on selected date filter) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
        {/* Present */}
        <div
          onClick={() => {
            setFilterStatus("present");
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            filterStatus === "present" ? "border-emerald-500 ring-2 ring-emerald-500/15" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              {filterDatePreset === "today" ? "Present Today" : "Present (Period)"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i className="ri-user-follow-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{presentCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Logs in selected scope</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Working Now */}
        <div
          onClick={() => {
            setActiveTab("live");
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            activeTab === "live" ? "border-sky-500 ring-2 ring-sky-500/15" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">Working Now</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <i className="ri-macbook-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-sky-700 mt-2">{workingNow}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Active shifts today</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500" />
        </div>

        {/* Late Arrivals */}
        <div
          onClick={() => {
            setFilterStatus("late");
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            filterStatus === "late" ? "border-amber-500 ring-2 ring-amber-500/15" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Late Arrivals</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <i className="ri-alarm-warning-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{lateCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Tardiness records</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* Remote / WFH */}
        <div
          onClick={() => {
            setFilterStatus("remote");
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            filterStatus === "remote" ? "border-indigo-500 ring-2 ring-indigo-500/15" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Remote / WFH</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <i className="ri-home-office-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-700 mt-2">{remoteCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Off-site entries</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />
        </div>

        {/* Absent */}
        <div
          onClick={() => {
            setFilterStatus("absent");
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            filterStatus === "absent" ? "border-rose-500 ring-2 ring-rose-500/15" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Absent Logs</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <i className="ri-user-unfollow-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{absentCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Recorded absences</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>
      </div>

      {/* Control Bar: Tabs, View Switcher & Historical Filters */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60">
            <button
              onClick={() => setActiveTab("records")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "records" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-calendar-check-line text-sm" />
              <span>Attendance Records</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                  activeTab === "records" ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-200 text-gray-600"
                }`}
              >
                {filteredRecords.length}
              </span>
            </button>

            {canManage && (
              <button
                onClick={() => setActiveTab("live")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "live" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-broadcast-line text-sm text-emerald-600" />
                <span>Day Roster & Presence</span>
              </button>
            )}

            {canManage && (
              <button
                onClick={() => setActiveTab("matrix")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "matrix" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-grid-fill text-sm text-indigo-600" />
                <span>Monthly Timesheet Matrix</span>
              </button>
            )}

            {canManage && (
              <button
                onClick={() => setActiveTab("summary")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "summary" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-pie-chart-line text-sm" />
                <span>Punctuality & Scorecard</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters: Search, Historical Date Range Selector & Department Dropdown */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Search */}
          <div className="relative w-full sm:w-48">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, date..."
              className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-circle-fill text-xs" />
              </button>
            )}
          </div>

          {/* Historical Date Preset Dropdown */}
          {activeTab === "records" && (
            <select
              value={filterDatePreset}
              onChange={(e) => setFilterDatePreset(e.target.value as any)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold"
            >
              <option value="all">📅 All Historical Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="last_year">Last Year</option>
              <option value="single_date">Specific Date...</option>
              <option value="custom_range">Custom Date Range...</option>
            </select>
          )}

          {/* Single Historical Date Picker */}
          {activeTab === "records" && filterDatePreset === "single_date" && (
            <input
              type="date"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
            />
          )}

          {/* Custom Date Range Pickers (From Date -> To Date) */}
          {activeTab === "records" && filterDatePreset === "custom_range" && (
            <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="From"
                className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-[#253C7D]"
              />
              <span className="text-[10px] text-gray-400 font-bold">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="To"
                className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          )}

          {/* Department Filter */}
          {departments.length > 0 && canManage && (
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[125px] truncate font-medium"
            >
              <option value="all">All Depts</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          {activeTab === "records" && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          )}

          {/* View Mode Toggle */}
          {activeTab === "records" && (
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
              <button
                onClick={() => setViewMode("table")}
                title="Table View"
                className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "table" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-table-line" />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                title="Cards View"
                className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-layout-grid-fill" />
              </button>
            </div>
          )}

          {/* Reset Filters */}
          {(searchQuery || filterDepartment !== "all" || filterStatus !== "all" || filterDatePreset !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterDepartment("all");
                setFilterStatus("all");
                setFilterDatePreset("all");
                setFromDate("");
                setToDate("");
                setSingleDate(todayYMD);
              }}
              title="Reset Filters"
              className="px-2 py-1.5 text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <i className="ri-refresh-line text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ATTENDANCE RECORDS TAB                                                 */}
      {/* ========================================================================= */}
      {activeTab === "records" && (
        <div>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
              <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
                <i className="ri-calendar-close-line" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No Attendance Records Found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No entries match your selected date range and filter parameters. Try switching to "All Historical Dates" or adjusting your search.
              </p>
            </div>
          ) : viewMode === "table" ? (
            /* Table View */
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-5 py-3.5">Employee</th>
                      <th className="px-5 py-3.5">Department</th>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5">Check In</th>
                      <th className="px-5 py-3.5">Check Out</th>
                      <th className="px-5 py-3.5">Total Hours</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Notes</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagedRecords.map((r) => {
                      const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.present;
                      const emp = r.employees;
                      const isWorkingNow = r.clock_in && !r.clock_out && r.date === todayYMD;

                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedRecord(r)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                                {emp?.avatar_url ? (
                                  <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span>{initials(emp?.first_name, emp?.last_name)}</span>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 group-hover:text-[#253C7D] transition-colors">
                                  {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                                </p>
                                <p className="text-[11px] text-gray-400">{emp?.role || "Team Member"}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="font-semibold text-gray-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                              {emp?.department || "General"}
                            </span>
                            {emp?.branches?.name && (
                              <span className="text-gray-400 block text-[10px] mt-0.5">{emp.branches.name}</span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900">
                            {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="font-bold text-gray-800">{formatTime(r.clock_in)}</span>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {isWorkingNow ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold text-[10px] animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                Working Now
                              </span>
                            ) : (
                              <span className="font-bold text-gray-800">{formatTime(r.clock_out)}</span>
                            )}
                            {r.early_leave_minutes && r.early_leave_minutes > 0 ? (
                              <span className="block text-[10px] font-semibold text-amber-600">
                                ({r.early_leave_minutes}m early)
                              </span>
                            ) : null}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-gray-600">
                            {calcHours(r.clock_in, r.clock_out)}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                            >
                              <i className={cfg.icon} />
                              {cfg.label}
                              {r.status === "late" && r.late_minutes > 0 && ` (+${r.late_minutes}m)`}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 max-w-[180px] truncate text-gray-400 text-[11px]">
                            {r.notes || "—"}
                          </td>

                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => setEditingRecord(r)}
                                title="Edit Record"
                                className="p-1.5 text-gray-500 hover:text-[#253C7D] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <i className="ri-edit-line text-sm" />
                              </button>
                              {canManage && (
                                <button
                                  onClick={() => handleDeleteRecord(r.id)}
                                  title="Delete Record"
                                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <i className="ri-delete-bin-line text-sm" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pagedRecords.map((r) => {
                const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.present;
                const emp = r.employees;
                const isWorkingNow = r.clock_in && !r.clock_out && r.date === todayYMD;

                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                            {emp?.avatar_url ? (
                              <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{initials(emp?.first_name, emp?.last_name)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors truncate text-sm">
                              {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                            </h4>
                            <p className="text-[11px] text-gray-400 truncate">{emp?.role || "Team Member"}</p>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          {cfg.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 rounded-2xl text-center mb-3">
                        <div>
                          <span className="text-[9px] font-bold text-gray-400 uppercase block">Check In</span>
                          <span className="text-xs font-bold text-gray-800">{formatTime(r.clock_in)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-gray-400 uppercase block">Check Out</span>
                          <span className="text-xs font-bold text-gray-800">
                            {isWorkingNow ? "Active" : formatTime(r.clock_out)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-gray-400 uppercase block">Hours</span>
                          <span className="text-xs font-bold text-[#253C7D]">
                            {calcHours(r.clock_in, r.clock_out)}
                          </span>
                        </div>
                      </div>

                      {r.notes && (
                        <p className="text-[11px] text-gray-500 line-clamp-2 bg-slate-50 p-2 rounded-xl border border-gray-100">
                          {r.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3 text-[11px] text-gray-400">
                      <span>{new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span className="font-semibold text-gray-600">{emp?.department || "General"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 mt-4 bg-white border border-gray-100 rounded-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-[11px] text-gray-500">
                Showing <span className="font-semibold text-gray-700">{pageStart}</span>–<span className="font-semibold text-gray-700">{pageEnd}</span> of <span className="font-semibold text-gray-700">{filteredRecords.length}</span> attendance records
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400">Per page</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-[11px] bg-white text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage === 1}
                aria-label="Previous page"
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <i className="ri-arrow-left-s-line" />
              </button>
              {pageWindow(safePage, totalPages).map((pageNumber, index) =>
                pageNumber === "..." ? (
                  <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center text-[11px] text-gray-400">…</span>
                ) : (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    aria-label={`Page ${pageNumber}`}
                    aria-current={pageNumber === safePage ? "page" : undefined}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${pageNumber === safePage ? "bg-[#253C7D] text-white" : "text-gray-600 hover:bg-gray-100"}`}
                  >
                    {pageNumber}
                  </button>
                )
              )}
              <button
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={safePage === totalPages}
                aria-label="Next page"
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <i className="ri-arrow-right-s-line" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DAY ROSTER & PRESENCE TAB (Choose ANY Historical Date!)                */}
      {/* ========================================================================= */}
      {activeTab === "live" && (
        <div>
          {/* Historical Date Selector Toolbar */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeRosterDate(-1)}
                className="w-8 h-8 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
                title="Previous Day"
              >
                <i className="ri-arrow-left-s-line text-base font-bold" />
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={rosterDate}
                  onChange={(e) => setRosterDate(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                />
                {rosterDate !== todayYMD && (
                  <button
                    onClick={() => setRosterDate(todayYMD)}
                    className="px-3 py-1.5 bg-[#253C7D]/10 text-[#253C7D] hover:bg-[#253C7D]/20 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Jump to Today
                  </button>
                )}
              </div>

              <button
                onClick={() => changeRosterDate(1)}
                disabled={rosterDate >= todayYMD}
                className="w-8 h-8 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next Day"
              >
                <i className="ri-arrow-right-s-line text-base font-bold" />
              </button>
            </div>

            <div className="text-xs text-gray-500 font-semibold">
              Viewing Roster for:{" "}
              <span className="font-extrabold text-gray-900">
                {new Date(rosterDate + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Cards for this specific Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSummary.map((emp) => {
              const rRecord = emp.rosterRecord;
              const isPresent = rRecord?.status === "present" || rRecord?.status === "remote";
              const isLate = rRecord?.status === "late";
              const isWorking = rRecord?.clock_in && !rRecord?.clock_out && rosterDate === todayYMD;
              const isDone = rRecord?.clock_in && rRecord?.clock_out;

              return (
                <div
                  key={emp.id}
                  className={`bg-white rounded-3xl border p-5 shadow-2xs transition-all relative overflow-hidden flex flex-col justify-between ${
                    isWorking
                      ? "border-emerald-300 ring-2 ring-emerald-400/20"
                      : isLate
                      ? "border-amber-300"
                      : isDone
                      ? "border-gray-200/80"
                      : "border-gray-200/60 bg-gray-50/40"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-sm overflow-hidden shadow-xs">
                            {emp.avatar_url ? (
                              <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{initials(emp.first_name, emp.last_name)}</span>
                            )}
                          </div>
                          <span
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                              isWorking
                                ? "bg-emerald-500 animate-ping"
                                : isDone
                                ? "bg-sky-500"
                                : isLate
                                ? "bg-amber-500"
                                : "bg-gray-300"
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <Link
                            to={`/employees/${emp.id}`}
                            className="font-extrabold text-gray-900 hover:text-[#253C7D] transition-colors truncate text-sm block"
                          >
                            {emp.first_name} {emp.last_name}
                          </Link>
                          <p className="text-[11px] text-gray-400 truncate">{emp.role}</p>
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.2 rounded-md inline-block mt-0.5">
                            {emp.department}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Banner */}
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs mb-2">
                      {rRecord ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-[11px]">Check In:</span>
                            <span className="font-bold text-gray-900">{formatTime(rRecord.clock_in)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-[11px]">Check Out:</span>
                            <span className="font-bold text-gray-900">
                              {isWorking ? (
                                <span className="text-emerald-600 font-bold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Working Now
                                </span>
                              ) : (
                                formatTime(rRecord.clock_out)
                              )}
                            </span>
                          </div>
                          {rRecord.clock_in && rRecord.clock_out && (
                            <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                              <span className="text-gray-500 text-[11px]">Worked:</span>
                              <span className="font-bold text-[#253C7D]">
                                {calcHours(rRecord.clock_in, rRecord.clock_out)}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-center text-[11px] font-medium py-1">
                          No record on this date
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Stats */}
                  <div className="flex items-center justify-between text-[11px] pt-3 border-t border-gray-100 text-gray-400">
                    <span>Attendance: {emp.attendanceRate}%</span>
                    <span className="text-[#253C7D] font-bold">{emp.totalHours}h logged</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MONTHLY TIMESHEET MATRIX TAB (Select ANY Year & Month!)                */}
      {/* ========================================================================= */}
      {activeTab === "matrix" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <i className="ri-grid-fill text-[#253C7D]" />
                Monthly Attendance Timesheet Matrix
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Full month view across all days for each employee
              </p>
            </div>

            {/* Month Picker */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500">Select Month:</label>
              <input
                type="month"
                value={matrixMonth}
                onChange={(e) => setMatrixMonth(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold text-gray-500 uppercase">
                  <th className="px-4 py-3 sticky left-0 bg-gray-50 z-10 min-w-[180px] shadow-xs">
                    Employee
                  </th>
                  {matrixDays.map((d) => (
                    <th
                      key={d.dateStr}
                      className={`px-1.5 py-2 text-center min-w-[28px] ${
                        d.isWeekend ? "bg-slate-100 text-slate-400 font-semibold" : "text-gray-700"
                      }`}
                    >
                      <span className="block text-[9px] text-gray-400">{d.dayName}</span>
                      <span className="font-bold">{d.dayNum}</span>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center min-w-[60px]">Present</th>
                  <th className="px-3 py-3 text-center min-w-[60px]">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSummary.map((emp) => {
                  const empMonthRecords = records.filter(
                    (r) => r.employee_id === emp.id && r.date.startsWith(matrixMonth)
                  );
                  const monthPresent = empMonthRecords.filter(
                    (r) => r.status === "present" || r.status === "remote" || r.status === "late"
                  ).length;
                  const monthHours = empMonthRecords
                    .reduce((acc, r) => acc + calcHoursNum(r.clock_in, r.clock_out), 0)
                    .toFixed(1);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-2.5 sticky left-0 bg-white z-10 shadow-xs whitespace-nowrap">
                        <p className="font-bold text-gray-900 text-xs">
                          {emp.first_name} {emp.last_name}
                        </p>
                        <p className="text-[10px] text-gray-400">{emp.department}</p>
                      </td>

                      {matrixDays.map((d) => {
                        const rec = empMonthRecords.find((r) => r.date === d.dateStr);
                        const cfg = rec ? STATUS_CONFIG[rec.status] : null;

                        return (
                          <td
                            key={d.dateStr}
                            className={`p-1 text-center ${d.isWeekend ? "bg-slate-50/60" : ""}`}
                          >
                            {rec ? (
                              <button
                                onClick={() => setSelectedRecord(rec)}
                                title={`${emp.first_name} ${emp.last_name} · ${d.dateStr}: ${cfg?.label} (${formatTime(
                                  rec.clock_in
                                )} - ${formatTime(rec.clock_out)})`}
                                className={`w-6 h-6 rounded-md text-[9px] font-black uppercase flex items-center justify-center mx-auto transition-transform hover:scale-115 cursor-pointer ${
                                  cfg ? `${cfg.bg} ${cfg.text} border ${cfg.border}` : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {cfg?.short || "•"}
                              </button>
                            ) : (
                              <span className="text-gray-200 text-[10px]">—</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="px-3 py-2.5 text-center font-bold text-emerald-700 bg-emerald-50/50">
                        {monthPresent}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-[#253C7D] bg-blue-50/50">
                        {monthHours}h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. EMPLOYEE PUNCTUALITY & SCORECARD TAB                                   */}
      {/* ========================================================================= */}
      {activeTab === "summary" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <i className="ri-pie-chart-line text-[#253C7D]" />
                Employee Attendance Performance & Ratings
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Aggregate metrics, on-time percentage, total logged hours, and tardiness records
              </p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/60">
              {filteredSummary.length} Employees Analyzed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5 text-center">Days Logged</th>
                  <th className="px-5 py-3.5 text-center">Present</th>
                  <th className="px-5 py-3.5 text-center">Late</th>
                  <th className="px-5 py-3.5 text-center">Absent</th>
                  <th className="px-5 py-3.5 text-center">Total Hours</th>
                  <th className="px-5 py-3.5">Total Lost Late Time</th>
                  <th className="px-5 py-3.5">Attendance Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSummary.map((emp) => {
                  const rate = emp.attendanceRate;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                            {emp.avatar_url ? (
                              <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{initials(emp.first_name, emp.last_name)}</span>
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/employees/${emp.id}`}
                              className="font-bold text-gray-900 hover:text-[#253C7D] transition-colors"
                            >
                              {emp.first_name} {emp.last_name}
                            </Link>
                            <p className="text-[11px] text-gray-400">{emp.role}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-semibold text-gray-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                          {emp.department}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center font-bold text-gray-900">{emp.totalDays}</td>

                      <td className="px-5 py-3.5 text-center">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {emp.present}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md ${
                            emp.late > 0 ? "text-amber-700 bg-amber-50" : "text-gray-400"
                          }`}
                        >
                          {emp.late}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md ${
                            emp.absent > 0 ? "text-rose-700 bg-rose-50" : "text-gray-400"
                          }`}
                        >
                          {emp.absent}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center font-bold text-[#253C7D]">{emp.totalHours}h</td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">
                        {emp.totalLateMinutes > 0 ? (
                          <span className="text-amber-600 font-semibold">
                            {Math.floor(emp.totalLateMinutes / 60)}h {emp.totalLateMinutes % 60}m
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all rounded-full ${
                                rate >= 90 ? "bg-emerald-500" : rate >= 75 ? "bg-amber-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="font-bold text-gray-800 text-xs">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SIDE DRAWER: RECORD DETAIL                                                */}
      {/* ========================================================================= */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedRecord(null)}
          />
          <div className="relative w-full sm:w-[440px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Attendance Log Details</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(selectedRecord.date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
                >
                  <i className="ri-close-line text-lg" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-5">
                {/* Employee Card */}
                {selectedRecord.employees && (
                  <div className="flex items-center gap-3.5 p-4 bg-slate-50 rounded-2xl border border-gray-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden">
                      {selectedRecord.employees.avatar_url ? (
                        <img src={selectedRecord.employees.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{initials(selectedRecord.employees.first_name, selectedRecord.employees.last_name)}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-sm">
                        {selectedRecord.employees.first_name} {selectedRecord.employees.last_name}
                      </h4>
                      <p className="text-xs text-gray-500">{selectedRecord.employees.role}</p>
                      <p className="text-[11px] text-gray-400">{selectedRecord.employees.department}</p>
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Attendance Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      STATUS_CONFIG[selectedRecord.status]?.bg
                    } ${STATUS_CONFIG[selectedRecord.status]?.text} border ${
                      STATUS_CONFIG[selectedRecord.status]?.border
                    }`}
                  >
                    <i className={STATUS_CONFIG[selectedRecord.status]?.icon} />
                    {STATUS_CONFIG[selectedRecord.status]?.label}
                  </span>
                </div>

                {/* Check In / Out Time Matrix */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Check In
                    </span>
                    <p className="text-lg font-black text-gray-900 mt-1">
                      {formatTime(selectedRecord.clock_in)}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Check Out
                    </span>
                    <p className="text-lg font-black text-gray-900 mt-1">
                      {formatTime(selectedRecord.clock_out)}
                    </p>
                  </div>
                </div>

                {/* Hours Summary Card */}
                <div className="p-4 bg-[#253C7D]/5 border border-[#253C7D]/15 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#253C7D] uppercase tracking-wider block">
                      Shift Total Duration
                    </span>
                    <p className="text-xl font-black text-[#253C7D] mt-0.5">
                      {calcHours(selectedRecord.clock_in, selectedRecord.clock_out)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#253C7D] text-white flex items-center justify-center">
                    <i className="ri-hourglass-2-line text-lg" />
                  </div>
                </div>

                {/* Late arrival box */}
                {selectedRecord.status === "late" && selectedRecord.late_minutes > 0 && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                    <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <i className="ri-alarm-warning-line" />
                      Late Arrival Recorded
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {selectedRecord.late_minutes} minutes past standard shift start time
                    </p>
                  </div>
                )}

                {/* Notes box */}
                {selectedRecord.notes && (
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Supervisor / Attendance Remarks
                    </span>
                    <p className="text-xs text-gray-700 bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
                      {selectedRecord.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="p-6 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setEditingRecord(selectedRecord);
                }}
                className="flex-1 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <i className="ri-edit-line" />
                Edit Record
              </button>

              {canManage && (
                <button
                  onClick={() => handleDeleteRecord(selectedRecord.id)}
                  className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                  title="Delete record"
                >
                  <i className="ri-delete-bin-line text-base" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANUAL LOG ATTENDANCE (Supports any Historical / Past Date!)       */}
      {/* ========================================================================= */}
      {showLogModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !saving && setShowLogModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
                  <i className="ri-time-line" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Log Attendance Record</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Manually record or backdate an entry</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveNewRecord} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Employee <span className="text-rose-500">*</span>
                </label>
                {canManage ? (
                  <EmployeeSearchSelect
                    employees={employees}
                    value={newRecord.employee_id}
                    onChange={(id) => setNewRecord({ ...newRecord, employee_id: id })}
                  />
                ) : (
                  <div className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800">
                    {myEmployee ? `${myEmployee.first_name} ${myEmployee.last_name} — ${myEmployee.department}` : "—"}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Date (Past or Present) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Status
                  </label>
                  <select
                    value={newRecord.status}
                    onChange={(e) => setNewRecord({ ...newRecord, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {newRecord.status !== "absent" && newRecord.status !== "holiday" && (
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Check In Time
                    </label>
                    <input
                      type="time"
                      value={newRecord.clock_in}
                      onChange={(e) => setNewRecord({ ...newRecord, clock_in: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Check Out Time
                    </label>
                    <input
                      type="time"
                      value={newRecord.clock_out}
                      onChange={(e) => setNewRecord({ ...newRecord, clock_out: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                    />
                  </div>
                </div>
              )}

              {newRecord.status === "late" && (
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Minutes Late
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newRecord.late_minutes}
                    onChange={(e) => setNewRecord({ ...newRecord, late_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Notes / Reason
                </label>
                <textarea
                  rows={2}
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                  placeholder="Optional supervisor notes, reason for late/remote..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newRecord.employee_id || !newRecord.date}
                  className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT ATTENDANCE RECORD                                             */}
      {/* ========================================================================= */}
      {editingRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !saving && setEditingRecord(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
                  <i className="ri-edit-line" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Edit Attendance Record</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {editingRecord.employees?.first_name} {editingRecord.employees?.last_name} · {editingRecord.date}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleUpdateRecord} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Status
                </label>
                <select
                  value={editingRecord.status}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Check In Time
                  </label>
                  <input
                    type="time"
                    value={editingRecord.clock_in || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, clock_in: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Check Out Time
                  </label>
                  <input
                    type="time"
                    value={editingRecord.clock_out || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, clock_out: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              {editingRecord.status === "late" && (
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Minutes Late
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingRecord.late_minutes}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, late_minutes: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={editingRecord.notes || ""}
                  onChange={(e) => setEditingRecord({ ...editingRecord, notes: e.target.value })}
                  placeholder="Reason or supervisor notes..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
