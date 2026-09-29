import { Link } from "react-router-dom";

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  todayAttendance: any;
  pendingLeaveCount: number;
  latestPayslip: any;
  unreadCount: number;
  activeOutsideWork: { title: string; work_checked_in_at: string } | null;
}

export function OverviewGrid({
  activeTab,
  onTabChange,
  todayAttendance,
  pendingLeaveCount,
  latestPayslip,
  unreadCount,
  activeOutsideWork,
}: Props) {
  const isClockedIn = Boolean(activeOutsideWork || todayAttendance?.clock_in);
  const isDayDone = Boolean(todayAttendance?.clock_in && todayAttendance?.clock_out);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 mb-5">
      {/* 1. Today Attendance */}
      <button
        type="button"
        onClick={() => onTabChange("checkin")}
        className={`text-left bg-white border rounded-xl p-3 sm:p-3.5 transition-all cursor-pointer shadow-2xs hover:border-slate-300 relative group ${
          activeTab === "checkin"
            ? "border-blue-600 ring-1 ring-blue-600/20 bg-blue-50/20"
            : "border-slate-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
            Today
          </span>
          <i className="ri-fingerprint-line text-slate-400 group-hover:text-slate-700 text-base transition-colors" />
        </div>
        <p className="text-[13px] sm:text-[14px] font-bold text-slate-900 mt-2 truncate flex items-center gap-1.5">
          {isClockedIn && !isDayDone && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          )}
          {activeOutsideWork
            ? "Field Work"
            : isDayDone
            ? "Day Complete"
            : todayAttendance?.clock_in
            ? `In: ${todayAttendance.clock_in.slice(0, 5)}`
            : "Not Clocked In"}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
          {activeOutsideWork
            ? activeOutsideWork.title
            : todayAttendance?.clock_in
            ? "View punch details"
            : "Tap to record entry"}
        </p>
      </button>

      {/* 2. Leave Balance / Pending */}
      <button
        type="button"
        onClick={() => onTabChange("leave")}
        className={`text-left bg-white border rounded-xl p-3 sm:p-3.5 transition-all cursor-pointer shadow-2xs hover:border-slate-300 relative group ${
          activeTab === "leave"
            ? "border-blue-600 ring-1 ring-blue-600/20 bg-blue-50/20"
            : "border-slate-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
            Time Off
          </span>
          <i className="ri-calendar-line text-slate-400 group-hover:text-slate-700 text-base transition-colors" />
        </div>
        <p className="text-[13px] sm:text-[14px] font-bold text-slate-900 mt-2 truncate">
          {pendingLeaveCount > 0 ? `${pendingLeaveCount} Pending Approval` : "Available"}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
          {pendingLeaveCount > 0 ? "Under review" : "Request leave balance"}
        </p>
      </button>

      {/* 3. Latest Payslip */}
      <button
        type="button"
        onClick={() => onTabChange("payslips")}
        className={`text-left bg-white border rounded-xl p-3 sm:p-3.5 transition-all cursor-pointer shadow-2xs hover:border-slate-300 relative group ${
          activeTab === "payslips"
            ? "border-blue-600 ring-1 ring-blue-600/20 bg-blue-50/20"
            : "border-slate-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
            Payslip
          </span>
          <i className="ri-file-list-3-line text-slate-400 group-hover:text-slate-700 text-base transition-colors" />
        </div>
        <p className="text-[13px] sm:text-[14px] font-bold text-slate-900 mt-2 truncate">
          {latestPayslip ? `$${Number(latestPayslip.net_pay).toLocaleString()}` : "—"}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
          {latestPayslip ? `Issued for ${latestPayslip.month}` : "View pay records"}
        </p>
      </button>

      {/* 4. Notifications / Alerts */}
      <Link
        to="/notifications"
        className="text-left bg-white border border-slate-200/80 rounded-xl p-3 sm:p-3.5 transition-all cursor-pointer shadow-2xs hover:border-slate-300 relative group block"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
            Alerts
          </span>
          <i className="ri-notification-3-line text-slate-400 group-hover:text-slate-700 text-base transition-colors" />
        </div>
        <p className="text-[13px] sm:text-[14px] font-bold text-slate-900 mt-2 truncate flex items-center gap-1.5">
          {unreadCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
          {unreadCount > 0 ? `${unreadCount} Unread Updates` : "Up to Date"}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
          {unreadCount > 0 ? "Review notices" : "No pending notices"}
        </p>
      </Link>
    </div>
  );
}
