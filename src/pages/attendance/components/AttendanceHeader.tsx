import { useState, useRef, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import type { AttendanceTabKey, AttendanceRecord, EmployeeSummaryItem } from "../types";
import type { ManagedShift } from "./shifts-manager/types";
import { AttendanceExportMenu } from "./AttendanceExportMenu";
import { AttendanceMainTabs } from "./AttendanceMainTabs";
import { exportAttendanceRecordsXLSX } from "../exportUtils";

interface AttendanceHeaderProps {
  currentTime: Date;
  activeTab?: AttendanceTabKey;
  dateRangeBounds: { start: string; end: string } | null;
  canViewAll: boolean;
  hasEmployee: boolean;
  onExportCSV?: () => void;
  onOpenLogModal: () => void;
  activeMainTab?: "attendance" | "attendance-schedule" | "schedule-templates" | "shifts" | "working-hours";
  setActiveMainTab?: (tab: "attendance" | "attendance-schedule" | "schedule-templates" | "shifts" | "working-hours") => void;
  records?: AttendanceRecord[];
  summaries?: EmployeeSummaryItem[];
  isFourPunchMode?: boolean;
  shifts?: ManagedShift[];
}

export const AttendanceHeader = memo(function AttendanceHeader({
  currentTime,
  activeTab = "records",
  dateRangeBounds,
  canViewAll,
  hasEmployee,
  onExportCSV,
  onOpenLogModal,
  activeMainTab = "attendance",
  setActiveMainTab,
  records = [],
  summaries = [],
  isFourPunchMode = false,
  shifts = [],
}: AttendanceHeaderProps) {
  const [logsMenuOpen, setLogsMenuOpen] = useState(false);
  const logsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (logsMenuRef.current && !logsMenuRef.current.contains(e.target as Node)) {
        setLogsMenuOpen(false);
      }
    }
    if (logsMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [logsMenuOpen]);

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">
            <span>Workforce Operations</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] dark:text-sky-400 font-bold">Attendance &amp; Timesheets</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5 flex-wrap">
            Time &amp; Attendance Hub
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 dark:bg-sky-950/60 text-[#253C7D] dark:text-sky-300">Historical Logs</span>
            {isFourPunchMode ? (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 inline-flex items-center gap-1">
                <i className="ri-fingerprint-line text-xs" /> 4-Punch Policy Active
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
                <i className="ri-time-line text-xs" /> Standard 2-Punch
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            Track daily employee check-ins, work hours, attendance history, and log manual entries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl px-3.5 py-2 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center text-sm shadow-xs">
              <i className="ri-time-line" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 dark:text-slate-100 leading-tight">
                {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500">
                {currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
            </div>
          </div>

          <div ref={logsMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setLogsMenuOpen((p) => !p)}
              className="inline-flex items-center justify-center gap-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer whitespace-nowrap"
            >
              <span>Attendance Logs</span>
              <i className={`ri-arrow-${logsMenuOpen ? "up" : "down"}-s-line text-sm`} />
            </button>

            {logsMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-40 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setLogsMenuOpen(false);
                    onOpenLogModal();
                  }}
                  disabled={!canViewAll && !hasEmployee}
                  className="w-full px-3.5 py-2 text-left text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2.5 cursor-pointer font-medium disabled:opacity-50"
                >
                  <i className="ri-add-circle-line text-sm text-[#253C7D] dark:text-sky-400" />
                  <span>Log Attendance</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLogsMenuOpen(false);
                    if (setActiveMainTab) setActiveMainTab("schedule-templates");
                  }}
                  className="w-full px-3.5 py-2 text-left text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2.5 cursor-pointer font-medium"
                >
                  <i className="ri-calendar-schedule-line text-sm text-[#253C7D] dark:text-sky-400" />
                  <span>Schedule Request</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLogsMenuOpen(false);
                    exportAttendanceRecordsXLSX(records, isFourPunchMode, shifts);
                  }}
                  className="w-full px-3.5 py-2 text-left text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2.5 cursor-pointer font-medium border-t border-gray-100 dark:border-slate-700 mt-1 pt-1.5"
                >
                  <i className="ri-file-excel-2-line text-sm text-emerald-600 dark:text-emerald-400" />
                  <span>Export to Excel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-200/70 dark:border-slate-800">
        {setActiveMainTab && (
          <AttendanceMainTabs
            activeMainTab={activeMainTab}
            setActiveMainTab={setActiveMainTab}
          />
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/reports?module=${activeTab === "summary" ? "attendance-summary" : "attendance"}${
              dateRangeBounds ? `&from=${dateRangeBounds.start}&to=${dateRangeBounds.end}` : "&from=&to="
            }`}
            title="Open the full Attendance Report in the Reports Center"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <i className="ri-file-chart-line text-[#253C7D] dark:text-sky-400 text-sm" />
            Full Report
          </Link>

          <AttendanceExportMenu
            activeTab={activeTab}
            records={records}
            summaries={summaries}
            isFourPunchMode={isFourPunchMode}
            shifts={shifts}
          />
        </div>
      </div>
    </div>
  );
});
