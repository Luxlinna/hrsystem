import { memo } from "react";
import type { WorkLocation } from "../../types";

interface TimeLogInfoSectionProps {
  date: string; setDate: (date: string) => void;
  hour: string; setHour: (hour: string) => void;
  minute: string; setMinute: (minute: string) => void;
  period: "AM" | "PM"; setPeriod: (period: "AM" | "PM") => void;
  logType: "in" | "out"; setLogType: (type: "in" | "out") => void;
  remark: string; setRemark: (remark: string) => void;
  handleHourBlur: () => void; handleMinuteBlur: () => void;
  workStartTime?: string; setWorkStartTime?: (v: string) => void;
  graceMinutes?: number; statusMode?: "auto" | "ontime" | "late";
  setStatusMode?: (m: "auto" | "ontime" | "late") => void;
  liveEvaluation?: {
    isLate: boolean; calcLateMin: number;
    effectiveStatus: "ontime" | "late"; effectiveLateMinutes: number;
  };
  existingRecord?: any | null;
  employeeBranchName?: string | null;
  sites?: WorkLocation[];
  logSiteId?: string;
  setLogSiteId?: (id: string) => void;
  refreshingSites?: boolean;
  handleRefreshSites?: () => void;
}

function formatGraceTime(start: string = "09:00", grace: number = 15): string {
  const [h, m] = start.split(":").map(Number);
  const total = (isNaN(h) ? 9 : h) * 60 + (isNaN(m) ? 0 : m) + grace;
  const gh = Math.floor(total / 60) % 24, gm = total % 60;
  return `${gh % 12 || 12}:${String(gm).padStart(2, "0")} ${gh >= 12 ? "PM" : "AM"}`;
}

