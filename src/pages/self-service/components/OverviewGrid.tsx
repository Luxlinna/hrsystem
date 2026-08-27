import { Link } from "react-router-dom";
import type { Employee } from "../types";

interface Props {
  employee: Employee;
  activeTab: string;
  onTabChange: (tab: string) => void;
  todayAttendance: any;
  pendingLeaveCount: number;
  latestPayslip: any;
  unreadCount: number;
  activeOutsideWork: { title: string; work_checked_in_at: string } | null;
}

export function OverviewGrid({ activeTab, onTabChange, todayAttendance, pendingLeaveCount, latestPayslip, unreadCount, activeOutsideWork }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      <button
        onClick={() => onTabChange("checkin")}
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
          {activeOutsideWork
            ? "Working Outside"
            : todayAttendance?.clock_in && todayAttendance?.clock_out
            ? "Day Complete"
            : todayAttendance?.clock_in
            ? `Checked In · ${todayAttendance.clock_in.slice(0, 5)}`
            : "Not Checked In"}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {activeOutsideWork
            ? activeOutsideWork.title
            : todayAttendance?.clock_in ? "Tap to view attendance" : "Tap to check in now"}
        </p>
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${activeOutsideWork ? "bg-teal-500" : "bg-emerald-500"}`} />
      </button>

      <button
        onClick={() => onTabChange("leave")}
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
        onClick={() => onTabChange("payslips")}
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
  );
}
