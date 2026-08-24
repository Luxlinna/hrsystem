import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { todayYMD } from "@/lib/date";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import PayslipTab from "./components/PayslipTab";
import LeaveTab from "./components/LeaveTab";
import BenefitsTab from "./components/BenefitsTab";
import CheckInTab from "./components/CheckInTab";
import AttendanceTab from "./components/AttendanceTab";
import DailyReportTab from "./components/DailyReportTab";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  status: string;
  join_date: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  reports_to: string | null;
  branches: { name: string } | null;
}

const STATUS_STYLES: Record<string, { label: string; className: string; icon: string }> = {
  active: { label: "Active", className: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: "ri-checkbox-circle-fill" },
  on_leave: { label: "On Leave", className: "text-amber-700 bg-amber-50 border-amber-200", icon: "ri-calendar-event-fill" },
  onboarding: { label: "Onboarding", className: "text-sky-700 bg-sky-50 border-sky-200", icon: "ri-user-add-fill" },
  suspended: { label: "Suspended", className: "text-rose-700 bg-rose-50 border-rose-200", icon: "ri-error-warning-fill" },
  inactive: { label: "Inactive", className: "text-gray-600 bg-gray-50 border-gray-200", icon: "ri-close-circle-fill" },
};

const TABS = [
  { id: "payslips", label: "My Payslips", icon: "ri-file-list-3-line" },
  { id: "leave", label: "My Leave", icon: "ri-calendar-event-line" },
  { id: "attendance", label: "My Attendance", icon: "ri-time-line" },
  { id: "checkin", label: "Check In/Out", icon: "ri-fingerprint-line" },
  { id: "daily-report", label: "Daily Report", icon: "ri-file-list-2-line" },
  { id: "benefits", label: "My Benefits", icon: "ri-heart-pulse-line" },
];

