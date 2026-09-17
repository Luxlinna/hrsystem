import { memo } from "react";

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
}

function formatGraceTime(start: string = "09:00", grace: number = 15): string {
  const [h, m] = start.split(":").map(Number);
  const total = (isNaN(h) ? 9 : h) * 60 + (isNaN(m) ? 0 : m) + grace;
  const gh = Math.floor(total / 60) % 24, gm = total % 60;
  return `${gh % 12 || 12}:${String(gm).padStart(2, "0")} ${gh >= 12 ? "PM" : "AM"}`;
}

export const TimeLogInfoSection = memo(function TimeLogInfoSection({
  date, setDate, hour, setHour, minute, setMinute, period, setPeriod,
  logType, setLogType, remark, setRemark, handleHourBlur, handleMinuteBlur,
  workStartTime = "09:00", setWorkStartTime, graceMinutes = 15,
  statusMode = "auto", setStatusMode, liveEvaluation,
}: TimeLogInfoSectionProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-2xs space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-800">
        <span className="w-6 h-6 rounded-lg bg-[#253C7D]/10 text-[#253C7D] dark:text-sky-400 flex items-center justify-center text-xs">
          <i className="ri-time-line font-bold" />
        </span>
        <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">
          Time Log Info
        </h3>
      </div>

      <div className="space-y-4">
        {/* Date * */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
          <label className="sm:w-36 text-xs font-bold text-gray-600 dark:text-slate-300 sm:text-right shrink-0">
            Date <span className="text-rose-500">*</span>
          </label>
          <div className="w-full sm:max-w-md">
            <input
              type="date" required value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer transition-all"
            />
          </div>
        </div>

        {/* Time & Punch Type (Split digital clock + In/Out buttons) */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
          <label className="sm:w-36 text-xs font-bold text-gray-600 dark:text-slate-300 sm:text-right shrink-0 pt-2">
            Time &amp; Type <span className="text-rose-500">*</span>
          </label>
          <div className="w-full sm:max-w-md space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-2 py-1 shadow-2xs">
                <input
                  type="text" maxLength={2} value={hour} onChange={(e) => setHour(e.target.value.replace(/\D/g, ""))}
                  onBlur={handleHourBlur} className="w-10 py-1 text-center font-mono text-sm font-black text-gray-900 dark:text-slate-100 bg-transparent focus:outline-none"
                  title="Hours (01 - 12)"
                />
                <span className="text-gray-400 font-bold px-0.5">:</span>
                <input
                  type="text" maxLength={2} value={minute} onChange={(e) => setMinute(e.target.value.replace(/\D/g, ""))}
                  onBlur={handleMinuteBlur} className="w-10 py-1 text-center font-mono text-sm font-black text-gray-900 dark:text-slate-100 bg-transparent focus:outline-none"
                  title="Minutes (00 - 59)"
                />
              </div>

              <div className="inline-flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
                <button
                  type="button" onClick={() => setPeriod("AM")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${period === "AM" ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-400 shadow-2xs" : "text-gray-500 hover:text-gray-800"}`}
                >AM</button>
                <button
                  type="button" onClick={() => setPeriod("PM")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${period === "PM" ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-400 shadow-2xs" : "text-gray-500 hover:text-gray-800"}`}
                >PM</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button" onClick={() => setLogType("in")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${logType === "in" ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-2xs" : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 hover:bg-gray-50"}`}
              >
                <i className="ri-login-circle-line text-sm text-emerald-500" /> Time In (Check In)
              </button>
              <button
                type="button" onClick={() => setLogType("out")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${logType === "out" ? "bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 shadow-2xs" : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 hover:bg-gray-50"}`}
              >
                <i className="ri-logout-circle-r-line text-sm text-sky-500" /> Time Out (Check Out)
              </button>
            </div>
          </div>
        </div>

        {/* Schedule & Late Arrival Manager Controls */}
        {logType === "in" && liveEvaluation && (
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 pt-1">
            <label className="sm:w-36 text-xs font-bold text-gray-600 dark:text-slate-300 sm:text-right shrink-0 pt-2">
              Work &amp; Late Status
            </label>
            <div className="w-full sm:max-w-md bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 font-semibold">Start:</span>
                  <input
                    type="time" value={workStartTime} onChange={(e) => setWorkStartTime?.(e.target.value)}
                    className="px-2 py-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg font-bold text-gray-900 dark:text-slate-100 text-xs focus:outline-none"
                    title="Configured shift start time"
                  />
                  <span className="text-[11px] text-gray-400">({graceMinutes}m grace · ontime until {formatGraceTime(workStartTime, graceMinutes)})</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200 dark:border-slate-700 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Status:</span>
                  {liveEvaluation.effectiveStatus === "ontime" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> On Time
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      <i className="ri-time-line text-xs" /> Late Arrival ({liveEvaluation.effectiveLateMinutes}m)
                    </span>
                  )}
                </div>

                <div className="inline-flex bg-gray-200 dark:bg-slate-700 p-0.5 rounded-xl text-[10px] font-bold">
                  <button
                    type="button" onClick={() => setStatusMode?.("auto")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${statusMode === "auto" ? "bg-white dark:bg-slate-800 text-[#253C7D] dark:text-sky-400 shadow-2xs" : "text-gray-500"}`}
                  >Auto</button>
                  <button
                    type="button" onClick={() => setStatusMode?.("ontime")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${statusMode === "ontime" ? "bg-emerald-600 text-white shadow-2xs" : "text-gray-500"}`}
                  >On Time</button>
                  <button
                    type="button" onClick={() => setStatusMode?.("late")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${statusMode === "late" ? "bg-amber-600 text-white shadow-2xs" : "text-gray-500"}`}
                  >Late</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Remark */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 pt-1">
          <label className="sm:w-36 text-xs font-bold text-gray-600 dark:text-slate-300 sm:text-right shrink-0 pt-2">
            Remark
          </label>
          <div className="w-full sm:max-w-md">
            <textarea
              rows={3} value={remark} onChange={(e) => setRemark(e.target.value)}
              placeholder="Enter optional notes, reason, or remark..."
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] transition-all resize-y"
            />
          </div>
        </div>
      </div>
    </div>
  );
});
