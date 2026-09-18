import { memo } from "react";
import type { AttendanceRecord } from "../types";
import { calcHours, initials } from "../constants";
import { formatBiometricId } from "@/lib/biometricUtils";
import type { Holiday } from "@/services/holidays/holidaysService";
import { getAttendanceLiveStatus } from "./attendanceStatusHelper";
import { AttendancePunchCells } from "./AttendancePunchCells";

interface AttendanceTableRowProps {
  record: AttendanceRecord;
  todayYMD: string;
  canManage: boolean;
  isFourPunchMode: boolean;
  holidayMap: Map<string, Holiday>;
  onSelectRecord: (record: AttendanceRecord) => void;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: number) => void;
  onLogTimeForEmployee?: (employeeId: string) => void;
}

export const AttendanceTableRow = memo(function AttendanceTableRow({
  record: r,
  todayYMD,
  canManage,
  isFourPunchMode,
  holidayMap,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
  onLogTimeForEmployee,
}: AttendanceTableRowProps) {
  const emp = r.employees;
  const { statusLabel, statusBg, statusText, statusBorder, statusIcon, isPulse } =
    getAttendanceLiveStatus(r, todayYMD, isFourPunchMode, holidayMap);

  return (
    <tr
      onClick={() => onSelectRecord(r)}
      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
    >
      {/* Employee */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
            {emp?.avatar_url ? (
              <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{initials(emp?.first_name, emp?.last_name)}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-bold text-gray-900 dark:text-slate-100 group-hover:text-[#253C7D] dark:group-hover:text-sky-400 transition-colors">
                {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
              </p>
              {emp?.biometric_user_id ? (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#253C7D]/10 text-[#253C7D] dark:bg-sky-950 dark:text-sky-300 border border-[#253C7D]/20 shrink-0"
                  title={`BU Biometric ID: ${emp.biometric_user_id}`}
                >
                  <i className="ri-fingerprint-line text-[10px]" />
                  {formatBiometricId(emp.biometric_user_id, emp.branches?.name)}
                </span>
              ) : emp?.employee_code ? (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300 shrink-0">
                  {emp.employee_code}
                </span>
              ) : null}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-0.5">{emp?.role || "Team Member"}</p>
          </div>
        </div>
      </td>

      {/* Department & Site */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="font-semibold text-gray-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-[11px]">
          {emp?.department || "General"}
        </span>
        {emp?.branches?.name && <span className="text-gray-400 dark:text-slate-500 block text-[10px] mt-0.5">{emp.branches.name}</span>}
        {r.work_location?.name ? (
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 px-1.5 py-0.5 rounded-md shadow-2xs">
              <i className="ri-map-pin-2-fill text-[9px] text-emerald-500 dark:text-emerald-400" />
              <span>{r.work_location.name}</span>
              {r.work_location_id !== emp?.default_work_location_id && emp?.default_work_location_id && (
                <span className="ml-0.5 px-1 py-px bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded text-[8px] font-extrabold uppercase">
                  Visiting
                </span>
              )}
            </span>
          </div>
        ) : (
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 px-1.5 py-0.5 rounded-md shadow-2xs">
              <i className="ri-building-line text-[9px] text-slate-400" />
              <span>Main Office</span>
            </span>
          </div>
        )}
      </td>

      {/* Date */}
      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900 dark:text-slate-100">
        {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </td>

      {/* Punches */}
      <AttendancePunchCells record={r} isFourPunchMode={isFourPunchMode} />

      {/* Total Hours */}
      <td className="px-4 py-3.5 text-center whitespace-nowrap font-extrabold text-[#253C7D] dark:text-sky-400">
        {r.hours_worked && r.hours_worked > 0 ? (
          <span className="inline-block px-2 py-0.5 bg-[#253C7D]/5 dark:bg-sky-950/40 rounded-lg border border-[#253C7D]/10 dark:border-sky-800/50">
            {r.hours_worked}h
          </span>
        ) : r.clock_in && r.clock_out ? (
          calcHours(r.clock_in, r.clock_out)
        ) : (
          <span className="text-gray-300 dark:text-slate-600 font-extrabold text-sm select-none">—</span>
        )}
      </td>

      {/* Status Badge */}
      <td className="px-4 py-3.5 text-center whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${statusBg} ${statusText} border ${statusBorder} shadow-2xs`}>
          {isPulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
          <i className={statusIcon} />
          {statusLabel}
        </span>
      </td>

      {/* Notes */}
      <td className="px-4 py-3.5 text-gray-500 dark:text-slate-400 max-w-[160px] truncate">{r.notes || "—"}</td>

      {/* Actions */}
      <td className="px-4 py-3.5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          {canManage && (
            <>
              {onLogTimeForEmployee && (
                <button
                  type="button"
                  onClick={() => onLogTimeForEmployee(r.employee_id)}
                  className="w-7 h-7 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/40 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
                  title={`Create Time Log for ${emp ? `${emp.first_name} ${emp.last_name}` : "this employee"}`}
                >
                  <i className="ri-time-line text-sm" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onEditRecord(r)}
                className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-[#253C7D] dark:hover:text-sky-400 transition-colors cursor-pointer"
                title="Edit"
              >
                <i className="ri-edit-line text-sm" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteRecord(r.id)}
                className="w-7 h-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                title="Delete"
              >
                <i className="ri-delete-bin-line text-sm" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => onSelectRecord(r)}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="View Details"
          >
            <i className="ri-arrow-right-s-line text-base" />
          </button>
        </div>
      </td>
    </tr>
  );
});
