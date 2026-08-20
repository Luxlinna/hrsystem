import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";

// Local (not UTC) YYYY-MM-DD to avoid timezone shifting
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateDisplay(dStr: string): string {
  if (!dStr) return "";
  const [y, m, d] = dStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateShort(dStr: string): string {
  if (!dStr) return "";
  const [y, m, d] = dStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  reason: string | null;
  created_at: string;
  employees?: {
    id?: string;
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    avatar_url: string | null;
    email?: string;
  } | null;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  annual_leave_days?: number;
  avatar_url?: string | null;
  email?: string;
  branch_id?: string;
}

const LEAVE_TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; bg: string; text: string; border: string; badgeBg: string; barBg: string }
> = {
  annual: {
    label: "Annual Leave",
    icon: "ri-sun-line",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "text-emerald-700",
    border: "border-emerald-200",
    badgeBg: "bg-emerald-100 text-emerald-800",
    barBg: "bg-emerald-500",
  },
  sick: {
    label: "Sick Leave",
    icon: "ri-heart-pulse-line",
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    text: "text-rose-700",
    border: "border-rose-200",
    badgeBg: "bg-rose-100 text-rose-800",
    barBg: "bg-rose-500",
  },
  maternity: {
    label: "Maternity Leave",
    icon: "ri-parent-line",
    bg: "bg-pink-50 text-pink-700 border-pink-200",
    text: "text-pink-700",
    border: "border-pink-200",
    badgeBg: "bg-pink-100 text-pink-800",
    barBg: "bg-pink-500",
  },
  paternity: {
    label: "Paternity Leave",
    icon: "ri-user-heart-line",
    bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    text: "text-indigo-700",
    border: "border-indigo-200",
    badgeBg: "bg-indigo-100 text-indigo-800",
    barBg: "bg-indigo-500",
  },
  unpaid: {
    label: "Unpaid Leave",
    icon: "ri-pause-circle-line",
    bg: "bg-slate-100 text-slate-700 border-slate-200",
    text: "text-slate-700",
    border: "border-slate-200",
    badgeBg: "bg-slate-200 text-slate-800",
    barBg: "bg-slate-500",
  },
  bereavement: {
    label: "Bereavement",
    icon: "ri-empathize-line",
    bg: "bg-purple-50 text-purple-700 border-purple-200",
    text: "text-purple-700",
    border: "border-purple-200",
    badgeBg: "bg-purple-100 text-purple-800",
    barBg: "bg-purple-500",
  },
  study: {
    label: "Study Leave",
    icon: "ri-book-open-line",
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    text: "text-amber-700",
    border: "border-amber-200",
    badgeBg: "bg-amber-100 text-amber-800",
    barBg: "bg-amber-500",
  },
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function LeaveCalendar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, isAdmin, loading: permsLoading } = usePermissions();

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  // Date Navigation
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  // View Modes
  const [viewMode, setViewMode] = useState<"month" | "timeline" | "agenda">("month");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"approved" | "pending" | "all">("approved");

  // Agenda Pagination
  const [agendaPage, setAgendaPage] = useState(1);
  const [agendaPageSize, setAgendaPageSize] = useState(8);

  // Interactive Modals
  const [inspectLeave, setInspectLeave] = useState<LeaveRequest | null>(null);
  const [dayLeavesModal, setDayLeavesModal] = useState<{ day: number; leaves: LeaveRequest[] } | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Quick Request Form State
  const [formData, setFormData] = useState({
    employee_id: "",
    leave_type: "annual",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const canViewAll = isAdmin || role?.leave_view_all_employees || false;
  const canViewOwnBranch = role?.leave_view_own_branch || false;
  const canManage = canViewAll || canViewOwnBranch;

  const todayStr = toYMD(new Date());

  const normalizeLeave = (l: LeaveRequest): LeaveRequest => {
    const isCancelled =
      l.status === "cancelled" ||
      (l.status === "rejected" &&
        (l.reason?.startsWith("[Cancelled") ||
          l.reason?.includes("[Cancelled by employee]") ||
          l.reason?.includes("(Cancelled:")));
    return isCancelled ? { ...l, status: "cancelled" } : l;
  };

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      // Load current employee profile
      if (user?.email) {
        const { data: me } = await supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, annual_leave_days, avatar_url, branch_id, email")
          .eq("email", user.email)
          .maybeSingle();
        setMyEmployee(me);
      }

      // Load active employees list for selectors & timeline
      const { data: empList } = await supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, annual_leave_days, avatar_url, email, branch_id")
        .eq("status", "active")
        .order("first_name");
      setEmployees(empList || []);

      // Fetch all leave requests
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
  };

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
  }, [permsLoading, user?.email]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Unique departments from active employees
  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department).filter(Boolean));
    return Array.from(set).sort();
  }, [employees]);

  // Filtered leaves according to user controls
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      // Exclude cancelled leaves from calendar schedules
      if (l.status === "cancelled") return false;

      // Status filter
      if (statusFilter !== "all" && l.status !== statusFilter) return false;

      // Department filter
      if (deptFilter !== "all" && l.employees?.department !== deptFilter) return false;

      // Leave Type filter
      if (typeFilter !== "all" && l.leave_type !== typeFilter) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${l.employees?.first_name || ""} ${l.employees?.last_name || ""}`.toLowerCase();
        const dept = (l.employees?.department || "").toLowerCase();
        const roleName = (l.employees?.role || "").toLowerCase();
        const reason = (l.reason || "").toLowerCase();
        const typeLabel = (LEAVE_TYPE_CONFIG[l.leave_type]?.label || l.leave_type).toLowerCase();
        if (
          !fullName.includes(q) &&
          !dept.includes(q) &&
          !roleName.includes(q) &&
          !reason.includes(q) &&
          !typeLabel.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [leaves, statusFilter, deptFilter, typeFilter, searchQuery]);

  const pageWindow = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };

  const totalAgendaPages = Math.max(1, Math.ceil(filteredLeaves.length / agendaPageSize));
  const safeAgendaPage = Math.min(agendaPage, totalAgendaPages);
  const pagedAgendaLeaves = useMemo(() => {
    const start = (safeAgendaPage - 1) * agendaPageSize;
    return filteredLeaves.slice(start, start + agendaPageSize);
  }, [filteredLeaves, safeAgendaPage, agendaPageSize]);

  // Date math
  const getDateStr = (d: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const getDayLeaves = (d: number) => {
    if (!d) return [];
    const dateStr = getDateStr(d);
    return filteredLeaves.filter((l) => dateStr >= l.start_date && dateStr <= l.end_date);
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calCells: number[] = [
    ...Array(firstDay).fill(0),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calCells.length % 7 !== 0) calCells.push(0);

  const isCurrentDayToday = (d: number) => {
    const now = new Date();
    return d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
  };

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  const jumpToToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDay(now.getDate());
  };

  // Leaves active today
  const leavesToday = useMemo(() => {
    return leaves.filter(
      (l) => l.status === "approved" && todayStr >= l.start_date && todayStr <= l.end_date
    );
  }, [leaves, todayStr]);

  // Approved in current viewed month
  const approvedInMonth = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return leaves.filter((l) => l.status === "approved" && l.start_date.startsWith(monthPrefix));
  }, [leaves, year, month]);

  // Total working days taken in month
  const totalDaysInMonth = useMemo(() => {
    return approvedInMonth.reduce((sum, l) => sum + (l.days || 0), 0);
  }, [approvedInMonth]);

  // Pending leaves across organization
  const pendingLeaves = useMemo(() => {
    return leaves.filter((l) => l.status === "pending");
  }, [leaves]);

  // Peak absence day in the current month
  const peakDayInfo = useMemo(() => {
    let maxCount = 0;
    let maxDay = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const count = getDayLeaves(d).length;
      if (count > maxCount) {
        maxCount = count;
        maxDay = d;
      }
    }
    return { day: maxDay, count: maxCount };
  }, [daysInMonth, filteredLeaves, year, month]);

  // Selected Day leaves list
  const selectedDayLeaves = selectedDay ? getDayLeaves(selectedDay) : [];

  // Upcoming leaves (next 30 days)
  const upcomingLeaves = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return leaves
      .filter((l) => {
        if (l.status !== "approved") return false;
        const s = new Date(l.start_date + "T00:00:00");
        const diff = (s.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 30;
      })
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .slice(0, 8);
  }, [leaves]);

  // Department leave impact breakdown for the viewed month
  const departmentStats = useMemo(() => {
    const counts: Record<string, { totalDays: number; staffCount: number; peopleAway: Set<string> }> = {};

    // Initialize departments
    departments.forEach((dept) => {
      counts[dept] = {
        totalDays: 0,
        staffCount: employees.filter((e) => e.department === dept).length,
        peopleAway: new Set(),
      };
    });

    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    leaves
      .filter((l) => l.status === "approved" && l.start_date.startsWith(monthPrefix))
      .forEach((l) => {
        const dept = l.employees?.department || "General";
        if (!counts[dept]) {
          counts[dept] = {
            totalDays: 0,
            staffCount: employees.filter((e) => e.department === dept).length || 1,
            peopleAway: new Set(),
          };
        }
        counts[dept].totalDays += l.days || 0;
        if (l.employee_id) counts[dept].peopleAway.add(l.employee_id);
      });

    return Object.entries(counts)
      .map(([dept, data]) => ({
        dept,
        totalDays: data.totalDays,
        staffCount: data.staffCount,
        awayCount: data.peopleAway.size,
        pctAway: data.staffCount > 0 ? Math.min(100, Math.round((data.peopleAway.size / data.staffCount) * 100)) : 0,
      }))
      .sort((a, b) => b.totalDays - a.totalDays);
  }, [leaves, year, month, departments, employees]);

  // Export Calendar Schedule to CSV
  const exportCalendarCSV = () => {
    const headers = [
      "Employee Name",
      "Department",
      "Role",
      "Leave Type",
      "Start Date",
      "End Date",
      "Days",
      "Status",
      "Reason",
    ];
    const rows = filteredLeaves.map((l) => [
      `"${l.employees?.first_name || ""} ${l.employees?.last_name || ""}"`,
      `"${l.employees?.department || ""}"`,
      `"${l.employees?.role || ""}"`,
      `"${LEAVE_TYPE_CONFIG[l.leave_type]?.label || l.leave_type}"`,
      l.start_date,
      l.end_date,
      l.days,
      l.status,
      `"${(l.reason || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `leave_schedule_${MONTHS[month].toLowerCase()}_${year}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate working days helper
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T00:00:00");
    if (e < s) return 0;
    let count = 0;
    const cur = new Date(s);
    while (cur <= e) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  // Quick Request Submit
  const handleQuickRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const empId = formData.employee_id || myEmployee?.id;
    if (!empId) {
      setToast({ type: "error", message: "Please select an employee" });
      return;
    }
    if (!formData.start_date || !formData.end_date) {
      setToast({ type: "error", message: "Please provide start and end dates" });
      return;
    }
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      setToast({ type: "error", message: "End date cannot be earlier than start date" });
      return;
    }

    setSubmitting(true);
    const days = calculateDays(formData.start_date, formData.end_date);
    const { error } = await supabase.from("leave_requests").insert({
      employee_id: empId,
      leave_type: formData.leave_type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      days,
      reason: formData.reason,
      status: "pending",
    });
    setSubmitting(false);

    if (error) {
      setToast({ type: "error", message: "Failed to submit request: " + error.message });
    } else {
      setToast({ type: "success", message: "Leave request submitted successfully" });
      setShowRequestModal(false);
      setFormData({
        employee_id: "",
        leave_type: "annual",
        start_date: "",
        end_date: "",
        reason: "",
      });
      loadData();
    }
  };

  const getInitials = (l: LeaveRequest) => {
    if (!l.employees) return "?";
    return `${l.employees.first_name?.[0] || ""}${l.employees.last_name?.[0] || ""}`.toUpperCase();
  };

  const getFullName = (l: LeaveRequest) => {
    if (!l.employees) return "Unknown";
    return `${l.employees.first_name} ${l.employees.last_name}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 left-4 right-4 sm:top-6 sm:right-6 sm:left-auto sm:max-w-sm z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md text-[13px] font-medium transition-all transform animate-in slide-in-from-top-4 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-700/50 text-emerald-100"
              : toast.type === "error"
              ? "bg-rose-950/90 border-rose-700/50 text-rose-100"
              : "bg-slate-900/90 border-slate-700/50 text-white"
          }`}
        >
          <i
            className={`${
              toast.type === "success"
                ? "ri-checkbox-circle-fill text-emerald-400"
                : toast.type === "error"
                ? "ri-error-warning-fill text-rose-400"
                : "ri-information-fill text-sky-400"
            } text-lg`}
          />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header & Quick Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#253C7D]/10 text-[#253C7D] tracking-wide uppercase">
              Schedule & Availability
            </span>
            <span className="text-gray-300">&bull;</span>
            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
              <i className="ri-time-line text-gray-400" />
              Live Sync
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <span>Leave Schedule Calendar</span>
          </h1>
          <p className="text-[13px] text-gray-500 mt-1 max-w-2xl">
            Visual team availability, department coverage tracking, and real-time absence planning.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Request Button */}
          <button
            onClick={() => {
              setFormData({
                employee_id: myEmployee?.id || "",
                leave_type: "annual",
                start_date: todayStr,
                end_date: todayStr,
                reason: "",
              });
              setShowRequestModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#253C7D] to-[#1E3066] hover:from-[#1E3066] hover:to-[#172554] text-white text-[13px] font-bold rounded-2xl shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <i className="ri-add-line text-base font-bold" />
            <span>Request Leave</span>
          </button>

          {/* Navigate to Leave Management Hub */}
          <Link
            to="/leave"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[13px] font-bold rounded-2xl transition-all cursor-pointer"
          >
            <i className="ri-file-list-3-line text-base" />
            <span>Manage Leave Hub</span>
            <i className="ri-arrow-right-line text-gray-500" />
          </Link>

          {/* Export CSV */}
          <button
            onClick={exportCalendarCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-[12px] font-semibold rounded-2xl transition-colors cursor-pointer"
            title="Export this schedule to CSV"
          >
            <i className="ri-download-2-line text-sm text-gray-500" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Out of Office Today */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-sm relative overflow-hidden group hover:border-[#253C7D]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
              Out Of Office Today
            </span>
            <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <i className="ri-user-unfollow-line text-base" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {leavesToday.length}
            </span>
            <span className="text-xs font-semibold text-gray-500">
              {leavesToday.length === 1 ? "person away" : "people away"}
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-1.5 overflow-hidden">
            {leavesToday.length === 0 ? (
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <i className="ri-checkbox-circle-fill" /> Full team present today
              </span>
            ) : (
              <div className="flex items-center -space-x-1.5">
                {leavesToday.slice(0, 4).map((l) => (
                  <div
                    key={l.id}
                    title={`${getFullName(l)} (${l.employees?.department || ""})`}
                    className="w-6 h-6 rounded-full bg-[#253C7D] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white overflow-hidden"
                  >
                    {l.employees?.avatar_url ? (
                      <img src={l.employees.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(l)
                    )}
                  </div>
                ))}
                {leavesToday.length > 4 && (
                  <span className="text-[10px] text-gray-500 font-bold pl-2.5">
                    +{leavesToday.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Approved Leaves in View Month */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-sm relative overflow-hidden group hover:border-[#253C7D]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
              {MONTHS[month].slice(0, 3)} Approved Leaves
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i className="ri-calendar-check-line text-base" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {approvedInMonth.length}
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {totalDaysInMonth} total days
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>Avg duration:</span>
            <span className="font-bold text-gray-800">
              {approvedInMonth.length > 0
                ? (totalDaysInMonth / approvedInMonth.length).toFixed(1)
                : 0}{" "}
              days/request
            </span>
          </div>
        </div>

        {/* Pending Review Alerts */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-sm relative overflow-hidden group hover:border-[#253C7D]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
              Pending Review
            </span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <i className="ri-hourglass-line text-base" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {pendingLeaves.length}
            </span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Awaiting review
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-gray-500">Quick action:</span>
            {pendingLeaves.length > 0 ? (
              <Link
                to="/leave?status=pending"
                className="font-bold text-[#253C7D] hover:underline flex items-center gap-0.5"
              >
                Review all &rarr;
              </Link>
            ) : (
              <span className="font-semibold text-gray-400">All clear</span>
            )}
          </div>
        </div>

        {/* Peak Absence Day */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-sm relative overflow-hidden group hover:border-[#253C7D]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
              Peak Leave Day
            </span>
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <i className="ri-bar-chart-2-line text-base" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {peakDayInfo.count > 0 ? `${MONTHS[month].slice(0, 3)} ${peakDayInfo.day}` : "None"}
            </span>
            {peakDayInfo.count > 0 && (
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                {peakDayInfo.count} away
              </span>
            )}
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>Coverage status:</span>
            <span className="font-bold text-emerald-600">Monitored</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Month Navigator, View Mode Switcher & Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Month/Year Picker & Jump to Today */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-gray-100/80 rounded-2xl p-1 border border-gray-200/60">
              <button
                onClick={prevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white text-gray-600 hover:text-gray-900 transition-all cursor-pointer shadow-none hover:shadow-sm"
                title="Previous Month"
              >
                <i className="ri-arrow-left-s-line text-lg" />
              </button>
              <span className="px-2 sm:px-4 text-sm sm:text-base font-extrabold text-gray-900 min-w-[110px] sm:min-w-[150px] text-center">
                {MONTHS[month]} {year}
              </span>
              <button
                onClick={nextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white text-gray-600 hover:text-gray-900 transition-all cursor-pointer shadow-none hover:shadow-sm"
                title="Next Month"
              >
                <i className="ri-arrow-right-s-line text-lg" />
              </button>
            </div>

            <button
              onClick={jumpToToday}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-2xl transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* View Mode Switcher (Month Grid / Timeline Matrix / Agenda List) —
              full-width equal thirds on phones (labels shorten to fit),
              back to a natural-width inline segmented control from sm: up. */}
          <div className="grid grid-cols-3 sm:inline-flex sm:items-center bg-gray-100/80 p-1 rounded-2xl border border-gray-200/60 self-start md:self-auto w-full sm:w-auto">
            <button
              onClick={() => setViewMode("month")}
              className={`inline-flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === "month"
                  ? "bg-white text-[#253C7D] shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-calendar-line text-sm" />
              <span className="hidden sm:inline">Month Grid</span>
              <span className="sm:hidden">Month</span>
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`inline-flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === "timeline"
                  ? "bg-white text-[#253C7D] shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-git-commit-line text-sm" />
              <span className="hidden sm:inline">Team Timeline</span>
              <span className="sm:hidden">Timeline</span>
            </button>
            <button
              onClick={() => setViewMode("agenda")}
              className={`inline-flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === "agenda"
                  ? "bg-white text-[#253C7D] shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-list-check text-sm" />
              <span className="hidden sm:inline">Agenda List</span>
              <span className="sm:hidden">Agenda</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="pt-3 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
          {/* Left: Status Toggles — wraps on phones instead of hiding behind
              a sideways scroll; single scrollable row again from md: up. */}
          <div className="flex items-center flex-wrap md:flex-nowrap gap-1.5 md:overflow-x-auto md:pb-1">
            {[
              { id: "approved", label: "Approved Only", icon: "ri-checkbox-circle-line" },
              { id: "pending", label: "Include Pending", icon: "ri-time-line" },
              { id: "all", label: "All Active", icon: "ri-apps-line" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id as any)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === s.id
                    ? "bg-[#253C7D] text-white shadow-sm"
                    : "bg-gray-100/80 text-gray-600 hover:bg-gray-200/80"
                }`}
              >
                <i className={`${s.icon} text-xs`} />
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Right: Dropdowns & Live Search — an explicit stacked layout on
              phones (full-width search, then the two selects sharing a row)
              reads far cleaner than letting flex-wrap decide, which left the
              search box starved of width alongside two shrink-resistant
              selects. Reverts to one natural-width row from sm: up. */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-56">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff, dept, reason..."
                className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-gray-200 text-[12px] bg-white text-gray-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  <i className="ri-close-line" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Department */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="flex-1 sm:flex-none min-w-0 px-2.5 py-1.5 rounded-xl border border-gray-200 text-[12px] bg-white text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {/* Leave Type */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex-1 sm:flex-none min-w-0 px-2.5 py-1.5 rounded-xl border border-gray-200 text-[12px] bg-white text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="all">All Leave Types</option>
                {Object.entries(LEAVE_TYPE_CONFIG).map(([type, cfg]) => (
                  <option key={type} value={type}>
                    {cfg.label}
                  </option>
                ))}
              </select>

              {/* Reset */}
              {(deptFilter !== "all" || typeFilter !== "all" || statusFilter !== "approved" || searchQuery) && (
                <button
                  onClick={() => {
                    setDeptFilter("all");
                    setTypeFilter("all");
                    setStatusFilter("approved");
                    setSearchQuery("");
                  }}
                  className="shrink-0 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Reset filters"
                >
                  <i className="ri-refresh-line" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout (2/3 Calendar + 1/3 Side Intelligence Widgets) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main View Area */}
        <div className="xl:col-span-2 space-y-6">
          {/* ===================== VIEW 1: MONTH GRID ===================== */}
          {viewMode === "month" && (
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/70">
                {DAYS.map((d, i) => (
                  <div
                    key={d}
                    className={`py-3 text-center text-[11px] font-bold uppercase tracking-wider ${
                      i === 0 || i === 6 ? "text-rose-500/80 bg-rose-50/30" : "text-gray-500"
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Grid Cells */}
              <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
                {calCells.map((d, i) => {
                  const dayLeaves = d ? getDayLeaves(d) : [];
                  const isTd = d ? isCurrentDayToday(d) : false;
                  const isSelected = d > 0 && d === selectedDay;
                  const isWeekend = i % 7 === 0 || i % 7 === 6;

                  return (
                    <div
                      key={i}
                      onClick={() => {
                        if (d > 0) setSelectedDay(d === selectedDay ? null : d);
                      }}
                      className={`min-h-[100px] sm:min-h-[115px] p-2 transition-all relative flex flex-col justify-between group ${
                        d === 0
                          ? "bg-gray-50/40 cursor-default"
                          : isSelected
                          ? "bg-[#253C7D]/5 ring-2 ring-inset ring-[#253C7D] cursor-pointer"
                          : isTd
                          ? "bg-amber-50/30 hover:bg-amber-50/60 cursor-pointer"
                          : isWeekend
                          ? "bg-slate-50/50 hover:bg-slate-100/60 cursor-pointer"
                          : "bg-white hover:bg-gray-50/80 cursor-pointer"
                      }`}
                    >
                      {d > 0 && (
                        <>
                          {/* Day Number Header */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all ${
                                isTd
                                  ? "bg-[#253C7D] text-white shadow-sm"
                                  : isSelected
                                  ? "bg-indigo-100 text-[#253C7D]"
                                  : "text-gray-700 group-hover:bg-gray-200/70"
                              }`}
                            >
                              {d}
                            </span>
                            {dayLeaves.length > 0 && (
                              <span className="text-[10px] font-extrabold text-gray-400">
                                {dayLeaves.length} away
                              </span>
                            )}
                          </div>

                          {/* Leave Chips Container */}
                          <div className="mt-1 space-y-1 overflow-hidden flex-1">
                            {dayLeaves.slice(0, 3).map((l) => {
                              const cfg = LEAVE_TYPE_CONFIG[l.leave_type] || {
                                label: l.leave_type,
                                bg: "bg-gray-100 text-gray-700 border-gray-200",
                                barBg: "bg-gray-400",
                              };
                              return (
                                <div
                                  key={l.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInspectLeave(l);
                                  }}
                                  className={`px-1.5 py-0.5 rounded-lg text-[10px] font-semibold border flex items-center justify-between gap-1 truncate transition-all hover:scale-[1.02] shadow-2xs ${cfg.bg}`}
                                  title={`${getFullName(l)} (${cfg.label}) — ${l.start_date} to ${l.end_date}`}
                                >
                                  <div className="flex items-center gap-1 min-w-0 truncate">
                                    <span className="w-3.5 h-3.5 rounded-full bg-white text-gray-700 flex items-center justify-center font-bold text-[8px] shrink-0 overflow-hidden">
                                      {l.employees?.avatar_url ? (
                                        <img src={l.employees.avatar_url} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        getInitials(l)
                                      )}
                                    </span>
                                    <span className="truncate">{l.employees?.first_name}</span>
                                  </div>
                                  {l.status === "pending" && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Pending" />
                                  )}
                                </div>
                              );
                            })}

                            {/* +N More Popover Trigger */}
                            {dayLeaves.length > 3 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDayLeavesModal({ day: d, leaves: dayLeaves });
                                }}
                                className="w-full text-center py-0.5 text-[9px] font-bold text-[#253C7D] hover:underline bg-indigo-50/80 rounded-md cursor-pointer"
                              >
                                +{dayLeaves.length - 3} more
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================== VIEW 2: TEAM TIMELINE (GANTT) ===================== */}
          {viewMode === "timeline" && (
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Team Schedule Matrix &bull; {MONTHS[month]} {year}
                  </h3>
                  <p className="text-[11px] text-gray-500">Horizontal presence map across all active staff</p>
                </div>
                <span className="text-xs font-semibold text-gray-500">
                  {employees.length} active staff
                </span>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Timeline Days Header */}
                  <div className="grid grid-cols-[160px_repeat(31,minmax(24px,1fr))] border-b border-gray-200 bg-gray-50/80 text-[10px] font-bold text-gray-500">
                    <div className="py-2.5 px-3 uppercase tracking-wider text-left border-r border-gray-200">
                      Employee
                    </div>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                      const isTd = isCurrentDayToday(d);
                      return (
                        <div
                          key={d}
                          className={`py-2 text-center border-r border-gray-100 ${
                            isTd ? "bg-[#253C7D] text-white font-extrabold" : ""
                          }`}
                        >
                          {d}
                        </div>
                      );
                    })}
                  </div>

                  {/* Employee Rows */}
                  <div className="divide-y divide-gray-100">
                    {employees
                      .filter((emp) => deptFilter === "all" || emp.department === deptFilter)
                      .map((emp) => {
                        const empLeaves = filteredLeaves.filter((l) => l.employee_id === emp.id);

                        return (
                          <div
                            key={emp.id}
                            className="grid grid-cols-[160px_repeat(31,minmax(24px,1fr))] hover:bg-slate-50/60 transition-colors items-center"
                          >
                            {/* Employee Tag */}
                            <div className="py-2.5 px-3 border-r border-gray-200 flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-[#253C7D] text-white text-[9px] font-bold flex items-center justify-center shrink-0 overflow-hidden">
                                {emp.avatar_url ? (
                                  <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  `${emp.first_name[0]}${emp.last_name[0]}`
                                )}
                              </div>
                              <div className="min-w-0 truncate">
                                <p className="text-[11px] font-bold text-gray-900 truncate">
                                  {emp.first_name} {emp.last_name}
                                </p>
                                <p className="text-[9px] text-gray-400 truncate">{emp.department}</p>
                              </div>
                            </div>

                            {/* Day Cells */}
                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                              const dStr = getDateStr(d);
                              const activeLeave = empLeaves.find(
                                (l) => dStr >= l.start_date && dStr <= l.end_date
                              );
                              const isTd = isCurrentDayToday(d);

                              if (!activeLeave) {
                                return (
                                  <div
                                    key={d}
                                    className={`h-9 border-r border-gray-100 ${
                                      isTd ? "bg-amber-50/40" : ""
                                    }`}
                                  />
                                );
                              }

                              const cfg = LEAVE_TYPE_CONFIG[activeLeave.leave_type] || {
                                label: activeLeave.leave_type,
                                barBg: "bg-gray-400",
                              };

                              return (
                                <div
                                  key={d}
                                  onClick={() => setInspectLeave(activeLeave)}
                                  className={`h-9 border-r border-gray-100 p-0.5 cursor-pointer ${
                                    isTd ? "bg-amber-50/40" : ""
                                  }`}
                                  title={`${emp.first_name}: ${cfg.label} (${activeLeave.start_date} to ${activeLeave.end_date})`}
                                >
                                  <div
                                    className={`w-full h-full rounded-md ${cfg.barBg} opacity-85 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold`}
                                  >
                                    {dStr === activeLeave.start_date ? "•" : ""}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== VIEW 3: AGENDA LIST ===================== */}
          {viewMode === "agenda" && (
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Chronological Absence Schedule &bull; {MONTHS[month]} {year}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Showing {filteredLeaves.length === 0 ? 0 : (safeAgendaPage - 1) * agendaPageSize + 1}–
                    {Math.min(safeAgendaPage * agendaPageSize, filteredLeaves.length)} of {filteredLeaves.length} scheduled leaves
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs text-gray-500 font-medium">Show:</span>
                  <select
                    value={agendaPageSize}
                    onChange={(e) => {
                      setAgendaPageSize(Number(e.target.value));
                      setAgendaPage(1);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 cursor-pointer focus:outline-none focus:border-[#253C7D]"
                  >
                    <option value={8}>8 per page</option>
                    <option value={15}>15 per page</option>
                    <option value={25}>25 per page</option>
                  </select>
                </div>
              </div>

              {filteredLeaves.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <i className="ri-calendar-event-line text-4xl mb-2 block" />
                  <p className="text-sm font-semibold">No leave records match your filters</p>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting the department or leave type filter</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {pagedAgendaLeaves.map((l) => {
                      const cfg = LEAVE_TYPE_CONFIG[l.leave_type] || {
                        label: l.leave_type,
                        bg: "bg-gray-100 text-gray-700 border-gray-200",
                        badgeBg: "bg-gray-100 text-gray-800",
                        icon: "ri-calendar-event-line",
                      };
                      const isUpcoming = l.start_date > todayStr;
                      const isOngoing = todayStr >= l.start_date && todayStr <= l.end_date;

                      return (
                        <div
                          key={l.id}
                          onClick={() => setInspectLeave(l)}
                          className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#253C7D] to-[#3B5998] text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden shrink-0">
                              {l.employees?.avatar_url ? (
                                <img src={l.employees.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                getInitials(l)
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#253C7D] transition-colors">
                                  {getFullName(l)}
                                </h4>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.badgeBg}`}>
                                  {cfg.label}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {l.employees?.role} &bull;{" "}
                                <span className="font-semibold text-gray-600">{l.employees?.department}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                            <div className="text-right">
                              <p className="text-xs font-bold text-gray-900">
                                {formatDateShort(l.start_date)} – {formatDateShort(l.end_date)}
                              </p>
                              <p className="text-[11px] text-gray-400 font-medium">
                                {l.days} {l.days === 1 ? "working day" : "working days"}
                              </p>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                                isOngoing
                                  ? "bg-rose-100 text-rose-800 animate-pulse"
                                  : isUpcoming
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {isOngoing ? "Away Today" : isUpcoming ? "Upcoming" : "Past"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Navigation */}
                  {totalAgendaPages > 1 && (
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                      <p className="text-xs text-gray-500">
                        Page <span className="font-bold text-gray-800">{safeAgendaPage}</span> of{" "}
                        <span className="font-bold text-gray-800">{totalAgendaPages}</span>
                      </p>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setAgendaPage((p) => Math.max(1, p - 1))}
                          disabled={safeAgendaPage <= 1}
                          className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <i className="ri-arrow-left-s-line" /> Prev
                        </button>

                        {pageWindow(safeAgendaPage, totalAgendaPages).map((p, idx) =>
                          p === "..." ? (
                            <span key={`dots-${idx}`} className="px-2 text-xs text-gray-400">
                              ...
                            </span>
                          ) : (
                            <button
                              key={p}
                              onClick={() => setAgendaPage(p as number)}
                              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                p === safeAgendaPage
                                  ? "bg-[#253C7D] text-white shadow-sm"
                                  : "text-gray-700 hover:bg-gray-100 border border-gray-200"
                              }`}
                            >
                              {p}
                            </button>
                          )
                        )}

                        <button
                          onClick={() => setAgendaPage((p) => Math.min(totalAgendaPages, p + 1))}
                          disabled={safeAgendaPage >= totalAgendaPages}
                          className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          Next <i className="ri-arrow-right-s-line" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Selected Day Leave Drawer (when a day is clicked on Month view) */}
          {selectedDay && (
            <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span>
                      Absences on {MONTHS[month]} {selectedDay}, {year}
                    </span>
                    <span className="px-2 py-0.5 bg-[#253C7D]/10 text-[#253C7D] text-xs font-bold rounded-full">
                      {selectedDayLeaves.length} {selectedDayLeaves.length === 1 ? "person" : "people"}
                    </span>
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="w-7 h-7 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <i className="ri-close-line text-lg" />
                </button>
              </div>

              {selectedDayLeaves.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">
                  No scheduled team absences on this date.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedDayLeaves.map((l) => {
                    const cfg = LEAVE_TYPE_CONFIG[l.leave_type] || {
                      label: l.leave_type,
                      badgeBg: "bg-gray-100 text-gray-800",
                      icon: "ri-calendar-event-line",
                    };
                    return (
                      <div
                        key={l.id}
                        onClick={() => setInspectLeave(l)}
                        className="p-3 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-slate-100 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#253C7D] text-white text-[10px] font-bold flex items-center justify-center shrink-0 overflow-hidden">
                            {l.employees?.avatar_url ? (
                              <img src={l.employees.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              getInitials(l)
                            )}
                          </div>
                          <div className="min-w-0 truncate">
                            <p className="text-xs font-bold text-gray-900 truncate">{getFullName(l)}</p>
                            <p className="text-[10px] text-gray-500 truncate">{l.employees?.department}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${cfg.badgeBg}`}>
                          <i className={`${cfg.icon} text-[10px]`} />
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Col: Intelligence Sidebar Widgets */}
        <div className="space-y-6">
          {/* Widget 1: Today's Absence Hub */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Today&apos;s Absence Hub</span>
              </h3>
              <span className="text-[11px] font-semibold text-gray-400">
                {formatDateShort(todayStr)}
              </span>
            </div>

            {leavesToday.length === 0 ? (
              <div className="py-6 text-center text-gray-400">
                <i className="ri-team-line text-3xl text-emerald-500 mb-1 block" />
                <p className="text-xs font-semibold text-emerald-700">100% Team Attendance</p>
                <p className="text-[11px] text-gray-400">No staff on leave today.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {leavesToday.map((l) => {
                  const cfg = LEAVE_TYPE_CONFIG[l.leave_type] || {
                    label: l.leave_type,
                    badgeBg: "bg-gray-100 text-gray-800",
                    icon: "ri-calendar-event-line",
                  };
                  return (
                    <div
                      key={l.id}
                      onClick={() => setInspectLeave(l)}
                      className="p-2.5 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-slate-100 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#253C7D] text-white text-[10px] font-bold flex items-center justify-center shrink-0 overflow-hidden">
                          {l.employees?.avatar_url ? (
                            <img src={l.employees.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(l)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{getFullName(l)}</p>
                          <p className="text-[10px] text-gray-500">
                            Until {formatDateShort(l.end_date)}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${cfg.badgeBg}`}>
                        <i className={`${cfg.icon} text-[10px]`} />
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Widget 2: Upcoming Absences (Next 30 Days) */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Upcoming Leaves (30d)</h3>
              <span className="text-[11px] font-semibold text-indigo-600">
                {upcomingLeaves.length} scheduled
              </span>
            </div>

            {upcomingLeaves.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No upcoming leaves scheduled.</p>
            ) : (
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {upcomingLeaves.map((l) => {
                  const cfg = LEAVE_TYPE_CONFIG[l.leave_type] || {
                    label: l.leave_type,
                    badgeBg: "bg-gray-100 text-gray-800",
                  };
                  const daysUntil = Math.ceil(
                    (new Date(l.start_date + "T00:00:00").getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={l.id}
                      onClick={() => setInspectLeave(l)}
                      className="p-2.5 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-slate-100 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#253C7D]/10 text-[#253C7D] text-[10px] font-bold flex items-center justify-center shrink-0 overflow-hidden">
                          {l.employees?.avatar_url ? (
                            <img src={l.employees.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(l)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{getFullName(l)}</p>
                          <p className="text-[10px] text-gray-500">
                            {formatDateShort(l.start_date)} ({l.days}d)
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 bg-gray-200/80 px-2 py-0.5 rounded-full shrink-0">
                        {daysUntil <= 0 ? "Today" : `in ${daysUntil}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Widget 3: Department Absence Distribution */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Department Leave Load</h3>
              <span className="text-[11px] font-semibold text-gray-400">
                {MONTHS[month].slice(0, 3)} {year}
              </span>
            </div>

            <div className="space-y-3">
              {departmentStats.slice(0, 6).map((item) => (
                <div key={item.dept} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800">{item.dept}</span>
                    <span className="text-gray-500 text-[11px]">
                      <strong>{item.totalDays}d</strong> taken &bull; {item.awayCount}/{item.staffCount} staff
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.pctAway > 50
                          ? "bg-rose-500"
                          : item.pctAway > 25
                          ? "bg-amber-500"
                          : "bg-[#253C7D]"
                      }`}
                      style={{ width: `${Math.max(item.pctAway, item.totalDays > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ======================= LEAVE INSPECTION MODAL ======================= */}
      {inspectLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden transform animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
                  <i className="ri-calendar-event-line text-lg" />
                </span>
                <h3 className="text-base font-bold text-gray-900">Leave Schedule Details</h3>
              </div>
              <button
                onClick={() => setInspectLeave(null)}
                className="w-8 h-8 rounded-xl hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Employee Summary */}
              <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-[#253C7D] text-white flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden shrink-0">
                  {inspectLeave.employees?.avatar_url ? (
                    <img src={inspectLeave.employees.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(inspectLeave)
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">{getFullName(inspectLeave)}</h4>
                  <p className="text-xs text-gray-500">
                    {inspectLeave.employees?.role || "Staff"} &bull;{" "}
                    <span className="font-semibold text-gray-700">{inspectLeave.employees?.department}</span>
                  </p>
                </div>
              </div>

              {/* Leave Meta Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl border border-gray-100 bg-white">
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-bold">
                    Leave Type
                  </span>
                  <span className="font-bold text-gray-800 text-sm mt-0.5 block">
                    {LEAVE_TYPE_CONFIG[inspectLeave.leave_type]?.label || inspectLeave.leave_type}
                  </span>
                </div>

                <div className="p-3 rounded-2xl border border-gray-100 bg-white">
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-bold">
                    Status
                  </span>
                  <span className="font-bold text-emerald-700 text-sm mt-0.5 block capitalize">
                    {inspectLeave.status}
                  </span>
                </div>

                <div className="p-3 rounded-2xl border border-gray-100 bg-white">
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-bold">
                    Date Range
                  </span>
                  <span className="font-semibold text-gray-800 text-xs mt-0.5 block">
                    {formatDateDisplay(inspectLeave.start_date)}
                  </span>
                  <span className="text-[10px] text-gray-500">to {formatDateDisplay(inspectLeave.end_date)}</span>
                </div>

                <div className="p-3 rounded-2xl border border-gray-100 bg-white">
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-bold">
                    Duration
                  </span>
                  <span className="font-black text-gray-900 text-lg mt-0.5 block">
                    {inspectLeave.days} {inspectLeave.days === 1 ? "working day" : "working days"}
                  </span>
                </div>
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Reason / Handover Note
                </label>
                <div className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50 text-[13px] text-gray-700 leading-relaxed">
                  {inspectLeave.reason || <span className="italic text-gray-400">No coverage notes provided.</span>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <button
                  onClick={() => {
                    navigate(`/leave?highlight=${inspectLeave.id}`);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#253C7D]/10 hover:bg-[#253C7D]/20 text-[#253C7D] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <i className="ri-external-link-line" />
                  <span>Open in Leave Hub</span>
                </button>

                <button
                  onClick={() => setInspectLeave(null)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= ALL LEAVES ON DAY MODAL ======================= */}
      {dayLeavesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden transform animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-900">
                Staff on Leave &bull; {MONTHS[month]} {dayLeavesModal.day}, {year}
              </h3>
              <button
                onClick={() => setDayLeavesModal(null)}
                className="w-7 h-7 rounded-xl hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div className="p-5 space-y-2.5 max-h-[400px] overflow-y-auto">
              {dayLeavesModal.leaves.map((l) => {
                const cfg = LEAVE_TYPE_CONFIG[l.leave_type] || {
                  label: l.leave_type,
                  badgeBg: "bg-gray-100 text-gray-800",
                  icon: "ri-calendar-event-line",
                };
                return (
                  <div
                    key={l.id}
                    onClick={() => {
                      setDayLeavesModal(null);
                      setInspectLeave(l);
                    }}
                    className="p-3 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-slate-100 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#253C7D] text-white text-[10px] font-bold flex items-center justify-center shrink-0 overflow-hidden">
                        {l.employees?.avatar_url ? (
                          <img src={l.employees.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(l)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{getFullName(l)}</p>
                        <p className="text-[10px] text-gray-500">{l.employees?.department}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${cfg.badgeBg}`}>
                      <i className={`${cfg.icon} text-[10px]`} />
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================= QUICK REQUEST LEAVE MODAL ======================= */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden transform animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
                  <i className="ri-add-line text-lg font-bold" />
                </span>
                <h3 className="text-base font-bold text-gray-900">Request Leave</h3>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="w-8 h-8 rounded-xl hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleQuickRequestSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Employee Selector (if Manager/Admin) */}
              {canManage ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Employee <span className="text-rose-500">*</span>
                  </label>
                  <EmployeeSearchSelect
                    employees={employees}
                    value={formData.employee_id || myEmployee?.id || ""}
                    onChange={(id) => setFormData({ ...formData, employee_id: id })}
                    placeholder="Select employee..."
                  />
                </div>
              ) : (
                myEmployee && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#253C7D] text-white text-xs font-bold flex items-center justify-center">
                      {myEmployee.first_name[0]}
                      {myEmployee.last_name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {myEmployee.first_name} {myEmployee.last_name}
                      </p>
                      <p className="text-[10px] text-gray-500">{myEmployee.department}</p>
                    </div>
                  </div>
                )
              )}

              {/* Leave Type */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Leave Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(LEAVE_TYPE_CONFIG).map(([type, cfg]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, leave_type: type })}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        formData.leave_type === type
                          ? "border-[#253C7D] bg-[#253C7D]/5 text-[#253C7D] font-bold shadow-xs"
                          : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                      }`}
                    >
                      <i className={`${cfg.icon} text-sm`} />
                      <span className="text-xs truncate">{cfg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#253C7D]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#253C7D]"
                    required
                  />
                </div>
              </div>

              {/* Duration preview */}
              {formData.start_date && formData.end_date && (
                <div className="p-3 bg-[#253C7D]/5 rounded-xl border border-[#253C7D]/20 flex items-center justify-between text-xs text-[#253C7D]">
                  <span className="font-semibold">Calculated Duration:</span>
                  <span className="font-black text-sm">
                    {calculateDays(formData.start_date, formData.end_date)} working days
                  </span>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Reason / Handover Details <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={2}
                  placeholder="Provide context or coverage notes..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#253C7D] resize-none"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#253C7D] to-[#1E3066] text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}