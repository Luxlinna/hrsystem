import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  reason: string;
  created_at: string;
  employees?: {
    first_name: string;
    last_name: string;
    role: string;
    department: string;
  } | null;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  annual_leave_days?: number;
}

interface LeaveTypePolicy {
  type: string;
  default_days: number | null;
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  maternity: "Maternity Leave",
  paternity: "Paternity Leave",
  unpaid: "Unpaid Leave",
  bereavement: "Bereavement",
  study: "Study Leave",
};

export default function Leave() {
  const { user } = useAuth();
  const { role, isAdmin, loading: permsLoading } = usePermissions();
  const canViewAll = isAdmin || !!role?.leave_view_all_employees;

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  // Calendar always shows company-wide approved leave (a lightweight "who's
  // out when" schedule view), independent of canViewAll — only the request
  // table + approve/reject controls are scoped.
  const [calendarRequests, setCalendarRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [leaveTypePolicies, setLeaveTypePolicies] = useState<LeaveTypePolicy[]>([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    leave_type: "annual",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approved" | "rejected">("approved");
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const calendarRef = useRef<HTMLDivElement>(null);

  // Load leave requests with employee details
  const loadData = async () => {
    // Calendar dataset: always company-wide approved leave, regardless of role.
    const { data: calReqs } = await supabase
      .from("leave_requests")
      .select("*, employees(first_name, last_name, role, department)")
      .eq("status", "approved");
    setCalendarRequests(calReqs || []);

    if (canViewAll) {
      const { data: lr } = await supabase
        .from("leave_requests")
        .select("*, employees(first_name, last_name, role, department)")
        .order("created_at", { ascending: false });
      setRequests(lr || []);

      const { data: emp } = await supabase.from("employees").select("id, first_name, last_name, role, department, annual_leave_days").eq("status", "active");
      setEmployees(emp || []);
      return;
    }

    // Restricted role: only my own employee record + my own requests.
    if (!user?.email) return;
    const { data: me } = await supabase
      .from("employees")
      .select("id, first_name, last_name, role, department, annual_leave_days")
      .eq("email", user.email)
      .maybeSingle();
    setMyEmployee(me);

    if (me) {
      setEmployees([me]);
      const { data: lr } = await supabase
        .from("leave_requests")
        .select("*, employees(first_name, last_name, role, department)")
        .eq("employee_id", me.id)
        .order("created_at", { ascending: false });
      setRequests(lr || []);
    } else {
      setEmployees([]);
      setRequests([]);
    }
  };

  useEffect(() => {
    supabase.from("leave_type_policies").select("type, default_days").then(({ data }) => setLeaveTypePolicies(data || []));
  }, []);

  useEffect(() => {
    if (permsLoading) return;
    loadData();
    // Request notification permission so employees can receive push alerts
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const ch = supabase
      .channel("leave-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [permsLoading, canViewAll, user?.email]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const daysBetween = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.max(Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1, 1);
  };

  // Two date ranges (inclusive, yyyy-mm-dd strings) overlap if each starts
  // on or before the other's end.
  const rangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart <= bEnd && bStart <= aEnd;

  // Blocks double-booking: an employee shouldn't have two pending/approved
  // requests covering the same days, regardless of leave type.
  const findOverlappingRequest = (employeeId: string, start: string, end: string, statuses: string[], excludeId?: string) =>
    requests.find((r) =>
      r.employee_id === employeeId &&
      r.id !== excludeId &&
      statuses.includes(r.status) &&
      rangesOverlap(start, end, r.start_date, r.end_date)
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.start_date || !formData.end_date) {
      setToast({ type: "error", message: "Please fill all required fields" });
      return;
    }
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      setToast({ type: "error", message: "End date must be after start date" });
      return;
    }
    const dupe = findOverlappingRequest(formData.employee_id, formData.start_date, formData.end_date, ["pending", "approved"]);
    if (dupe) {
      setToast({ type: "error", message: `This overlaps an existing ${dupe.status} ${dupe.leave_type} request (${dupe.start_date} to ${dupe.end_date}).` });
      return;
    }

    setSubmitting(true);
    const days = daysBetween(formData.start_date, formData.end_date);
    const { error } = await supabase.from("leave_requests").insert({
      employee_id: formData.employee_id,
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
      setFormData({ employee_id: "", leave_type: "annual", start_date: "", end_date: "", reason: "" });
      loadData();
    }
  };

  const openApproval = (req: LeaveRequest, action: "approved" | "rejected") => {
    setSelectedRequest(req);
    setApprovalAction(action);
    setApprovalNote("");
    setShowApprovalModal(true);
  };

  const confirmApproval = async () => {
    if (!selectedRequest) return;

    if (approvalAction === "approved") {
      const dupe = findOverlappingRequest(selectedRequest.employee_id, selectedRequest.start_date, selectedRequest.end_date, ["approved"], selectedRequest.id);
      if (dupe) {
        setToast({ type: "error", message: `Can't approve — this employee already has an approved ${dupe.leave_type} request covering these dates (${dupe.start_date} to ${dupe.end_date}).` });
        setShowApprovalModal(false);
        setSelectedRequest(null);
        return;
      }
    }

    const { error } = await supabase
      .from("leave_requests")
      .update({ status: approvalAction })
      .eq("id", selectedRequest.id);

    if (error) {
      setToast({ type: "error", message: "Failed to update status" });
    } else {
      setToast({ type: "success", message: `Leave ${approvalAction} successfully` });
      setRequests((prev) => prev.map((r) => (r.id === selectedRequest.id ? { ...r, status: approvalAction } : r)));

      // Send push notification via edge function
      try {
        await supabase.functions.invoke("notify-leave-status", {
          body: {
            employee_name: `${selectedRequest.employees?.first_name ?? ""} ${selectedRequest.employees?.last_name ?? ""}`.trim(),
            leave_type: selectedRequest.leave_type,
            status: approvalAction,
            start_date: selectedRequest.start_date,
            end_date: selectedRequest.end_date,
          },
        });

        // Also show an in-browser notification if permission granted
        if ("Notification" in window && Notification.permission === "granted") {
          const isApproved = approvalAction === "approved";
          new Notification(isApproved ? "Leave Approved ✓" : "Leave Rejected", {
            body: `${selectedRequest.employees?.first_name ?? "Employee"}'s ${selectedRequest.leave_type} leave has been ${approvalAction}.`,
            icon: "/favicon.ico",
          });
        }
      } catch {
        // Notification failed silently — main approval still succeeded
      }
    }
    setShowApprovalModal(false);
    setSelectedRequest(null);
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const currentYear = new Date().getFullYear();
  const usedAnnualDaysThisYear = requests
    .filter((r) => r.status === "approved" && r.leave_type === "annual" && new Date(r.start_date).getFullYear() === currentYear)
    .reduce((sum, r) => sum + (r.days || 0), 0);
  const daysRemaining = Math.max(0, (myEmployee?.annual_leave_days ?? 18) - usedAnnualDaysThisYear);

  const stats = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    totalDays: requests.filter((r) => r.status === "approved").reduce((sum, r) => sum + (r.days || 0), 0),
    daysRemaining,
  };

  // Per-type leave balances — null entitlement means uncapped (e.g. unpaid).
  const getEntitlement = (employeeId: string, type: string): number | null => {
    if (type === "annual") {
      const emp = employees.find((e) => e.id === employeeId);
      return emp?.annual_leave_days ?? 18;
    }
    const policy = leaveTypePolicies.find((p) => p.type === type);
    return policy ? policy.default_days : null;
  };

  const getRemaining = (employeeId: string, type: string): number | null => {
    const entitlement = getEntitlement(employeeId, type);
    if (entitlement === null) return null;
    const used = requests
      .filter((r) => r.employee_id === employeeId && r.leave_type === type && r.status === "approved" && new Date(r.start_date).getFullYear() === currentYear)
      .reduce((sum, r) => sum + (r.days || 0), 0);
    return Math.max(0, entitlement - used);
  };

  // Calendar helpers
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const getCalendarDays = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    const startPadding = firstDay.getDay();
    const days: { date: number; requests: LeaveRequest[] }[] = [];

    for (let i = 0; i < startPadding; i++) days.push({ date: 0, requests: [] });
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayReqs = calendarRequests.filter((r) => {
        if (r.status !== "approved") return false;
        return dateStr >= r.start_date && dateStr <= r.end_date;
      });
      days.push({ date: d, requests: dayReqs });
    }
    return days;
  };

  const calendarDays = getCalendarDays();
  const today = new Date();
  const isToday = (d: number) => d === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear();

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-[13px] font-medium text-white ${
          toast.type === "success" ? "bg-[#0D7377]" : "bg-red-500"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Leave Requests</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            {canViewAll ? "Submit, track, and approve employee leave applications" : "Submit and track your own leave requests"}
          </p>
        </div>
        <button
          onClick={() => {
            if (!canViewAll) setFormData((p) => ({ ...p, employee_id: myEmployee?.id || "" }));
            setShowForm(true);
          }}
          disabled={!canViewAll && !myEmployee}
          className="inline-flex items-center gap-2 bg-[#0D7377] text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60] transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <i className="ri-calendar-event-line" />
          Submit Leave
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Pending", count: stats.pending, color: "bg-amber-50 text-amber-700" },
          { label: "Approved", count: stats.approved, color: "bg-green-50 text-green-700" },
          { label: "Rejected", count: stats.rejected, color: "bg-red-50 text-red-700" },
          canViewAll
            ? { label: "Approved Days", count: stats.totalDays, color: "bg-[#0D7377]/10 text-[#0D7377]" }
            : { label: "Days Remaining", count: stats.daysRemaining, color: "bg-[#0D7377]/10 text-[#0D7377]" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-[12px] font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Leave Calendar */}
        <div className="lg:col-span-1">
          <div className="border border-gray-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-gray-900">Leave Calendar</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setCalendarMonth((m) => (m === 0 ? 11 : m - 1)); if (calendarMonth === 0) setCalendarYear((y) => y - 1); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <i className="ri-arrow-left-s-line" />
                </button>
                <span className="text-[13px] font-medium text-gray-700 w-28 text-center">
                  {monthNames[calendarMonth]} {calendarYear}
                </span>
                <button
                  onClick={() => { setCalendarMonth((m) => (m === 11 ? 0 : m + 1)); if (calendarMonth === 11) setCalendarYear((y) => y + 1); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <i className="ri-arrow-right-s-line" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                <span key={d} className="text-[11px] font-medium text-gray-400 text-center py-1">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1" ref={calendarRef}>
              {calendarDays.map((day, i) => (
                <div
                  key={i}
                  className={`relative aspect-square flex items-center justify-center rounded-lg text-[12px] ${
                    day.date === 0
                      ? ""
                      : day.requests.length > 0
                      ? "bg-[#0D7377]/10 text-[#0D7377] font-semibold cursor-pointer hover:bg-[#0D7377]/20"
                      : isToday(day.date)
                      ? "bg-[#1A1A1A] text-white font-semibold"
                      : "text-gray-700 hover:bg-gray-50 cursor-pointer"
                  }`}
                  title={day.requests.length > 0 ? day.requests.map((r) => `${r.employees?.first_name} ${r.employees?.last_name}`).join(", ") : undefined}
                >
                  {day.date > 0 && day.date}
                  {day.requests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E11D48] text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                      {day.requests.length}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4 text-[11px] text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#0D7377]/10 border border-[#0D7377]/20" />
                <span>On Leave</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#1A1A1A]" />
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Leave Table */}
        <div className="lg:col-span-2">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {["all", "pending", "approved", "rejected"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-[12px] font-medium capitalize transition-colors ${
                  filter === f ? "bg-[#0D7377] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f}
                {f !== "all" && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                    {requests.filter((r) => r.status === f).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="hidden md:grid grid-cols-7 bg-gray-50 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <span className="col-span-2">Employee</span>
              <span>Type</span>
              <span>From</span>
              <span>To</span>
              <span>Days</span>
              <span>Actions</span>
            </div>
            {filtered.map((r) => (
              <div key={r.id} className="grid grid-cols-1 md:grid-cols-7 px-5 py-4 border-t border-gray-50 items-center">
                <div className="md:col-span-2">
                  <p className="text-[13px] font-semibold text-gray-900">
                    {r.employees?.first_name} {r.employees?.last_name}
                  </p>
                  <p className="text-[11px] text-gray-500">{r.employees?.role} &middot; {r.employees?.department}</p>
                </div>
                <span className="text-[13px] text-gray-600 capitalize mt-2 md:mt-0">{r.leave_type}</span>
                <span className="text-[13px] text-gray-500 mt-1 md:mt-0">{r.start_date}</span>
                <span className="text-[13px] text-gray-500 mt-1 md:mt-0">{r.end_date}</span>
                <span className="text-[13px] font-semibold text-gray-900 mt-1 md:mt-0">{r.days}d</span>
                <div className="flex gap-2 mt-2 md:mt-0">
                  {canViewAll && r.status === "pending" && (
                    <>
                      <button
                        onClick={() => openApproval(r, "approved")}
                        className="px-3 py-1.5 bg-green-50 text-green-700 text-[11px] font-semibold rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openApproval(r, "rejected")}
                        className="px-3 py-1.5 bg-red-50 text-red-700 text-[11px] font-semibold rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {(!canViewAll || r.status !== "pending") && (
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full capitalize whitespace-nowrap ${
                      r.status === "approved" ? "bg-green-50 text-green-700" : r.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                    }`}>
                      {r.status}
                    </span>
                  )}
                </div>
                {r.reason && (
                  <div className="md:col-span-7 mt-2">
                    <p className="text-[11px] text-gray-400">{r.reason}</p>
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <i className="ri-calendar-line text-4xl mb-3 block" />
                <p className="text-[13px]">No {filter !== "all" ? filter : ""} leave requests</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Leave Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-900">Submit Leave Request</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
                <i className="ri-close-line text-lg" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Employee *</label>
                {canViewAll ? (
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#0D7377] bg-white"
                    required
                  >
                    <option value="">Select employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} — {emp.department}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700">
                    {myEmployee ? `${myEmployee.first_name} ${myEmployee.last_name} — ${myEmployee.department}` : "—"}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Leave Type *</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#0D7377] bg-white"
                >
                  {Object.entries(LEAVE_TYPE_LABELS).map(([type, label]) => {
                    const remaining = formData.employee_id ? getRemaining(formData.employee_id, type) : null;
                    return (
                      <option key={type} value={type}>
                        {label}{formData.employee_id ? ` — ${remaining === null ? "Unlimited" : `${remaining} day${remaining !== 1 ? "s" : ""} left`}` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {formData.employee_id && (
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Leave Balances</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(LEAVE_TYPE_LABELS).map(([type, label]) => {
                      const remaining = getRemaining(formData.employee_id, type);
                      const isSelected = formData.leave_type === type;
                      return (
                        <div
                          key={type}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-[11px] ${isSelected ? "bg-[#0D7377]/10 text-[#0D7377] font-semibold" : "bg-gray-50 text-gray-500"}`}
                        >
                          <span>{label}</span>
                          <span className="font-semibold">{remaining === null ? "∞" : remaining}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Start Date *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#0D7377]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">End Date *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#0D7377]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Reason (optional)</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#0D7377] resize-none"
                  placeholder="Brief reason for leave..."
                />
                <p className="text-[11px] text-gray-400 mt-1">{formData.reason.length}/500</p>
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-[#0D7377] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60] transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="px-6 py-5">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                approvalAction === "approved" ? "bg-green-50" : "bg-red-50"
              }`}>
                <i className={`${approvalAction === "approved" ? "ri-check-line text-green-600" : "ri-close-line text-red-600"} text-xl`} />
              </div>
              <h3 className="text-[15px] font-bold text-gray-900 mb-1">
                {approvalAction === "approved" ? "Approve Leave Request" : "Reject Leave Request"}
              </h3>
              <p className="text-[13px] text-gray-500 mb-4">
                {selectedRequest.employees?.first_name} {selectedRequest.employees?.last_name} &mdash; {selectedRequest.leave_type} leave from {selectedRequest.start_date} to {selectedRequest.end_date}
              </p>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Note (optional)</label>
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#0D7377] resize-none"
                placeholder={`Add a note for ${approvalAction === "approved" ? "approval" : "rejection"}...`}
              />
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApproval}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-colors ${
                    approvalAction === "approved" ? "bg-[#0D7377] hover:bg-[#0a5c60]" : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {approvalAction === "approved" ? "Approve" : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}