function formatClock12(time24?: string | null): string {
  if (!time24) return "";
  const [h, m] = time24.slice(0, 5).split(":").map(Number);
  if (isNaN(h)) return time24;
  return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export const TimeLogInfoSection = memo(function TimeLogInfoSection({
  date, setDate, hour, setHour, minute, setMinute, period, setPeriod,
  logType, setLogType, remark, setRemark, handleHourBlur, handleMinuteBlur,
  workStartTime = "09:00", setWorkStartTime, graceMinutes = 15,
  statusMode = "auto", setStatusMode, liveEvaluation, existingRecord,
  employeeBranchName, sites = [], logSiteId = "", setLogSiteId,
  refreshingSites = false, handleRefreshSites,
}: TimeLogInfoSectionProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-slate-800 shadow-2xs space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-800">
        <span className="w-6 h-6 rounded-lg bg-[#253C7D]/10 text-[#253C7D] dark:text-sky-400 flex items-center justify-center text-xs">
          <i className="ri-time-line font-bold" />
        </span>
        <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">
          Time Log Info
        </h3>
      </div>

      <div className="space-y-4.5">
        {/* Existing Record Indicator */}
        {existingRecord && (
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#253C7D] dark:text-sky-300">
                <i className="ri-information-fill text-sm" />
                <span>Existing Attendance Record Found for {date}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#253C7D] dark:text-sky-300">
                {existingRecord.clock_out ? "Punch Complete" : "Clocked In (Still Working)"}
              </span>
            </div>
            <div className="text-[11px] text-gray-600 dark:text-slate-300 flex items-center gap-3 flex-wrap">
              {existingRecord.clock_in && (
                <span><strong>Check In:</strong> {formatClock12(existingRecord.clock_in)} ({existingRecord.status === "ontime" ? "On Time" : "Late"})</span>
              )}
              {existingRecord.clock_out && (
                <span><strong>Check Out:</strong> {formatClock12(existingRecord.clock_out)}</span>
              )}
              {existingRecord.notes && (
                <span><strong>Note:</strong> {existingRecord.notes}</span>
              )}
            </div>
          </div>
        )}

        {/* Row 1: Date & Work Site */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer transition-all shadow-2xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">
                Work Site
              </label>
              {handleRefreshSites && (
                <button
                  type="button"
                  onClick={handleRefreshSites}
                  disabled={refreshingSites}
                  className="text-[11px] text-gray-400 hover:text-[#253C7D] dark:hover:text-sky-400 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Reload sites from server"
                >
                  <i className={`ri-refresh-line text-xs ${refreshingSites ? "animate-spin text-[#253C7D]" : ""}`} />
                  <span>Refresh</span>
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={logSiteId}
                onChange={(e) => setLogSiteId?.(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer appearance-none transition-all pr-8 shadow-2xs"
              >
                <option value="">Main Office {employeeBranchName ? `(${employeeBranchName})` : ""}</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.is_default ? "(Default Site)" : ""}
                  </option>
                ))}
              </select>
              <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Row 2: Time & Punch Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
              Punch Time <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-2 py-1 shadow-2xs">
                <input
                  type="text"
                  maxLength={2}
                  value={hour}
                  onChange={(e) => setHour(e.target.value.replace(/\D/g, ""))}
                  onBlur={handleHourBlur}
                  className="w-10 py-1 text-center font-mono text-sm font-black text-gray-900 dark:text-slate-100 bg-transparent focus:outline-none"
                  title="Hours (01 - 12)"
                />
                <span className="text-gray-400 font-bold px-0.5">:</span>
                <input
                  type="text"
                  maxLength={2}
                  value={minute}
                  onChange={(e) => setMinute(e.target.value.replace(/\D/g, ""))}
                  onBlur={handleMinuteBlur}
                  className="w-10 py-1 text-center font-mono text-sm font-black text-gray-900 dark:text-slate-100 bg-transparent focus:outline-none"
                  title="Minutes (00 - 59)"
                />
              </div>

              <div className="inline-flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setPeriod("AM")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    period === "AM"
                      ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-400 shadow-2xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod("PM")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    period === "PM"
                      ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-400 shadow-2xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
              Punch Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLogType("in")}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  logType === "in"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                    : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <i className="ri-login-circle-line text-sm text-emerald-500" /> Time In (Check In)
              </button>
              <button
                type="button"
                onClick={() => setLogType("out")}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  logType === "out"
                    ? "bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 shadow-2xs"
                    : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <i className="ri-logout-circle-r-line text-sm text-sky-500" /> Time Out (Check Out)
              </button>
            </div>
          </div>
        </div>

        {/* Schedule & Late Arrival Manager Controls */}
        {logType === "in" && liveEvaluation && (
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
              Work &amp; Late Status
            </label>
            <div className="w-full bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-slate-400 font-semibold">Start:</span>
                  <input
                    type="time"
                    value={workStartTime}
                    onChange={(e) => setWorkStartTime?.(e.target.value)}
                    className="px-2 py-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg font-bold text-gray-900 dark:text-slate-100 text-xs focus:outline-none"
                    title="Configured shift start time"
                  />
                  <span className="text-[11px] text-gray-400">
                    ({graceMinutes}m grace · on-time until {formatGraceTime(workStartTime, graceMinutes)})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-gray-200 dark:border-slate-700 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Evaluation:</span>
                  {liveEvaluation.effectiveStatus === "ontime" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> On Time
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      <i className="ri-time-line text-xs" /> Late Arrival ({liveEvaluation.effectiveLateMinutes}m)
                    </span>
                  )}
                </div>

                <div className="inline-flex bg-gray-200 dark:bg-slate-700 p-0.5 rounded-xl text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setStatusMode?.("auto")}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      statusMode === "auto"
                        ? "bg-white dark:bg-slate-800 text-[#253C7D] dark:text-sky-400 shadow-2xs"
                        : "text-gray-500"
                    }`}
                  >
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusMode?.("ontime")}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      statusMode === "ontime"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-gray-500"
                    }`}
                  >
                    On Time
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusMode?.("late")}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      statusMode === "late"
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "text-gray-500"
                    }`}
                  >
                    Late
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Remark */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
            Remark
          </label>
          <textarea
            rows={3}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Enter optional notes, reason, or remark..."
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] transition-all resize-y shadow-2xs"
          />
        </div>
      </div>
    </div>
  );
});
