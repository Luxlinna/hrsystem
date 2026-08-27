import { memo } from "react";
import { Link } from "react-router-dom";
import type { AttendanceTabKey } from "../types";

interface AttendanceHeaderProps {
  currentTime: Date;
  activeTab: AttendanceTabKey;
  dateRangeBounds: { start: string; end: string } | null;
  canViewAll: boolean;
  hasEmployee: boolean;
  onExportCSV: () => void;
  onOpenLogModal: () => void;
}

export const AttendanceHeader = memo(function AttendanceHeader({
  currentTime,
  activeTab,
  dateRangeBounds,
  canViewAll,
  hasEmployee,
  onExportCSV,
  onOpenLogModal,
}: AttendanceHeaderProps) {
  return (
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
          onClick={onExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <i className="ri-file-excel-2-line text-emerald-600 text-sm" />
          Export CSV
        </button>

        {/* Manual Log Button (Can choose any old date) */}
        <button
          onClick={onOpenLogModal}
          disabled={!canViewAll && !hasEmployee}
          className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
        >
          <i className="ri-add-circle-line text-base font-bold" />
          Log Attendance
        </button>
      </div>
    </div>
  );
});
