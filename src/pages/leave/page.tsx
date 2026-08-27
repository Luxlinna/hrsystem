import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";

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
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    avatar_url?: string | null;
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
  reports_to?: string | null;
}

interface LeaveTypePolicy {
  type: string;
  default_days: number | null;
}

const LEAVE_TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; bg: string; text: string; border: string; badgeBg: string }
> = {
  annual: {
    label: "Annual Leave",
    icon: "ri-sun-line",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    badgeBg: "bg-emerald-100 text-emerald-800",
  },
  sick: {
    label: "Sick Leave",
    icon: "ri-heart-pulse-line",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    badgeBg: "bg-rose-100 text-rose-800",
  },
  maternity: {
    label: "Maternity Leave",
    icon: "ri-parent-line",
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
    badgeBg: "bg-pink-100 text-pink-800",
  },
  paternity: {
    label: "Paternity Leave",
    icon: "ri-user-heart-line",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    badgeBg: "bg-indigo-100 text-indigo-800",
  },
  unpaid: {
    label: "Unpaid Leave",
    icon: "ri-pause-circle-line",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    badgeBg: "bg-slate-100 text-slate-800",
  },
  bereavement: {
    label: "Bereavement",
    icon: "ri-empathize-line",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    badgeBg: "bg-purple-100 text-purple-800",
  },
  study: {
    label: "Study Leave",
    icon: "ri-book-open-line",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    badgeBg: "bg-amber-100 text-amber-800",
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: string; bg: string; text: string; dot: string }
> = {
  pending: {
    label: "Pending Review",
    icon: "ri-time-line",
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    icon: "ri-checkbox-circle-line",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    icon: "ri-close-circle-line",
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
  cancelled: {
    label: "Cancelled",
    icon: "ri-indeterminate-circle-line",
    bg: "bg-gray-100 text-gray-600 border-gray-200",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
};

const pageWindow = (current: number, total: number): (number | "...")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
};

// Date formatter helpers
function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Leave() {
  const { user } = useAuth();
  const { role, isAdmin, loading: permsLoading } = usePermissions();
  const canViewAll = isAdmin || !!role?.leave_view_all_employees;
  const canViewOwnBranch = !canViewAll && !!role?.leave_view_own_branch;
  const canManage = canViewAll || canViewOwnBranch;
  // Seeing the team's leave and deciding it are different rights. canManage
  // only widens *visibility*; approving/rejecting requires the explicit
  // leave_approve capability, which the DB enforces too (trigger
  // trg_enforce_leave_approval), so hiding the buttons isn't the only guard.
  const canApproveLeave = isAdmin || !!role?.leave_approve;

  // View tabs
  const [activeTab, setActiveTab] = useState<"requests" | "balances" | "calendar">("requests");

  // Data states
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [calendarRequests, setCalendarRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [myApproverName, setMyApproverName] = useState<string>("");
  const [leaveTypePolicies, setLeaveTypePolicies] = useState<LeaveTypePolicy[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");

  // Request Form Modal
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    leave_type: "annual",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Approval Modal
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approved" | "rejected">("approved");
  const [processingApproval, setProcessingApproval] = useState(false);

  // Cancellation Modal
  const [cancelTargetRequest, setCancelTargetRequest] = useState<LeaveRequest | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [processingCancel, setProcessingCancel] = useState(false);

  // Detail Modal
  const [inspectRequest, setInspectRequest] = useState<LeaveRequest | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Calendar State
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(new Date().getDate());
  const [calDeptFilter, setCalDeptFilter] = useState("all");
  const calendarRef = useRef<HTMLDivElement>(null);

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // Deep link highlight
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const normalizeLeaveRequest = (r: LeaveRequest): LeaveRequest => {
    const isCancelled =
      r.status === "cancelled" ||
      (r.status === "rejected" &&
        (r.reason?.startsWith("[Cancelled") ||
          r.reason?.includes("[Cancelled by employee]") ||
          r.reason?.includes("(Cancelled:")));
    return isCancelled ? { ...r, status: "cancelled" } : r;
  };

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      // Calendar requests: company-wide approved
      const { data: calReqs } = await supabase
        .from("leave_requests")
        .select("*, employees(first_name, last_name, role, department, avatar_url, email)")
        .eq("status", "approved");
      setCalendarRequests(calReqs || []);

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

      // Who will decide my requests. Fetched separately rather than as a
      // nested embed because employees has two relationships to branches,
      // which makes a self-join embed ambiguous for PostgREST.
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
          .select("*, employees(first_name, last_name, role, department, avatar_url, email)")
          .is("deleted_at", null)
          .order("created_at", { ascending: false });
        setRequests((lr || []).map(normalizeLeaveRequest));

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
            .select("*, employees(first_name, last_name, role, department, avatar_url, email)")
            .in("employee_id", ids)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
          : { data: [] };
        setRequests((lr || []).map(normalizeLeaveRequest));
        setLoading(false);
        return;
      }

      // Individual employee
      setEmployees([me]);
      const { data: lr } = await supabase
        .from("leave_requests")
        .select("*, employees(first_name, last_name, role, department, avatar_url, email)")
        .eq("employee_id", me.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      setRequests((lr || []).map(normalizeLeaveRequest));
    } catch (err) {
      console.error("Error loading leave data:", err);
    } finally {
      setLoading(false);
    }
  };

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
  }, [permsLoading, canViewAll, canViewOwnBranch, user?.email]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Deep linking highlight
  useEffect(() => {
    if (!highlightId || requests.length === 0) return;
    const idx = requests.findIndex((r) => r.id === highlightId);
    if (idx === -1) return;
    setStatusFilter("all");
    setPage(Math.floor(idx / pageSize) + 1);
    setActiveTab("requests");
    const t = setTimeout(() => {
      // The desktop table row and the mobile card share the request's id but
      // render as two separate elements (one hidden via CSS depending on
      // viewport) — pick whichever one is actually visible.
      const desktopEl = document.getElementById(`leave-request-desktop-${highlightId}`);
      const mobileEl = document.getElementById(`leave-request-mobile-${highlightId}`);
      const el =
        (desktopEl && desktopEl.offsetParent !== null && desktopEl) ||
        (mobileEl && mobileEl.offsetParent !== null && mobileEl) ||
        desktopEl ||
        mobileEl;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    }, 150);
    return () => clearTimeout(t);
  }, [highlightId, requests, pageSize]);

  // Working days calculator
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (e < s) return 0;
    return Math.max(Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1, 1);
  };

  const rangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
    aStart <= bEnd && bStart <= aEnd;

  const findOverlappingRequest = (
    employeeId: string,
    start: string,
    end: string,
    statuses: string[],
    excludeId?: string
  ) =>
    requests.find(
      (r) =>
        r.employee_id === employeeId &&
        r.id !== excludeId &&
        statuses.includes(r.status) &&
        rangesOverlap(start, end, r.start_date, r.end_date)
    );

  // Entitlements & Balances
  const currentYear = new Date().getFullYear();

  const getEntitlement = (employeeId: string, type: string): number | null => {
    if (type === "annual") {
      const emp = employees.find((e) => e.id === employeeId) || (myEmployee?.id === employeeId ? myEmployee : null);
      return emp?.annual_leave_days ?? 18;
    }
    const policy = leaveTypePolicies.find((p) => p.type === type);
    return policy ? policy.default_days : null;
  };

  const getUsedDays = (employeeId: string, type: string): number => {
    return requests
      .filter(
        (r) =>
          r.employee_id === employeeId &&
          r.leave_type === type &&
          r.status === "approved" &&
          new Date(r.start_date).getFullYear() === currentYear
      )
      .reduce((sum, r) => sum + (r.days || 0), 0);
  };

  const getPendingDays = (employeeId: string, type: string): number => {
    return requests
      .filter(
        (r) =>
          r.employee_id === employeeId &&
          r.leave_type === type &&
          r.status === "pending" &&
          new Date(r.start_date).getFullYear() === currentYear
      )
      .reduce((sum, r) => sum + (r.days || 0), 0);
  };

  // "Remaining" means what's actually still bookable, so days already
  // committed to an undecided request count against it. Without holding
  // pending days, the balances tab didn't add up (used + pending + remaining
  // exceeded the entitlement) and the submit guard below let someone request
  // their whole allowance twice over while the first request sat unreviewed.
  const getRemaining = (employeeId: string, type: string): number | null => {
    const entitlement = getEntitlement(employeeId, type);
    if (entitlement === null) return null;
    const used = getUsedDays(employeeId, type);
    const pending = getPendingDays(employeeId, type);
    return Math.max(0, entitlement - used - pending);
  };

  // Stats
  const targetEmpId = myEmployee?.id || "";
  const myAnnualUsed = targetEmpId ? getUsedDays(targetEmpId, "annual") : 0;
  // Days sitting in un-decided requests. They aren't "taken" yet, but they are
  // spoken for — leaving them out let someone with 18 days and 5 days pending
  // still see "18 left" and request the full allowance again.
  const myAnnualPending = targetEmpId ? getPendingDays(targetEmpId, "annual") : 0;
  const myAnnualEntitlement = (myEmployee?.annual_leave_days ?? 18);
  // Reuse the shared helper so the KPI can't drift from the balances tab.
  const myAnnualRemaining = targetEmpId
    ? getRemaining(targetEmpId, "annual") ?? myAnnualEntitlement
    : myAnnualEntitlement;

  const todayStr = toYMD(new Date());
  const currentlyOnLeaveCount = calendarRequests.filter(
    (r) => todayStr >= r.start_date && todayStr <= r.end_date
  ).length;

  const stats = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    totalApprovedDays: requests
      .filter((r) => r.status === "approved")
      .reduce((sum, r) => sum + (r.days || 0), 0),
    onLeaveToday: currentlyOnLeaveCount,
    myAnnualRemaining,
    myAnnualEntitlement,
    myAnnualUsed,
    myAnnualPending,
  };

  // Filtered requests
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Status
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      // Leave type
      if (leaveTypeFilter !== "all" && r.leave_type !== leaveTypeFilter) return false;
      // Department
      if (departmentFilter !== "all" && r.employees?.department !== departmentFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.toLowerCase();
        const empRole = (r.employees?.role || "").toLowerCase();
        const empDept = (r.employees?.department || "").toLowerCase();
        const leaveType = (r.leave_type || "").toLowerCase();
        const reason = (r.reason || "").toLowerCase();
        if (
          !empName.includes(q) &&
          !empRole.includes(q) &&
          !empDept.includes(q) &&
          !leaveType.includes(q) &&
          !reason.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [requests, statusFilter, leaveTypeFilter, departmentFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = filteredRequests.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, filteredRequests.length);
  const pagedRows = filteredRequests.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Export to CSV
  const exportToCSV = () => {
    if (filteredRequests.length === 0) {
      setToast({ type: "info", message: "No requests to export with current filters" });
      return;
    }
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
      "Submitted Date",
    ];
    const rows = filteredRequests.map((r) => [
      `"${(r.employees?.first_name || "") + " " + (r.employees?.last_name || "")}"`,
      `"${r.employees?.department || ""}"`,
      `"${r.employees?.role || ""}"`,
      `"${LEAVE_TYPE_CONFIG[r.leave_type]?.label || r.leave_type}"`,
      `"${r.start_date}"`,
      `"${r.end_date}"`,
      r.days,
      `"${r.status}"`,
      `"${(r.reason || "").replace(/"/g, '""')}"`,
      `"${formatDate(r.created_at?.slice(0, 10))}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Leave_Requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ type: "success", message: "Exported leave records to CSV" });
  };

  // Form helpers & presets
  const activeEmpForForm = formData.employee_id || myEmployee?.id || "";
  const formRequestedDays = calculateDays(formData.start_date, formData.end_date);
  const formRemainingDays = activeEmpForForm
    ? getRemaining(activeEmpForForm, formData.leave_type)
    : null;
  const isOverBalance =
    formRemainingDays !== null && formRequestedDays > formRemainingDays;

  const setDatePreset = (preset: "today" | "tomorrow" | "3days" | "thisWeek" | "nextWeek") => {
    const now = new Date();
    let s = new Date(now);
    let e = new Date(now);

    if (preset === "today") {
      // today
    } else if (preset === "tomorrow") {
      s.setDate(s.getDate() + 1);
      e.setDate(e.getDate() + 1);
    } else if (preset === "3days") {
      e.setDate(s.getDate() + 2);
    } else if (preset === "thisWeek") {
      const day = now.getDay();
      const diffToMon = day === 0 ? -6 : 1 - day;
      s.setDate(now.getDate() + diffToMon);
      e = new Date(s);
      e.setDate(s.getDate() + 4);
    } else if (preset === "nextWeek") {
      const day = now.getDay();
      const diffToNextMon = day === 0 ? 1 : 8 - day;
      s.setDate(now.getDate() + diffToNextMon);
      e = new Date(s);
      e.setDate(s.getDate() + 4);
    }

    setFormData((prev) => ({
      ...prev,
      start_date: toYMD(s),
      end_date: toYMD(e),
    }));
  };

  // Submit Leave Request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const empId = formData.employee_id || myEmployee?.id;
    if (!empId || !formData.start_date || !formData.end_date) {
      setToast({ type: "error", message: "Please fill in all required fields" });
      return;
    }
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      setToast({ type: "error", message: "End date must be on or after start date" });
      return;
    }

    const dupe = findOverlappingRequest(empId, formData.start_date, formData.end_date, [
      "pending",
      "approved",
    ]);
    if (dupe) {
      setToast({
        type: "error",
        message: `This overlaps an existing ${dupe.status} request (${dupe.start_date} to ${dupe.end_date}).`,
      });
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
      setToast({ type: "error", message: "Failed to submit leave request" });
    } else {
      setToast({ type: "success", message: "Leave request submitted successfully" });
      setShowForm(false);
      setFormData({
        employee_id: "",
        leave_type: "annual",
        start_date: "",
        end_date: "",
        reason: "",
      });

      const empName = myEmployee
        ? `${myEmployee.first_name} ${myEmployee.last_name}`.trim()
        : "An employee";
      notify({
        source: "leave",
        type: "warning",
        title: "New Leave Request Pending",
        message: `${empName} has requested ${LEAVE_TYPE_CONFIG[formData.leave_type]?.label || formData.leave_type} leave from ${formData.start_date} to ${formData.end_date} (${days} day${days !== 1 ? "s" : ""}).`,
      });
      notifyTelegramEvent(
        `📝 <b>New Leave Request</b>\n\n👤 <b>Employee:</b> ${escapeTelegramHtml(empName)}\n🏷 <b>Type:</b> ${escapeTelegramHtml(LEAVE_TYPE_CONFIG[formData.leave_type]?.label || formData.leave_type)}\n📅 <b>Dates:</b> ${formData.start_date} to ${formData.end_date} (${days} day${days !== 1 ? "s" : ""})`,
        { text: "Open in HR Nexus", url: hrNexusUrl("/leave") }
      );

      loadData();
    }
  };

  // Cancel Request (Self-Service Modal)
  const openCancelModal = (req: LeaveRequest) => {
    setCancelTargetRequest(req);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const confirmCancelRequest = async () => {
    if (!cancelTargetRequest || processingCancel) return;
    if (cancelTargetRequest.employee_id !== myEmployee?.id) {
      setToast({ type: "error", message: "You can only cancel your own leave requests." });
      setShowCancelModal(false);
      setCancelTargetRequest(null);
      return;
    }
    setProcessingCancel(true);

    const fullReason = cancelReason.trim()
      ? `[Cancelled by employee]: ${cancelReason.trim()}`
      : `[Cancelled by employee]`;

    // Try updating status to 'cancelled' (if supported by DB check constraint)
    let { error } = await supabase
      .from("leave_requests")
      .update({
        status: "cancelled",
        reason: cancelTargetRequest.reason
          ? `${cancelTargetRequest.reason} (${fullReason})`
          : fullReason,
      })
      .eq("id", cancelTargetRequest.id)
      .eq("employee_id", myEmployee.id);

    // If database check constraint restricts 'cancelled', gracefully update to 'rejected' or delete
    if (error) {
      const updateFallback = await supabase
        .from("leave_requests")
        .update({
          status: "rejected",
          reason: cancelTargetRequest.reason
            ? `${cancelTargetRequest.reason} (${fullReason})`
            : fullReason,
        })
        .eq("id", cancelTargetRequest.id)
        .eq("employee_id", myEmployee.id);

      if (!updateFallback.error) {
        error = null;
      } else {
        const deleteFallback = await supabase
          .from("leave_requests")
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by: (user?.user_metadata?.display_name as string) || user?.email || "Unknown",
          })
          .eq("id", cancelTargetRequest.id)
          .eq("employee_id", myEmployee.id);
        if (!deleteFallback.error) {
          error = null;
        }
      }
    }

    if (error) {
      setToast({ type: "error", message: "Failed to cancel leave request: " + error.message });
    } else {
      setToast({ type: "success", message: "Leave request cancelled successfully" });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === cancelTargetRequest.id
            ? {
                ...r,
                status: "cancelled",
                reason: cancelReason ? `${r.reason || ""} (Cancelled: ${cancelReason})`.trim() : r.reason,
              }
            : r
        )
      );

      const empName =
        `${cancelTargetRequest.employees?.first_name ?? ""} ${cancelTargetRequest.employees?.last_name ?? ""}`.trim() ||
        "an employee";

      logActivity({
        module: "leave",
        action: "deleted",
        entityType: "leave_request",
        entityId: cancelTargetRequest.id,
        actorName: (user?.user_metadata?.display_name as string) || user?.email || "Unknown",
        actorRole: role?.name || "Unknown",
        description: `${cancelTargetRequest.leave_type} leave request for ${empName} was cancelled${cancelReason ? ` (Reason: ${cancelReason})` : ""}`,
        metadata: {
          employee: empName,
          leave_type: cancelTargetRequest.leave_type,
          start_date: cancelTargetRequest.start_date,
          end_date: cancelTargetRequest.end_date,
          cancel_reason: cancelReason,
        },
      });

      notify({
        source: "leave",
        type: "info",
        title: "Leave Request Cancelled",
        message: `${empName}'s ${cancelTargetRequest.leave_type} leave (${cancelTargetRequest.start_date} to ${cancelTargetRequest.end_date}) was cancelled.`,
        entityId: cancelTargetRequest.id,
      });
      notifyTelegramEvent(
        `🚫 <b>Leave Request Cancelled</b>\n\n👤 <b>Employee:</b> ${escapeTelegramHtml(empName)}\n🏷 <b>Type:</b> ${escapeTelegramHtml(cancelTargetRequest.leave_type)}\n📅 <b>Dates:</b> ${cancelTargetRequest.start_date} to ${cancelTargetRequest.end_date}`,
        { text: "Open in HR Nexus", url: hrNexusUrl("/leave") }
      );

      loadData();
      if (inspectRequest?.id === cancelTargetRequest.id) setInspectRequest(null);
    }

    setProcessingCancel(false);
    setShowCancelModal(false);
    setCancelTargetRequest(null);
  };

  // Approval Process
  const openApproval = (req: LeaveRequest, action: "approved" | "rejected") => {
    setSelectedRequest(req);
    setApprovalAction(action);
    setApprovalNote("");
    setShowApprovalModal(true);
  };

  const confirmApproval = async () => {
    if (!selectedRequest || processingApproval) return;

    // Guard the action itself, not just the buttons — a stale tab open from
    // before a role change would otherwise still post the update.
    if (!canApproveLeave) {
      setToast({ type: "error", message: "Your role is not permitted to approve or reject leave requests." });
      setShowApprovalModal(false);
      setSelectedRequest(null);
      return;
    }

    setProcessingApproval(true);

    if (approvalAction === "approved") {
      const dupe = findOverlappingRequest(
        selectedRequest.employee_id,
        selectedRequest.start_date,
        selectedRequest.end_date,
        ["approved"],
        selectedRequest.id
      );
      if (dupe) {
        setToast({
          type: "error",
          message: `Cannot approve — employee already has an approved ${dupe.leave_type} request covering these dates (${dupe.start_date} to ${dupe.end_date}).`,
        });
        setShowApprovalModal(false);
        setSelectedRequest(null);
        setProcessingApproval(false);
        return;
      }
    }

    const { data, error } = await supabase
      .from("leave_requests")
      .update({ status: approvalAction })
      .eq("id", selectedRequest.id)
      .eq("status", "pending")
      .select("id");

    if (!error && (!data || data.length === 0)) {
      setToast({ type: "error", message: "This request was already processed." });
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setProcessingApproval(false);
      loadData();
      return;
    }

    if (error) {
      // 42501 = the DB-side permission trigger rejected this actor.
      const denied = (error as any).code === "42501" || /not permitted/i.test(error.message || "");
      setToast({
        type: "error",
        message: denied
          ? "Your role is not permitted to approve or reject leave requests."
          : "Failed to update request status",
      });
    } else {
      setToast({ type: "success", message: `Leave request ${approvalAction} successfully` });
      setRequests((prev) =>
        prev.map((r) => (r.id === selectedRequest.id ? { ...r, status: approvalAction } : r))
      );

      const empName =
        `${selectedRequest.employees?.first_name ?? ""} ${selectedRequest.employees?.last_name ?? ""}`.trim() ||
        "an employee";

      logActivity({
        module: "leave",
        action: approvalAction,
        entityType: "leave_request",
        entityId: selectedRequest.id,
        actorName: (user?.user_metadata?.display_name as string) || user?.email || "Unknown",
        actorRole: role?.name || "Unknown",
        description: `${selectedRequest.leave_type} leave request for ${empName} was ${approvalAction}${approvalNote ? ` (Note: ${approvalNote})` : ""}`,
        metadata: {
          employee: empName,
          leave_type: selectedRequest.leave_type,
          start_date: selectedRequest.start_date,
          end_date: selectedRequest.end_date,
          note: approvalNote,
        },
      });

      notify({
        source: "leave",
        type: approvalAction === "approved" ? "success" : "warning",
        title: `Leave ${approvalAction}`,
        message: `${empName}'s ${selectedRequest.leave_type} leave (${selectedRequest.start_date} to ${selectedRequest.end_date}) was ${approvalAction}.`,
        entityId: selectedRequest.id,
      });
      notifyTelegramEvent(
        `${approvalAction === "approved" ? "✅" : "❌"} <b>Leave ${approvalAction === "approved" ? "Approved" : "Rejected"}</b>\n\n👤 <b>Employee:</b> ${escapeTelegramHtml(empName)}\n🏷 <b>Type:</b> ${escapeTelegramHtml(selectedRequest.leave_type)}\n📅 <b>Dates:</b> ${selectedRequest.start_date} to ${selectedRequest.end_date}${approvalNote ? `\n📝 <b>Note:</b> ${escapeTelegramHtml(approvalNote)}` : ""}`,
        { text: "Open in HR Nexus", url: hrNexusUrl("/leave") }
      );

      try {
        await supabase.functions.invoke("notify-leave-status", {
          body: {
            employee_name: empName,
            leave_type: selectedRequest.leave_type,
            status: approvalAction,
            start_date: selectedRequest.start_date,
            end_date: selectedRequest.end_date,
            note: approvalNote,
          },
        });

        if ("Notification" in window && Notification.permission === "granted") {
          const isApproved = approvalAction === "approved";
          new Notification(isApproved ? "Leave Approved ✓" : "Leave Rejected", {
            body: `${selectedRequest.employees?.first_name ?? "Employee"}'s ${selectedRequest.leave_type} leave has been ${approvalAction}.`,
            icon: "/favicon.png",
          });
        }
      } catch {
        // Notification edge function fallback
      }
    }

    setProcessingApproval(false);
    setShowApprovalModal(false);
    setSelectedRequest(null);
    if (inspectRequest?.id === selectedRequest.id) {
      setInspectRequest((prev) => (prev ? { ...prev, status: approvalAction } : null));
    }
  };

  // Calendar calculations
  const monthNames = [
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

  const filteredCalendarRequests = useMemo(() => {
    return calendarRequests.filter((r) => {
      if (calDeptFilter !== "all" && r.employees?.department !== calDeptFilter) return false;
      return true;
    });
  }, [calendarRequests, calDeptFilter]);

  const getCalendarDays = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    const startPadding = firstDay.getDay();
    const days: { date: number; dateStr: string; requests: LeaveRequest[] }[] = [];

    for (let i = 0; i < startPadding; i++) {
      days.push({ date: 0, dateStr: "", requests: [] });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayReqs = filteredCalendarRequests.filter((r) => {
        return dateStr >= r.start_date && dateStr <= r.end_date;
      });
      days.push({ date: d, dateStr, requests: dayReqs });
    }
    return days;
  };

  const calendarDays = getCalendarDays();
  const isToday = (d: number) => {
    const t = new Date();
    return d === t.getDate() && calendarMonth === t.getMonth() && calendarYear === t.getFullYear();
  };

  const selectedDayDateStr = selectedCalendarDay
    ? `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(selectedCalendarDay).padStart(2, "0")}`
    : "";

  const selectedDayRequests = useMemo(() => {
    if (!selectedDayDateStr) return [];
    return filteredCalendarRequests.filter(
      (r) => selectedDayDateStr >= r.start_date && selectedDayDateStr <= r.end_date
    );
  }, [filteredCalendarRequests, selectedDayDateStr]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#F8FAFC]">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 left-4 right-4 sm:top-6 sm:right-6 sm:left-auto sm:max-w-sm z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md text-[13px] font-medium transition-all transform animate-in slide-in-from-top-4 duration-200 ${toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-700/50 text-emerald-100"
              : toast.type === "error"
                ? "bg-rose-950/90 border-rose-700/50 text-rose-100"
                : "bg-slate-900/90 border-slate-700/50 text-white"
            }`}
        >
          <i
            className={`${toast.type === "success"
                ? "ri-checkbox-circle-fill text-emerald-400"
                : toast.type === "error"
                  ? "ri-error-warning-fill text-rose-400"
                  : "ri-information-fill text-sky-400"
              } text-lg`}
          />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#253C7D] text-white shadow-sm shadow-[#253C7D]/20">
              <i className="ri-calendar-check-line text-lg" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leave Management</h1>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#253C7D]/10 text-[#253C7D]">
              {canApproveLeave ? "Admin & Team View" : canManage ? "Team View" : "Employee Portal"}
            </span>
          </div>
          <p className="text-[13px] text-gray-500">
            {canApproveLeave
              ? "Oversee leave requests, review employee attendance schedules, and track annual quotas"
              : canManage
              ? "Review your team's leave schedule and track annual quotas"
              : "Check your available leave balance, submit time-off applications, and track approval status"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* A reporting tool, not a self-service one — an employee exporting
              their own handful of rows is just noise next to Request Leave. */}
          {canManage && (
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm cursor-pointer"
              title="Download leave report as CSV"
            >
              <i className="ri-download-2-line text-gray-500" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={() => {
              if (!canViewAll) {
                setFormData((p) => ({ ...p, employee_id: myEmployee?.id || "" }));
              }
              setShowForm(true);
            }}
            disabled={!canViewAll && !myEmployee}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#253C7D] text-white text-[13px] font-semibold hover:bg-[#1d3066] active:scale-[0.98] transition-all shadow-md shadow-[#253C7D]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <i className="ri-add-circle-line text-base" />
            <span>Request Leave</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip — an approver leads with the queue they must clear;
          an employee leads with the allowance they're spending. */}
      {(() => {
        const entitlement = stats.myAnnualEntitlement || 1;
        const takenPct = Math.min(100, Math.round((stats.myAnnualUsed / entitlement) * 100));
        const pendingPct = Math.min(100 - takenPct, Math.round((stats.myAnnualPending / entitlement) * 100));

        const balanceCard = (
          <div
            key="balance"
            onClick={() => setActiveTab("balances")}
            className="group relative overflow-hidden bg-white border border-[#253C7D]/20 hover:border-[#253C7D]/40 rounded-2xl p-4 transition-all hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-[#253C7D] uppercase">
                My Annual Balance
              </span>
              <span className="w-8 h-8 rounded-xl bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] group-hover:scale-110 transition-transform">
                <i className="ri-shield-star-line text-base" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#253C7D] tracking-tight">{stats.myAnnualRemaining}</span>
              <span className="text-[12px] font-semibold text-gray-500">
                / {stats.myAnnualEntitlement} days available
              </span>
            </div>

            {/* Taken (solid) and pending (hatched) both consume the allowance. */}
            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden flex">
              <div
                className="h-full bg-[#253C7D] transition-all duration-500"
                style={{ width: `${takenPct}%` }}
                title={`${stats.myAnnualUsed} days taken`}
              />
              <div
                className="h-full bg-[#253C7D]/35 transition-all duration-500"
                style={{ width: `${pendingPct}%` }}
                title={`${stats.myAnnualPending} days awaiting approval`}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              {stats.myAnnualUsed} taken
              {stats.myAnnualPending > 0 && (
                <>
                  {" · "}
                  <span className="text-[#253C7D] font-semibold">{stats.myAnnualPending} pending</span>
                </>
              )}
            </p>
          </div>
        );

        const pendingCard = (
          <div
            key="pending"
            onClick={() => {
              setStatusFilter("pending");
              setActiveTab("requests");
            }}
            className={`group relative overflow-hidden bg-white border rounded-2xl p-4 transition-all hover:shadow-md cursor-pointer ${
              canApproveLeave
                ? "border-amber-200/80 hover:border-amber-400/80"
                : "border-gray-200/80 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-semibold tracking-wider uppercase ${
                  canApproveLeave ? "text-amber-700" : "text-gray-600"
                }`}
              >
                {canApproveLeave ? "Pending Review" : "My Pending Requests"}
              </span>
              <span
                className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                  canApproveLeave ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"
                }`}
              >
                <i className="ri-time-line text-base" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-gray-900 tracking-tight">{stats.pending}</span>
              {stats.pending > 0 && (
                <span
                  className={`flex items-center gap-1 text-[11px] font-medium ${
                    canApproveLeave ? "text-amber-600" : "text-gray-500"
                  }`}
                >
                  {/* Only an approver actually has something to do here. */}
                  {canApproveLeave && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                  {canApproveLeave ? "Action needed" : "Awaiting approval"}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1 truncate">
              {canApproveLeave
                ? "Awaiting your review"
                : myApproverName
                ? `Pending with ${myApproverName}`
                : "Submitted, not yet decided"}
            </p>
          </div>
        );

        const approvedCard = (
          <div
            key="approved"
            onClick={() => {
              setStatusFilter("approved");
              setActiveTab("requests");
            }}
            className="group relative overflow-hidden bg-white border border-emerald-200/80 hover:border-emerald-400/80 rounded-2xl p-4 transition-all hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-emerald-700 uppercase">
                {canApproveLeave ? "Approved Requests" : "My Approved Leave"}
              </span>
              <span className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <i className="ri-checkbox-circle-line text-base" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-gray-900 tracking-tight">{stats.approved}</span>
              <span className="text-[12px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {stats.totalApprovedDays} days total
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Confirmed time-off</p>
          </div>
        );

        const outOfOfficeCard = (
          <div
            key="ooo"
            onClick={() => setActiveTab("calendar")}
            className="group relative overflow-hidden bg-white border border-indigo-200/80 hover:border-indigo-400/80 rounded-2xl p-4 transition-all hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-indigo-700 uppercase">
                Out of Office Today
              </span>
              <span className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <i className="ri-user-unfollow-line text-base" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-gray-900 tracking-tight">{stats.onLeaveToday}</span>
              <span className="text-[11px] font-medium text-indigo-600">
                {stats.onLeaveToday === 1 ? "1 colleague away" : `${stats.onLeaveToday} colleagues away`}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Company-wide active leaves</p>
          </div>
        );

        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
            {canApproveLeave
              ? [pendingCard, approvedCard, outOfOfficeCard, balanceCard]
              : [balanceCard, pendingCard, approvedCard, outOfOfficeCard]}
          </div>
        );
      })()}

      {/* Main Tab Navigation Header */}
      <div className="border-b border-gray-200/80 mb-6 overflow-x-auto">
        <div className="flex items-center gap-2 w-max min-w-full">
          <button
            onClick={() => setActiveTab("requests")}
            className={`inline-flex items-center gap-2 py-3 px-4 font-semibold text-[13px] border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === "requests"
                ? "border-[#253C7D] text-[#253C7D]"
                : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
          >
            <i className="ri-file-list-3-line text-base" />
            <span>Leave Requests</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${activeTab === "requests"
                  ? "bg-[#253C7D] text-white"
                  : "bg-gray-100 text-gray-600"
                }`}
            >
              {requests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("balances")}
            className={`inline-flex items-center gap-2 py-3 px-4 font-semibold text-[13px] border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === "balances"
                ? "border-[#253C7D] text-[#253C7D]"
                : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
          >
            <i className="ri-pie-chart-2-line text-base" />
            <span className="hidden sm:inline">Leave Balances & Quotas</span>
            <span className="sm:hidden">Balances</span>
          </button>

          <button
            onClick={() => setActiveTab("calendar")}
            className={`inline-flex items-center gap-2 py-3 px-4 font-semibold text-[13px] border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === "calendar"
                ? "border-[#253C7D] text-[#253C7D]"
                : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
          >
            <i className="ri-calendar-line text-base" />
            <span className="hidden sm:inline">Team Schedule Calendar</span>
            <span className="sm:hidden">Calendar</span>
          </button>
        </div>
      </div>

      {/* ======================= TAB 1: LEAVE REQUESTS ======================= */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {/* Advanced Multi-Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
            {/* Left: Status Filter Pills — wraps on phones so every filter
                stays visible at a glance instead of hiding behind a
                sideways scroll; collapses back to one scrollable row once
                there's enough width for it to make sense. */}
            <div className="flex items-center flex-wrap md:flex-nowrap gap-1.5 md:overflow-x-auto md:pb-1">
              {[
                { id: "all", label: "All Requests", count: requests.length },
                {
                  id: "pending",
                  label: "Pending",
                  count: requests.filter((r) => r.status === "pending").length,
                  badge: "bg-amber-100 text-amber-800",
                },
                {
                  id: "approved",
                  label: "Approved",
                  count: requests.filter((r) => r.status === "approved").length,
                  badge: "bg-emerald-100 text-emerald-800",
                },
                {
                  id: "rejected",
                  label: "Rejected",
                  count: requests.filter((r) => r.status === "rejected").length,
                  badge: "bg-rose-100 text-rose-800",
                },
                {
                  id: "cancelled",
                  label: "Cancelled",
                  count: requests.filter((r) => r.status === "cancelled").length,
                  badge: "bg-gray-100 text-gray-700",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer whitespace-nowrap ${statusFilter === tab.id
                      ? "bg-[#253C7D] text-white shadow-sm"
                      : "bg-gray-100/80 text-gray-600 hover:bg-gray-200/80"
                    }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${statusFilter === tab.id
                        ? "bg-white/20 text-white"
                        : tab.badge || "bg-white text-gray-600"
                      }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Right: Search + Dropdown Filters — an explicit stacked layout
                on phones (full-width search, then the filters sharing a
                row) reads far cleaner than letting flex-wrap decide, which
                left the search box starved of width alongside two
                shrink-resistant selects. Reverts to one row from sm: up. */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-60">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search employee, reason..."
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
                {/* Department filter */}
                {canManage && departments.length > 0 && (
                  <select
                    value={departmentFilter}
                    onChange={(e) => {
                      setDepartmentFilter(e.target.value);
                      setPage(1);
                    }}
                    className="flex-1 sm:flex-none min-w-0 px-2.5 py-1.5 rounded-xl border border-gray-200 text-[12px] bg-white text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                )}

                {/* Leave Type filter */}
                <select
                  value={leaveTypeFilter}
                  onChange={(e) => {
                    setLeaveTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 sm:flex-none min-w-0 px-2.5 py-1.5 rounded-xl border border-gray-200 text-[12px] bg-white text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  <option value="all">All Leave Types</option>
                  {Object.entries(LEAVE_TYPE_CONFIG).map(([type, cfg]) => (
                    <option key={type} value={type}>
                      {cfg.label}
                    </option>
                  ))}
                </select>

                {/* Reset filter button */}
                {(statusFilter !== "all" ||
                  leaveTypeFilter !== "all" ||
                  departmentFilter !== "all" ||
                  searchQuery) && (
                    <button
                      onClick={() => {
                        setStatusFilter("all");
                        setLeaveTypeFilter("all");
                        setDepartmentFilter("all");
                        setSearchQuery("");
                        setPage(1);
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

          {/* Leave Requests Table */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            {/* Desktop: full table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Employee</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Date Range</th>
                    <th className="py-3 px-3 text-center">Duration</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagedRows.map((r) => {
                    const typeCfg = LEAVE_TYPE_CONFIG[r.leave_type] || {
                      label: r.leave_type,
                      icon: "ri-calendar-event-line",
                      bg: "bg-gray-50",
                      text: "text-gray-700",
                      border: "border-gray-200",
                      badgeBg: "bg-gray-100 text-gray-800",
                    };
                    const statusCfg = STATUS_CONFIG[r.status] || {
                      label: r.status,
                      icon: "ri-checkbox-circle-line",
                      bg: "bg-gray-100 text-gray-700 border-gray-200",
                      text: "text-gray-700",
                      dot: "bg-gray-400",
                    };
                    const isSelf = r.employee_id === myEmployee?.id;
                    const isHighlighted = r.id === highlightId;

                    return (
                      <tr
                        key={r.id}
                        id={`leave-request-desktop-${r.id}`}
                        tabIndex={-1}
                        className={`group hover:bg-slate-50/80 transition-colors ${isHighlighted ? "bg-indigo-50/40 ring-2 ring-inset ring-[#253C7D]/30" : ""
                          }`}
                      >
                        {/* Employee Column */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#253C7D] to-[#3B5998] text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden flex-shrink-0">
                              {r.employees?.avatar_url ? (
                                <img
                                  src={r.employees.avatar_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>
                                  {r.employees?.first_name?.charAt(0) || "E"}
                                  {r.employees?.last_name?.charAt(0) || ""}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[13px] font-bold text-gray-900 leading-snug">
                                  {r.employees?.first_name} {r.employees?.last_name}
                                </span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                <span>{r.employees?.role || "Staff"}</span>
                                <span>&bull;</span>
                                <span className="font-medium text-gray-600">
                                  {r.employees?.department || "General"}
                                </span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Leave Type */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold border ${typeCfg.bg} ${typeCfg.text} ${typeCfg.border}`}
                          >
                            <i className={`${typeCfg.icon} text-xs`} />
                            <span>{typeCfg.label}</span>
                          </span>
                        </td>

                        {/* Date Range */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-[12px] font-medium text-gray-900">
                            {formatDateShort(r.start_date)} – {formatDateShort(r.end_date)}
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {r.start_date?.slice(0, 4)}
                          </span>
                        </td>

                        {/* Duration */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-[12px] font-bold text-gray-800">
                            {r.days} {r.days === 1 ? "day" : "days"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusCfg.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            <span>{statusCfg.label}</span>
                          </span>
                        </td>

                        {/* Reason Preview */}
                        <td className="py-3.5 px-4 max-w-[200px]">
                          {r.reason ? (
                            <p
                              className="text-[12px] text-gray-600 truncate cursor-pointer hover:text-gray-900"
                              title={r.reason}
                              onClick={() => setInspectRequest(r)}
                            >
                              {r.reason}
                            </p>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">No notes provided</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Manager Actions for Pending Requests */}
                            {canApproveLeave && r.status === "pending" && !isSelf && (
                              <>
                                <button
                                  onClick={() => openApproval(r, "approved")}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                                  title="Approve request"
                                >
                                  <i className="ri-check-line" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => openApproval(r, "rejected")}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                                  title="Reject request"
                                >
                                  <i className="ri-close-line" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {/* Self-service Cancel for Pending Requests */}
                            {isSelf && r.status === "pending" && (
                              <button
                                onClick={() => openCancelModal(r)}
                                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-gray-600 text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer"
                                title="Cancel my request"
                              >
                                <i className="ri-close-circle-line text-xs" />
                                <span>Cancel</span>
                              </button>
                            )}

                            {/* View full details button */}
                            <button
                              onClick={() => setInspectRequest(r)}
                              className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                              title="View details"
                            >
                              <i className="ri-eye-line text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRequests.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-gray-400">
                        <div className="max-w-xs mx-auto">
                          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
                            <i className="ri-calendar-line text-2xl" />
                          </div>
                          <h4 className="text-[14px] font-bold text-gray-700">No leave requests found</h4>
                          <p className="text-[12px] text-gray-400 mt-1">
                            {statusFilter !== "all" || searchQuery || leaveTypeFilter !== "all"
                              ? "Try adjusting your filters or search keywords."
                              : "Submit a new time-off request to get started."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile: card list */}
            <div className="md:hidden divide-y divide-gray-100">
              {pagedRows.map((r) => {
                const typeCfg = LEAVE_TYPE_CONFIG[r.leave_type] || {
                  label: r.leave_type,
                  icon: "ri-calendar-event-line",
                  bg: "bg-gray-50",
                  text: "text-gray-700",
                  border: "border-gray-200",
                  badgeBg: "bg-gray-100 text-gray-800",
                };
                const statusCfg = STATUS_CONFIG[r.status] || {
                  label: r.status,
                  icon: "ri-checkbox-circle-line",
                  bg: "bg-gray-100 text-gray-700 border-gray-200",
                  text: "text-gray-700",
                  dot: "bg-gray-400",
                };
                const isSelf = r.employee_id === myEmployee?.id;
                const isHighlighted = r.id === highlightId;

                return (
                  <div
                    key={r.id}
                    id={`leave-request-mobile-${r.id}`}
                    tabIndex={-1}
                    className={`p-4 space-y-3 ${isHighlighted ? "bg-indigo-50/40 ring-2 ring-inset ring-[#253C7D]/30" : ""}`}
                  >
                    {/* Employee + view details */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#253C7D] to-[#3B5998] text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden flex-shrink-0">
                          {r.employees?.avatar_url ? (
                            <img src={r.employees.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>
                              {r.employees?.first_name?.charAt(0) || "E"}
                              {r.employees?.last_name?.charAt(0) || ""}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[13px] font-bold text-gray-900 leading-snug truncate">
                              {r.employees?.first_name} {r.employees?.last_name}
                            </span>
                            {isSelf && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-700 shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate">
                            {r.employees?.role || "Staff"} &bull;{" "}
                            <span className="font-medium text-gray-600">
                              {r.employees?.department || "General"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setInspectRequest(r)}
                        className="w-8 h-8 shrink-0 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                        title="View details"
                      >
                        <i className="ri-eye-line text-sm" />
                      </button>
                    </div>

                    {/* Type + Status badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${typeCfg.bg} ${typeCfg.text} ${typeCfg.border}`}
                      >
                        <i className={`${typeCfg.icon} text-xs`} />
                        <span>{typeCfg.label}</span>
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusCfg.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        <span>{statusCfg.label}</span>
                      </span>
                    </div>

                    {/* Date range + duration */}
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-medium text-gray-900">
                        {formatDateShort(r.start_date)} – {formatDateShort(r.end_date)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-bold text-gray-800 shrink-0">
                        {r.days} {r.days === 1 ? "day" : "days"}
                      </span>
                    </div>

                    {/* Reason */}
                    {r.reason ? (
                      <p
                        className="text-[12px] text-gray-600 line-clamp-2 cursor-pointer"
                        onClick={() => setInspectRequest(r)}
                      >
                        {r.reason}
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">No notes provided</p>
                    )}

                    {/* Actions */}
                    {((canApproveLeave && r.status === "pending" && !isSelf) ||
                      (isSelf && r.status === "pending")) && (
                      <div className="flex items-center gap-2 pt-1">
                        {canApproveLeave && r.status === "pending" && !isSelf && (
                          <>
                            <button
                              onClick={() => openApproval(r, "approved")}
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <i className="ri-check-line" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => openApproval(r, "rejected")}
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <i className="ri-close-line" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {isSelf && r.status === "pending" && (
                          <button
                            onClick={() => openCancelModal(r)}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-gray-600 text-[11px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <i className="ri-close-circle-line text-xs" />
                            <span>Cancel Request</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredRequests.length === 0 && !loading && (
                <div className="py-16 text-center text-gray-400">
                  <div className="max-w-xs mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
                      <i className="ri-calendar-line text-2xl" />
                    </div>
                    <h4 className="text-[14px] font-bold text-gray-700">No leave requests found</h4>
                    <p className="text-[12px] text-gray-400 mt-1">
                      {statusFilter !== "all" || searchQuery || leaveTypeFilter !== "all"
                        ? "Try adjusting your filters or search keywords."
                        : "Submit a new time-off request to get started."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {filteredRequests.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-gray-200/80 bg-gray-50/50">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-[12px] text-gray-500">
                    Showing <span className="font-bold text-gray-800">{pageStart}</span>–
                    <span className="font-bold text-gray-800">{pageEnd}</span> of{" "}
                    <span className="font-bold text-gray-800">{filteredRequests.length}</span> requests
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-400">Per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      className="px-2 py-0.5 border border-gray-200 rounded-md text-[11px] bg-white text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
                    >
                      {[5, 10, 20, 50].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    aria-label="Previous page"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <i className="ri-arrow-left-s-line" />
                  </button>

                  {pageWindow(safePage, totalPages).map((p, i) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="w-8 h-8 flex items-center justify-center text-[11px] text-gray-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-bold transition-all cursor-pointer ${p === safePage
                            ? "bg-[#253C7D] text-white shadow-sm"
                            : "text-gray-600 hover:bg-gray-100"
                          }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    aria-label="Next page"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <i className="ri-arrow-right-s-line" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= TAB 2: LEAVE BALANCES & QUOTAS ======================= */}
      {activeTab === "balances" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {myEmployee ? `${myEmployee.first_name} ${myEmployee.last_name}'s Leave Quotas` : "Leave Balances"}
                </h3>
                <p className="text-[12px] text-gray-500">
                  Year {currentYear} entitlement, approved days used, and remaining balance.
                </p>
              </div>
              <button
                onClick={() => {
                  setFormData((p) => ({ ...p, employee_id: myEmployee?.id || "" }));
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#253C7D] text-white text-[12px] font-semibold hover:bg-[#1d3066] cursor-pointer"
              >
                <i className="ri-add-line" />
                <span>Apply Using Balance</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(LEAVE_TYPE_CONFIG).map(([type, cfg]) => {
                const empId = myEmployee?.id || "";
                const entitlement = getEntitlement(empId, type);
                const used = getUsedDays(empId, type);
                const pending = getPendingDays(empId, type);
                const remaining = getRemaining(empId, type);
                const pctUsed =
                  entitlement && entitlement > 0
                    ? Math.min(100, Math.round((used / entitlement) * 100))
                    : 0;

                return (
                  <div
                    key={type}
                    className="relative bg-gradient-to-b from-white to-gray-50/50 rounded-2xl border border-gray-200/90 p-4 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-base border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          <i className={cfg.icon} />
                        </span>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          {entitlement === null ? "Unlimited" : `${entitlement} Days Allotted`}
                        </span>
                      </div>

                      <h4 className="text-[14px] font-bold text-gray-900">{cfg.label}</h4>

                      <div className="mt-4 flex items-baseline justify-between">
                        <div>
                          <span className="text-2xl font-black text-gray-900 tracking-tight">
                            {remaining === null ? "∞" : remaining}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium ml-1">days left</span>
                        </div>
                        {pending > 0 && (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {pending} pending
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {entitlement !== null && (
                        <div className="mt-3">
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${pctUsed > 80 ? "bg-rose-500" : pctUsed > 50 ? "bg-amber-500" : "bg-[#253C7D]"
                                }`}
                              style={{ width: `${pctUsed}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1 font-medium">
                            <span>{used} days used</span>
                            <span>{pctUsed}% utilized</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Policy: {type}</span>
                      <button
                        onClick={() => {
                          setFormData({
                            employee_id: myEmployee?.id || "",
                            leave_type: type,
                            start_date: "",
                            end_date: "",
                            reason: "",
                          });
                          setShowForm(true);
                        }}
                        className="text-[11px] font-bold text-[#253C7D] hover:underline cursor-pointer"
                      >
                        Apply this &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 3: TEAM SCHEDULE CALENDAR ======================= */}
      {activeTab === "calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Calendar View */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const now = new Date();
                    setCalendarYear(now.getFullYear());
                    setCalendarMonth(now.getMonth());
                    setSelectedCalendarDay(now.getDate());
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[12px] rounded-xl transition-all cursor-pointer"
                >
                  Today
                </button>
                <h3 className="text-base font-bold text-gray-900">
                  {monthNames[calendarMonth]} {calendarYear}
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Department filter */}
                <select
                  value={calDeptFilter}
                  onChange={(e) => setCalDeptFilter(e.target.value)}
                  className="flex-1 sm:flex-none min-w-0 px-2.5 py-1.5 rounded-xl border border-gray-200 text-[12px] bg-white text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setCalendarMonth((m) => (m === 0 ? 11 : m - 1));
                    if (calendarMonth === 0) setCalendarYear((y) => y - 1);
                  }}
                  className="w-8 h-8 rounded-xl border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
                  title="Previous month"
                >
                  <i className="ri-arrow-left-s-line" />
                </button>
                <button
                  onClick={() => {
                    setCalendarMonth((m) => (m === 11 ? 0 : m + 1));
                    if (calendarMonth === 11) setCalendarYear((y) => y + 1);
                  }}
                  className="w-8 h-8 rounded-xl border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
                  title="Next month"
                >
                  <i className="ri-arrow-right-s-line" />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5" ref={calendarRef}>
              {calendarDays.map((d, idx) => {
                const dayIsToday = d.date > 0 && isToday(d.date);
                const isSelected = d.date > 0 && d.date === selectedCalendarDay;
                const hasLeaves = d.requests.length > 0;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (d.date > 0) setSelectedCalendarDay(d.date);
                    }}
                    className={`min-h-[70px] sm:min-h-[85px] p-1.5 rounded-xl border transition-all flex flex-col justify-between ${d.date === 0
                        ? "bg-transparent border-transparent cursor-default"
                        : isSelected
                          ? "bg-[#253C7D]/5 border-[#253C7D] ring-2 ring-[#253C7D]/20 shadow-sm cursor-pointer"
                          : dayIsToday
                            ? "bg-amber-50/50 border-amber-300 cursor-pointer"
                            : hasLeaves
                              ? "bg-slate-50/80 border-slate-200 hover:border-slate-300 cursor-pointer"
                              : "bg-white border-gray-100 hover:border-gray-200 cursor-pointer"
                      }`}
                  >
                    {d.date > 0 && (
                      <>
                        <div className="flex items-center justify-between">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${dayIsToday
                                ? "bg-[#253C7D] text-white shadow-sm"
                                : isSelected
                                  ? "bg-indigo-100 text-[#253C7D]"
                                  : "text-gray-700"
                              }`}
                          >
                            {d.date}
                          </span>

                          {hasLeaves && (
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-extrabold shadow-sm">
                              {d.requests.length}
                            </span>
                          )}
                        </div>

                        {/* Leave chips preview */}
                        <div className="space-y-1 mt-1 overflow-hidden">
                          {d.requests.slice(0, 2).map((req, rIdx) => {
                            const cfg = LEAVE_TYPE_CONFIG[req.leave_type] || {
                              label: req.leave_type,
                              badgeBg: "bg-gray-100 text-gray-800",
                            };
                            return (
                              <div
                                key={rIdx}
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${cfg.badgeBg}`}
                                title={`${req.employees?.first_name} ${req.employees?.last_name} (${cfg.label})`}
                              >
                                {req.employees?.first_name}
                              </div>
                            );
                          })}
                          {d.requests.length > 2 && (
                            <div className="text-[9px] font-bold text-gray-400 pl-1">
                              +{d.requests.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Detail Drawer Panel */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <div>
                  <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">
                    Schedule for
                  </span>
                  <h4 className="text-base font-bold text-gray-900">
                    {selectedCalendarDay
                      ? `${monthNames[calendarMonth]} ${selectedCalendarDay}, ${calendarYear}`
                      : "Select a Date"}
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                  {selectedDayRequests.length} on leave
                </span>
              </div>

              {selectedDayRequests.length > 0 ? (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {selectedDayRequests.map((req) => {
                    const cfg = LEAVE_TYPE_CONFIG[req.leave_type] || {
                      label: req.leave_type,
                      icon: "ri-calendar-event-line",
                      bg: "bg-gray-50",
                      text: "text-gray-700",
                      badgeBg: "bg-gray-100 text-gray-800",
                      border: "border-gray-200",
                    };
                    return (
                      <div
                        key={req.id}
                        className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#253C7D] text-white flex items-center justify-center font-bold text-[10px] shadow-sm overflow-hidden">
                              {req.employees?.avatar_url ? (
                                <img src={req.employees.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span>{req.employees?.first_name?.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <p className="text-[12px] font-bold text-gray-900 leading-tight">
                                {req.employees?.first_name} {req.employees?.last_name}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {req.employees?.department} &bull; {req.employees?.role}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                          >
                            {cfg.label}
                          </span>
                        </div>

                        <div className="text-[11px] text-gray-600 bg-white p-2 rounded-lg border border-gray-100 mt-2">
                          <div className="flex items-center justify-between text-gray-500 mb-0.5">
                            <span>From: {formatDate(req.start_date)}</span>
                            <span>To: {formatDate(req.end_date)}</span>
                          </div>
                          {req.reason && <p className="italic text-gray-700 mt-1">"{req.reason}"</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-400">
                  <i className="ri-team-line text-3xl mb-2 block text-gray-300" />
                  <p className="text-[13px] font-semibold text-gray-600">Full Team Available</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    No approved time-off recorded for this date.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  if (selectedDayDateStr) {
                    setFormData((prev) => ({
                      ...prev,
                      employee_id: myEmployee?.id || "",
                      start_date: selectedDayDateStr,
                      end_date: selectedDayDateStr,
                    }));
                  }
                  setShowForm(true);
                }}
                className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-[12px] font-bold hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
              >
                Request Leave for This Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= REQUEST LEAVE MODAL ======================= */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden transform animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-[#253C7D] text-white flex items-center justify-center shadow-sm">
                  <i className="ri-calendar-event-line text-base" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Request Leave</h3>
                  <p className="text-[11px] text-gray-500">
                    Submit your application for manager review and approval
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-xl hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Employee Selection */}
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                  Employee <span className="text-rose-500">*</span>
                </label>
                {canManage ? (
                  <EmployeeSearchSelect
                    employees={employees}
                    value={formData.employee_id}
                    onChange={(id) => setFormData((p) => ({ ...p, employee_id: id }))}
                  />
                ) : (
                  <div className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-800 flex items-center justify-between">
                    <span className="font-semibold">
                      {myEmployee ? `${myEmployee.first_name} ${myEmployee.last_name}` : "—"}
                    </span>
                    <span className="text-xs text-gray-500">{myEmployee?.department}</span>
                  </div>
                )}
              </div>

              {/* Leave Type */}
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                  Leave Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] bg-white cursor-pointer"
                >
                  {Object.entries(LEAVE_TYPE_CONFIG).map(([type, cfg]) => {
                    const rem = activeEmpForForm ? getRemaining(activeEmpForForm, type) : null;
                    return (
                      <option key={type} value={type}>
                        {cfg.label}
                        {activeEmpForForm
                          ? ` — ${rem === null ? "Unlimited" : `${rem} day${rem !== 1 ? "s" : ""} available`}`
                          : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Balance Alert Box */}
              {activeEmpForForm && formRemainingDays !== null && (
                <div
                  className={`p-3 rounded-xl border flex items-center flex-wrap gap-x-3 gap-y-1 justify-between text-[12px] ${isOverBalance
                      ? "bg-rose-50 border-rose-200 text-rose-800"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <i
                      className={`${isOverBalance ? "ri-error-warning-fill text-rose-600" : "ri-checkbox-circle-fill text-emerald-600"
                        } text-base`}
                    />
                    <span>
                      Available Balance: <strong>{formRemainingDays} days</strong>
                    </span>
                  </div>
                  {formRequestedDays > 0 && (
                    <span className="font-semibold">
                      Requested: <strong>{formRequestedDays} days</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Quick Presets */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Quick Presets
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: "today", label: "Today" },
                    { id: "tomorrow", label: "Tomorrow" },
                    { id: "3days", label: "Next 3 Days" },
                    { id: "thisWeek", label: "This Week" },
                    { id: "nextWeek", label: "Next Week" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDatePreset(p.id as any)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]"
                    required
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                  Reason / Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  maxLength={500}
                  placeholder="Provide context or coverage details for your manager..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] resize-none"
                />
                <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
                  <span>Keep it clear and informative</span>
                  <span>{formData.reason.length}/500</span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (canManage && !formData.employee_id && !myEmployee)}
                  className="flex-1 px-4 py-2.5 bg-[#253C7D] text-white rounded-xl text-[13px] font-bold hover:bg-[#1d3066] active:scale-[0.98] transition-all shadow-md shadow-[#253C7D]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= APPROVAL / REJECTION MODAL ======================= */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden transform animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${approvalAction === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}
              >
                <i
                  className={`${approvalAction === "approved" ? "ri-checkbox-circle-fill" : "ri-close-circle-fill"
                    } text-2xl`}
                />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {approvalAction === "approved" ? "Approve Leave Request" : "Reject Leave Request"}
              </h3>
              <p className="text-[13px] text-gray-500 mb-4">
                {selectedRequest.employees?.first_name} {selectedRequest.employees?.last_name} &bull;{" "}
                {LEAVE_TYPE_CONFIG[selectedRequest.leave_type]?.label || selectedRequest.leave_type} (
                {selectedRequest.days} {selectedRequest.days === 1 ? "day" : "days"})
              </p>

              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-[12px] text-gray-600 mb-4 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="font-semibold text-gray-800">
                    {formatDate(selectedRequest.start_date)} – {formatDate(selectedRequest.end_date)}
                  </span>
                </div>
                {selectedRequest.reason && (
                  <div className="flex justify-between pt-1 border-t border-gray-200/60">
                    <span className="text-gray-400">Reason:</span>
                    <span className="text-gray-800 font-medium italic truncate max-w-[200px]">
                      "{selectedRequest.reason}"
                    </span>
                  </div>
                )}
              </div>

              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                Reviewer Note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder={`Add optional remarks for ${approvalAction === "approved" ? "approval" : "rejection"}...`}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] resize-none"
              />

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  disabled={processingApproval}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApproval}
                  disabled={processingApproval}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all shadow-sm disabled:opacity-60 cursor-pointer ${approvalAction === "approved"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                    }`}
                >
                  {processingApproval
                    ? "Processing..."
                    : approvalAction === "approved"
                      ? "Confirm Approval"
                      : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= CANCELLATION MODAL ======================= */}
      {showCancelModal && cancelTargetRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden transform animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-rose-100 text-rose-700">
                <i className="ri-close-circle-line text-2xl" />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Cancel Leave Request
              </h3>
              <p className="text-[13px] text-gray-500 mb-4">
                {cancelTargetRequest.employees?.first_name} {cancelTargetRequest.employees?.last_name} &bull;{" "}
                {LEAVE_TYPE_CONFIG[cancelTargetRequest.leave_type]?.label || cancelTargetRequest.leave_type} (
                {cancelTargetRequest.days} {cancelTargetRequest.days === 1 ? "day" : "days"})
              </p>

              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 text-[12px] text-gray-600 mb-4 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Date Range:</span>
                  <span className="font-semibold text-gray-800">
                    {formatDate(cancelTargetRequest.start_date)} – {formatDate(cancelTargetRequest.end_date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="font-semibold text-gray-800">
                    {cancelTargetRequest.days} {cancelTargetRequest.days === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>

              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                Cancellation Reason <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Why do you want to cancel this request? (e.g. plans changed, shift rescheduled)..."
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] resize-none"
              />

              <div className="flex gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  disabled={processingCancel}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  Keep Request
                </button>
                <button
                  type="button"
                  onClick={confirmCancelRequest}
                  disabled={processingCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {processingCancel ? "Cancelling..." : "Confirm Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= INSPECT DETAILS DRAWER / MODAL ======================= */}
      {inspectRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden transform animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
                  <i className="ri-information-line text-lg" />
                </span>
                <h3 className="text-base font-bold text-gray-900">Leave Request Details</h3>
              </div>
              <button
                onClick={() => setInspectRequest(null)}
                className="w-8 h-8 rounded-xl hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Employee Summary Card */}
              <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-11 h-11 rounded-full bg-[#253C7D] text-white flex items-center justify-center font-bold text-sm overflow-hidden">
                  {inspectRequest.employees?.avatar_url ? (
                    <img
                      src={inspectRequest.employees.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {inspectRequest.employees?.first_name?.charAt(0)}
                      {inspectRequest.employees?.last_name?.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-gray-900">
                    {inspectRequest.employees?.first_name} {inspectRequest.employees?.last_name}
                  </h4>
                  <p className="text-[12px] text-gray-500">
                    {inspectRequest.employees?.role} &bull; {inspectRequest.employees?.department}
                  </p>
                </div>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div className="p-3 rounded-xl border border-gray-100 bg-white">
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-bold">
                    Leave Type
                  </span>
                  <span className="font-bold text-gray-900 text-[13px] mt-0.5 block">
                    {LEAVE_TYPE_CONFIG[inspectRequest.leave_type]?.label || inspectRequest.leave_type}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-gray-100 bg-white">
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-bold">
                    Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-bold text-[12px] mt-0.5 capitalize ${inspectRequest.status === "approved"
                        ? "text-emerald-700"
                        : inspectRequest.status === "pending"
                          ? "text-amber-700"
                          : "text-rose-700"
                      }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[inspectRequest.status]?.dot || "bg-gray-400"
                        }`}
                    />
                    {inspectRequest.status}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-gray-100 bg-white">
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-bold">
                    Date Period
                  </span>
                  <span className="font-semibold text-gray-800 mt-0.5 block">
                    {formatDate(inspectRequest.start_date)}
                  </span>
                  <span className="text-[11px] text-gray-500">to {formatDate(inspectRequest.end_date)}</span>
                </div>

                <div className="p-3 rounded-xl border border-gray-100 bg-white">
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-bold">
                    Total Duration
                  </span>
                  <span className="font-black text-gray-900 text-base mt-0.5 block">
                    {inspectRequest.days} {inspectRequest.days === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Reason / Coverage Note
                </label>
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50 text-[13px] text-gray-700">
                  {inspectRequest.reason || <span className="italic text-gray-400">No reason provided</span>}
                </div>
              </div>

              {/* Action buttons inside details */}
              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
                {canApproveLeave &&
                  inspectRequest.status === "pending" &&
                  inspectRequest.employee_id !== myEmployee?.id && (
                    <>
                      <button
                        onClick={() => {
                          const req = inspectRequest;
                          setInspectRequest(null);
                          openApproval(req, "approved");
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                      >
                        Approve Request
                      </button>
                      <button
                        onClick={() => {
                          const req = inspectRequest;
                          setInspectRequest(null);
                          openApproval(req, "rejected");
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[12px] font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Reject Request
                      </button>
                    </>
                  )}

                {inspectRequest.employee_id === myEmployee?.id && inspectRequest.status === "pending" && (
                  <button
                    onClick={() => {
                      const req = inspectRequest;
                      setInspectRequest(null);
                      openCancelModal(req);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[12px] font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel Application
                  </button>
                )}

                <button
                  onClick={() => setInspectRequest(null)}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[12px] font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