export default function SelfServicePage() {
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

  // Overview strip data — lets the employee see today's status and act
  // (check in, chase a pending leave, check the latest payslip) without
  // having to click through every tab first.
  const [todayAttendance, setTodayAttendance] = useState<any | null>(null);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [latestPayslip, setLatestPayslip] = useState<any | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // The router keeps this page mounted across search-param-only navigations
  // (e.g. a Quick Action link or the geofence alert sending the user back to
  // /self-service?tab=checkin while already on this route), so activeTab's
  // useState initializer alone won't pick up a later tab= change.
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) setActiveTab(t);
  }, [searchParams]);

  // Self-service is strictly "your own account, your own actions" — actions like
  // Check In/Out post as whichever employee is loaded here, so this must always
  // resolve to the signed-in user's own record and never anyone else's.
  useEffect(() => {
    if (permsLoading) return;
    if (!user?.email) { setLoading(false); return; }

    (async () => {
      const { data } = await supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, status, join_date, email, phone, avatar_url, reports_to, branches(name)")
        .eq("email", user.email)
        .maybeSingle();

      const emp = data as unknown as Employee | null;
      if (emp) {
        setSelectedEmployee(emp);
        // Manager name comes from a follow-up lookup rather than an embedded
        // self-join — employees has two relationships to branches, so PostgREST
        // can't disambiguate a nested embed here.
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

  // Overview strip: today's attendance, pending leave, latest payslip, unread
  // notifications. Re-runs whenever the active tab changes so the stats stay
  // fresh after the employee clocks in/out or files a leave request.
  useEffect(() => {
    if (!selectedEmployee || !user) return;
    (async () => {
      const today = todayYMD();
      const [attRes, leaveRes, payRes, notifRes] = await Promise.all([
        supabase.from("attendance_records").select("*").eq("employee_id", selectedEmployee.id).eq("date", today).maybeSingle(),
        supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("employee_id", selectedEmployee.id).eq("status", "pending"),
        supabase.from("payroll_records").select("*").eq("employee_id", selectedEmployee.id).order("month", { ascending: false }).limit(1).maybeSingle(),
        can("notifications")
          ? supabase.from("notifications").select("id", { count: "exact", head: true }).or(`recipient_user_id.is.null,recipient_user_id.eq.${user.id}`).eq("is_read", false)
          : Promise.resolve({ count: 0 }),
      ]);
      setTodayAttendance((attRes as any).data || null);
      setPendingLeaveCount((leaveRes as any).count || 0);
      setLatestPayslip((payRes as any).data || null);
      setUnreadCount((notifRes as any).count || 0);
    })();
  }, [selectedEmployee, user, can, activeTab]);

  const yearsAtCompany = selectedEmployee?.join_date
    ? Math.floor((new Date().getTime() - new Date(selectedEmployee.join_date).getTime()) / (365.25 * 86400000))
    : 0;

  const statusMeta =
    STATUS_STYLES[selectedEmployee?.status || ""] || {
      label: selectedEmployee?.status || "Unknown",
      className: "text-gray-600 bg-gray-50 border-gray-200",
      icon: "ri-information-line",
    };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (noOwnRecord) {
    return (
      <div className="min-h-screen bg-[#F8F8F7] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <i className="ri-user-search-line text-3xl text-gray-300 mb-3 block" />
          <h2 className="text-lg font-bold text-gray-900">No employee record found</h2>
          <p className="text-sm text-gray-500 mt-1">
            We couldn't find an employee record matching your account email ({user?.email}). Ask HR to link your profile.
          </p>
        </div>
      </div>
    );
  }

  const activeTabMeta = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] font-bold">Self-Service</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Employee Self-Service
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Access your payslips, leave requests, attendance, and benefits enrollment.
          </p>
        </div>
      </div>

      {/* Employee Profile Banner */}
      <div className="relative overflow-hidden bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 mb-6 shadow-2xs">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-[#253C7D] via-[#2E5AA8] to-[#29ABE2] opacity-[0.06]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {selectedEmployee && (
              <>
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl p-[2px] bg-gradient-to-br from-[#253C7D] to-[#29ABE2]">
                    {selectedEmployee.avatar_url ? (
                      <img
                        src={selectedEmployee.avatar_url}
                        alt={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                        className="w-full h-full rounded-[14px] object-cover border-2 border-white"
                      />
                    ) : (
                      <div className="w-full h-full rounded-[14px] border-2 border-white bg-[#253C7D] text-white font-black text-lg flex items-center justify-center">
                        {selectedEmployee.first_name?.[0]}
                        {selectedEmployee.last_name?.[0]}
                      </div>
                    )}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${
                      selectedEmployee.status === "active" ? "bg-emerald-500"
                        : selectedEmployee.status === "on_leave" ? "bg-amber-500"
                        : selectedEmployee.status === "onboarding" ? "bg-sky-500"
                        : selectedEmployee.status === "suspended" ? "bg-rose-500"
                        : "bg-gray-400"
                    }`}
                    title={statusMeta.label}
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 truncate">{selectedEmployee.first_name} {selectedEmployee.last_name}</h2>
                  <p className="text-sm text-gray-500 truncate">
                    {selectedEmployee.role || "Staff"}
                    {selectedEmployee.department ? ` · ${selectedEmployee.department}` : ""}
                  </p>

                  {/* Real contact details straight from the employee record */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-gray-500">
                    <a href={`mailto:${selectedEmployee.email}`} className="inline-flex items-center gap-1 hover:text-[#253C7D] hover:underline truncate">
                      <i className="ri-mail-line text-gray-400" />{selectedEmployee.email}
                    </a>
                    {selectedEmployee.phone && (
                      <a href={`tel:${selectedEmployee.phone}`} className="inline-flex items-center gap-1 hover:text-[#253C7D] hover:underline">
                        <i className="ri-phone-line text-gray-400" />{selectedEmployee.phone}
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-200/70 px-2 py-0.5 rounded-full">
                      <i className="ri-building-line text-gray-400" />{selectedEmployee.branches?.name || "Unassigned"}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-200/70 px-2 py-0.5 rounded-full"
                      title={`Joined ${new Date(selectedEmployee.join_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
                    >
                      <i className="ri-calendar-line text-gray-400" />
                      {yearsAtCompany > 0
                        ? `${yearsAtCompany} yr${yearsAtCompany !== 1 ? "s" : ""} at company`
                        : `Joined ${new Date(selectedEmployee.join_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                    </span>
                    {managerName && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-200/70 px-2 py-0.5 rounded-full">
                        <i className="ri-user-star-line text-gray-400" />
                        Reports to {managerName}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.className}`}>
                      <i className={statusMeta.icon} />{statusMeta.label}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Today's Overview & Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <button
          onClick={() => setActiveTab("checkin")}
          className={`text-left bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            activeTab === "checkin" ? "border-emerald-600 ring-2 ring-emerald-600/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Today</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i className="ri-fingerprint-line text-sm" />
            </div>
          </div>
          <p className="text-base font-black text-gray-900 mt-2 truncate">
            {todayAttendance?.clock_in && todayAttendance?.clock_out
              ? "Day Complete"
              : todayAttendance?.clock_in
              ? `Checked In · ${todayAttendance.clock_in.slice(0, 5)}`
              : "Not Checked In"}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {todayAttendance?.clock_in ? "Tap to view attendance" : "Tap to check in now"}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </button>

        <button
          onClick={() => setActiveTab("leave")}
          className={`text-left bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            activeTab === "leave" ? "border-amber-600 ring-2 ring-amber-600/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Leave</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <i className="ri-calendar-event-line text-sm" />
            </div>
          </div>
          <p className="text-base font-black text-gray-900 mt-2">{pendingLeaveCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {pendingLeaveCount > 0 ? "Pending approval" : "Request time off"}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </button>

        <button
          onClick={() => setActiveTab("payslips")}
          className={`text-left bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            activeTab === "payslips" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Payslip</span>
            <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-sm" />
            </div>
          </div>
          <p className="text-base font-black text-gray-900 mt-2 truncate">
            {latestPayslip ? `$${Number(latestPayslip.net_pay).toLocaleString()}` : "—"}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {latestPayslip ? `For ${latestPayslip.month}` : "No payslip yet"}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
        </button>

        <Link
          to="/notifications"
          className="text-left bg-white border border-gray-200/80 rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Alerts</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <i className="ri-notification-3-line text-sm" />
            </div>
          </div>
          <p className="text-base font-black text-gray-900 mt-2">{unreadCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Unread notifications</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-gray-200/80 rounded-2xl p-1.5 mb-5 overflow-x-auto shadow-2xs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#253C7D] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <i className={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="flex items-center gap-2 px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center shrink-0">
            <i className={`${activeTabMeta.icon} text-sm`} />
          </div>
          <h3 className="text-sm font-bold text-gray-900">{activeTabMeta.label}</h3>
        </div>
        <div className="p-6">
        {selectedEmployee && (
          <>
            {activeTab === "payslips" && (
              <PayslipTab employeeId={selectedEmployee.id} employeeName={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`} />
            )}
            {activeTab === "leave" && (
              <LeaveTab employeeId={selectedEmployee.id} />
            )}
            {activeTab === "attendance" && (
              <AttendanceTab employeeId={selectedEmployee.id} />
            )}
            {activeTab === "checkin" && (
              <CheckInTab
                employeeId={selectedEmployee.id}
                employeeName={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                autoStart={quickCheckIn}
                autoCheckOut={quickCheckOut}
              />
            )}
            {activeTab === "daily-report" && (
              <DailyReportTab employeeId={selectedEmployee.id} />
            )}
            {activeTab === "benefits" && (
              <BenefitsTab employeeId={selectedEmployee.id} />
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}