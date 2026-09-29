import { memo } from "react";
import type { AttendanceRecord, Employee } from "../types";
import { formatBiometricId } from "@/lib/biometricUtils";

interface Props {
  record: AttendanceRecord;
  employee?: Employee;
  onSelectRecord: (r: AttendanceRecord) => void;
}

function initials(first?: string, last?: string) {
  return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase() || "?";
}

export const AttendanceRowEmployeeCell = memo(function AttendanceRowEmployeeCell({
  record: r,
  employee: emp,
  onSelectRecord,
}: Props) {
  const rawBio = emp?.biometric_user_id || emp?.employee_code;
  const bName = Array.isArray(emp?.branches)
    ? emp.branches[0]?.name
    : emp?.branches?.name || r.work_location?.name || "";
  const bioId = formatBiometricId(rawBio, bName);

  return (
    <td className="py-3 px-4 whitespace-nowrap">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
          {emp?.avatar_url ? (
            <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{initials(emp?.first_name, emp?.last_name)}</span>
          )}
        </div>
        <div className="min-w-0 flex flex-col justify-center">
          <button
            type="button"
            onClick={() => onSelectRecord(r)}
            className="font-bold text-gray-900 dark:text-slate-100 hover:text-[#253C7D] dark:hover:text-sky-400 text-left text-xs leading-snug cursor-pointer truncate max-w-[200px] block hover:underline"
          >
            {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
          </button>
          {bioId ? (
            <div className="mt-0.5">
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700/80 shrink-0"
                title={`Biometric ID: ${bioId}`}
              >
                <i className="ri-fingerprint-line text-[10.5px] text-[#253C7D] dark:text-sky-400" />
                <span>{bioId}</span>
              </span>
            </div>
          ) : (
            <p className="text-[10px] font-mono text-gray-400 dark:text-slate-500 mt-0.5">—</p>
          )}
        </div>
      </div>
    </td>
  );
});
