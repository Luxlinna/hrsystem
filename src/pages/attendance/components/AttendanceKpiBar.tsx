import { memo } from "react";
import type { DatePreset } from "../types";

interface AttendanceKpiBarProps {
  filterDatePreset: DatePreset;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  presentCount: number;
  workingNow: number;
  lateCount: number;
  remoteCount: number;
  absentCount: number;
}

export const AttendanceKpiBar = memo(function AttendanceKpiBar({
  filterDatePreset,
  filterStatus,
  setFilterStatus,
  presentCount,
  workingNow,
  lateCount,
  remoteCount,
  absentCount,
}: AttendanceKpiBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
      {/* On Time */}
      <div
        onClick={() => setFilterStatus(filterStatus === "ontime" ? "all" : "ontime")}
        className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          filterStatus === "ontime" || filterStatus === "present" ? "border-emerald-500 ring-2 ring-emerald-500/15" : "border-gray-200/80 dark:border-slate-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            {filterDatePreset === "today" ? "On Time Today" : "On Time (Period)"}
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <i className="ri-user-follow-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-2">{presentCount}</p>
        <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-0.5">Logs in selected scope</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
      </div>

      {/* Working Now */}
      <div
        className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-4 transition-all shadow-2xs relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Working Now</span>
          <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <i className="ri-macbook-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-sky-700 dark:text-sky-300 mt-2">{workingNow}</p>
        <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-0.5">Active shifts today</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500" />
      </div>

      {/* Late Arrivals */}
      <div
        onClick={() => setFilterStatus(filterStatus === "late" ? "all" : "late")}
        className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          filterStatus === "late" ? "border-amber-500 ring-2 ring-amber-500/15" : "border-gray-200/80 dark:border-slate-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Late Arrivals</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <i className="ri-alarm-warning-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-2">{lateCount}</p>
        <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-0.5">Tardiness records</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
      </div>

      {/* Remote / WFH */}
      <div
        onClick={() => setFilterStatus(filterStatus === "remote" ? "all" : "remote")}
        className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          filterStatus === "remote" ? "border-indigo-500 ring-2 ring-indigo-500/15" : "border-gray-200/80 dark:border-slate-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Remote / WFH</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <i className="ri-home-office-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-2">{remoteCount}</p>
        <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-0.5">Off-site entries</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />
      </div>

      {/* Absent */}
      <div
        onClick={() => setFilterStatus(filterStatus === "absent" ? "all" : "absent")}
        className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          filterStatus === "absent" ? "border-rose-500 ring-2 ring-rose-500/15" : "border-gray-200/80 dark:border-slate-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Absent Logs</span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <i className="ri-user-unfollow-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-2">{absentCount}</p>
        <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-0.5">Recorded absences</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
      </div>
    </div>
  );
});
