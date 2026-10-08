import { memo } from "react";
import type { AttendanceRecord } from "../types";
import { STATUS_CONFIG, formatTime, calcHours } from "../constants";
import { formatBiometricId } from "@/lib/biometricUtils";
import type { Holiday } from "@/services/holidays/holidaysService";
import { getAttendanceEmployeeName, getAttendanceEmployeeInitials } from "../utils/employeeNameUtils";

interface AttendanceCardItemProps {
  record: AttendanceRecord;
  holiday?: Holiday;
  todayYMD: string;
  canManage: boolean;
  isFourPunchMode?: boolean;
  onSelectRecord: (record: AttendanceRecord) => void;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: number) => void;
  onLogTimeForEmployee?: (employeeId: string) => void;
}

function isWithin24Hours(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  return diffMs >= -86400000 && diffMs <= 86400000;
}

export const AttendanceCardItem = memo(function AttendanceCardItem({
  record: r,
  holiday,
  todayYMD,
  canManage,
  isFourPunchMode = false,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
  onLogTimeForEmployee,
}: AttendanceCardItemProps) {
  let cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.ontime || STATUS_CONFIG.present;
  let badgeLabel = cfg.label;
  if (r.status === "holiday" || (!r.clock_in && holiday)) {
    cfg = STATUS_CONFIG.holiday;
    badgeLabel = holiday ? `Holiday · ${holiday.name}` : "Holiday / Off";
  } else if (r.clock_in && holiday) {
    cfg = STATUS_CONFIG.holiday;
    badgeLabel = "Holiday Work (2.0x OT)";
  }
  const emp = r.employees;
  const isWorkingNow = r.clock_in && !r.clock_out && r.date === todayYMD;
  const isCardFourPunch = isFourPunchMode && Boolean(r.work_location?.is_four_punch_enabled ?? true);
  const isDeletableToday = canManage && r.id > 0 && isWithin24Hours(r.date);

  return (
    <div
      onClick={() => onSelectRecord(r)}
      className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-gray-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
              {emp?.avatar_url ? <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" /> : <span>{getAttendanceEmployeeInitials(emp)}</span>}
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-gray-900 dark:text-slate-100 group-hover:text-[#253C7D] dark:group-hover:text-sky-400 transition-colors text-sm truncate">
                {emp ? getAttendanceEmployeeName(emp) : "—"}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-gray-400 dark:text-slate-400 font-medium truncate max-w-[120px]">
                  {emp?.role || "Team Member"}
                </span>
                {(() => {
                  const rawBio = emp?.biometric_user_id || emp?.employee_code;
                  const bName = Array.isArray(emp?.branches) ? emp.branches[0]?.name : (emp?.branches?.name || "");
                  const bioId = formatBiometricId(rawBio, bName);
                  if (!bioId) return null;
                  return (
                    <>
                      <span className="text-gray-300 dark:text-slate-600 text-[10px]">·</span>
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#253C7D]/10 text-[#253C7D] dark:bg-sky-950 dark:text-sky-300 border border-[#253C7D]/20 shrink-0"
                        title={`Biometric ID: ${bioId}`}
                      >
                        <i className="ri-fingerprint-line text-[10px]" />
                        {bioId}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text} border ${cfg.border} shrink-0`}>
            <i className={cfg.icon} />
            {badgeLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-slate-50/70 dark:bg-slate-800/60 p-3 rounded-2xl border border-gray-100 dark:border-slate-800 mb-3 text-center">
          <div>
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider block">Check In</span>
            <p className="font-extrabold text-gray-800 dark:text-slate-200 text-xs mt-0.5">{formatTime(r.clock_in)}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider block">Check Out</span>
            <p className="font-extrabold text-gray-800 dark:text-slate-200 text-xs mt-0.5">
              {isWorkingNow ? <span className="text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />Working</span> : formatTime(r.clock_out)}
            </p>
          </div>
        </div>

        <div className="mb-2.5 flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-gray-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">
              {emp?.department || "General"}
            </span>
            {emp?.branches?.name && (
              <span className="text-gray-400 dark:text-slate-500 text-[10px] font-medium truncate max-w-[120px]" title={emp.branches.name}>
                {emp.branches.name}
              </span>
            )}
          </div>
          <span className={`font-bold text-[10px] shrink-0 ${r.work_location_id !== emp?.default_work_location_id && emp?.default_work_location_id ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 px-1.5 py-0.5 rounded" : "text-gray-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-100 dark:border-slate-700"}`}>
            <i className="ri-building-line text-[9px] mr-1" />
            {r.work_location?.name || "Main Office"}
          </span>
        </div>

        {r.notes && (
          <div className="text-xs bg-gray-50/70 dark:bg-slate-800/50 p-2 rounded-xl border border-gray-100/80 dark:border-slate-800 mb-2 truncate" title={r.notes}>
            {r.notes.startsWith("[Time Log]") ? (
              <span className="inline-flex items-center gap-1.5 text-[11px]">
                <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-sky-300 font-bold text-[9px] border border-blue-200/60 dark:border-blue-800/60 uppercase shrink-0">
                  Time Log
                </span>
                <span className="truncate text-gray-600 dark:text-slate-400">
                  {r.notes.replace(/^\[Time Log\]\s*/, "")}
                </span>
              </span>
            ) : (
              <span className="text-gray-500 dark:text-slate-400 italic">"{r.notes}"</span>
            )}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <span className="font-black text-[#253C7D] dark:text-sky-400">
            {r.hours_worked && r.hours_worked > 0 ? `${r.hours_worked}h` : calcHours(r.clock_in, r.clock_out)}
          </span>
          <span className="text-[11px] text-gray-400 dark:text-slate-500">
            {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>

        {canManage && (
          <div className="flex items-center gap-1">
            {onLogTimeForEmployee && (
              <button
                type="button"
                onClick={() => onLogTimeForEmployee(r.employee_id)}
                className="w-7 h-7 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/40 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
                title={`Create Time Log for ${emp ? getAttendanceEmployeeName(emp) : "this employee"}`}
              ><i className="ri-time-line text-xs" /></button>
            )}
            <button
              type="button"
              onClick={() => onEditRecord(r)}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-[#253C7D] dark:hover:text-sky-400 transition-colors cursor-pointer"
            ><i className="ri-edit-line text-xs" /></button>
            {isDeletableToday && (
              <button
                type="button"
                onClick={() => onDeleteRecord(r.id)}
                className="w-7 h-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                title="Delete today's record to allow employee to check in/out again"
              ><i className="ri-delete-bin-line text-xs" /></button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
