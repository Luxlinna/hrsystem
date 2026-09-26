import { useState, useRef, useEffect, memo } from "react";
import type { AttendanceRecord } from "../types";
import { formatTime, initials } from "../constants";
import type { Holiday } from "@/services/holidays/holidaysService";
import type { ManagedShift } from "./shifts-manager/types";

interface AttendanceTableRowProps {
  record: AttendanceRecord;
  index: number;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
  todayYMD: string;
  canManage: boolean;
  isFourPunchMode?: boolean;
  holidayMap?: Map<string, Holiday>;
  shifts?: ManagedShift[];
  onSelectRecord: (record: AttendanceRecord) => void;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: number) => void;
  onLogTimeForEmployee?: (employeeId: string) => void;
}

function formatDMY(dateStr: string): { dmy: string; day: string } {
  if (!dateStr) return { dmy: "—", day: "—" };
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return { dmy: dateStr, day: "—" };
  const day = d.toLocaleDateString("en-US", { weekday: "short" });
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return { dmy: `${dd}/${mm}/${yyyy}`, day };
}

export const AttendanceTableRow = memo(function AttendanceTableRow({
  record: r,
  index,
  isSelected = false,
  onToggleSelect,
  todayYMD,
  canManage,
  isFourPunchMode = false,
  holidayMap,
  shifts = [],
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
  onLogTimeForEmployee,
}: AttendanceTableRowProps) {
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setActionMenuOpen(false);
      }
    }
    if (actionMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [actionMenuOpen]);

  const emp = r.employees;
  const { dmy, day } = formatDMY(r.date);

  // Derive schedule information matching the screenshot
  const matchedShift = shifts.find((s) => {
    if ((r as any).shift_id && s.id === (r as any).shift_id) return true;
    if ((emp as any)?.shift_id && s.id === (emp as any).shift_id) return true;
    return false;
  });

  const shiftCode = matchedShift?.code || "0812";
  const shiftTitle = matchedShift
    ? `${matchedShift.code} - ${matchedShift.name}`
    : `${shiftCode} - 08:00AM - 12:00PM`;

  const windows = matchedShift?.time_table && matchedShift.time_table.length > 0
    ? matchedShift.time_table
    : [
        {
          id: "1",
          time_in: "08:00 AM",
          time_out: "12:00 PM",
          total_work_hours: 4.0,
        },
      ];

  const totalShiftHours = matchedShift?.total_work_hours || 4.0;

  // Derive punch display
  const hasClockIn = Boolean(r.clock_in);
  const hasClockOut = Boolean(r.clock_out);

  // Multi-punch sessions if 4 punch enabled or split shift
  const isMultiSession = isFourPunchMode || windows.length > 1;

  // Status & Error derivation
  const isFuture = r.date > todayYMD;
  const isHoliday = holidayMap?.has(r.date);

  let statusBadge: { label: string; bg: string; text: string } | null = null;

  if (isHoliday) {
    statusBadge = { label: "Holiday", bg: "bg-blue-600", text: "text-white" };
  } else if (!hasClockIn && !hasClockOut) {
    statusBadge = {
      label: "Error : No clock in and clock out",
      bg: "bg-rose-500",
      text: "text-white",
    };
  } else if (!hasClockIn) {
    statusBadge = {
      label: "Error : No clock in",
      bg: "bg-rose-500",
      text: "text-white",
    };
  } else if (!hasClockOut && r.date < todayYMD) {
    statusBadge = {
      label: "Error : No clock out",
      bg: "bg-rose-500",
      text: "text-white",
    };
  } else if (!hasClockOut && r.date === todayYMD) {
    statusBadge = {
      label: "Working Now",
      bg: "bg-emerald-600",
      text: "text-white",
    };
  } else if (r.status === "late" || (r.late_minutes && r.late_minutes > 0)) {
    statusBadge = {
      label: `Late ${r.late_minutes}m`,
      bg: "bg-amber-500",
      text: "text-white",
    };
  } else {
    statusBadge = {
      label: "On Time",
      bg: "bg-emerald-600",
      text: "text-white",
    };
  }

  // Branch code / site tag
  const branchTag = (r.work_location?.name || emp?.branches?.name || "HBHQ")
    .split(/[\s\-()]+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "HBHQ";

  return (
    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-100 dark:border-slate-800/80 text-xs">
      {/* 1. Checkbox */}
      <td className="py-3 px-3.5 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect && onToggleSelect(r.id)}
          className="w-4 h-4 rounded border-gray-300 dark:border-slate-700 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
        />
      </td>

      {/* 2. No. */}
      <td className="py-3 px-3 text-left font-bold text-gray-400 dark:text-slate-500">
        {index + 1}
      </td>

      {/* 3. Date */}
      <td className="py-3 px-4 whitespace-nowrap">
        <p className="font-semibold text-gray-800 dark:text-slate-200">{dmy}</p>
        <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-md">
          {day}
        </span>
      </td>

      {/* 4. Employee */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
            {emp?.avatar_url ? (
              <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{initials(emp?.first_name, emp?.last_name)}</span>
            )}
          </div>
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => onSelectRecord(r)}
              className="font-bold text-gray-900 dark:text-slate-100 hover:text-[#253C7D] dark:hover:text-sky-400 text-left cursor-pointer"
            >
              {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
            </button>
            <p className="text-[11px] font-mono text-gray-400 dark:text-slate-500">
              {emp?.employee_code || (emp as any)?.biometric_user_id || "—"}
            </p>
          </div>
        </div>
      </td>

      {/* 5. Designation */}
      <td className="py-3 px-4 whitespace-nowrap">
        <span className="text-gray-700 dark:text-slate-300 font-medium">
          {emp?.role || "Staff Member"}
        </span>
      </td>

      {/* 6. Department */}
      <td className="py-3 px-4 whitespace-nowrap">
        <p className="font-bold text-gray-800 dark:text-slate-200 uppercase tracking-tight text-[11px]">
          {emp?.department || "OPERATIONS"}
        </p>
        <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 tracking-wider">
          {branchTag}
        </span>
      </td>

      {/* 7. Schedules */}
      <td className="py-3 px-4 whitespace-nowrap">
        <p className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
          {shiftTitle}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {windows.map((w, i) => (
            <span
              key={w.id || i}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300"
            >
              {w.time_in} - {w.time_out}
            </span>
          ))}
          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-pink-200/90 dark:bg-pink-900/60 text-pink-900 dark:text-pink-200">
            {Number(totalShiftHours).toFixed(2)} Hours
          </span>
        </div>
      </td>

      {/* 8. Clock In-Out */}
      <td className="py-3 px-4 whitespace-nowrap">
        {isMultiSession && (r.break_out || r.break_in) ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300 text-[11px]">
              <span>
                {r.clock_in ? formatTime(r.clock_in) : "N/A"} -{" "}
                {r.break_out ? formatTime(r.break_out) : "N/A"}
              </span>
              <button
                type="button"
                onClick={() => onEditRecord(r)}
                className="text-gray-400 hover:text-[#253C7D] dark:hover:text-sky-400 cursor-pointer"
                title="Edit Punch"
              >
                <i className="ri-edit-line text-xs" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300 text-[11px]">
              <span>
                {r.break_in ? formatTime(r.break_in) : "N/A"} -{" "}
                {r.clock_out ? formatTime(r.clock_out) : "N/A"}
              </span>
              <button
                type="button"
                onClick={() => onEditRecord(r)}
                className="text-gray-400 hover:text-[#253C7D] dark:hover:text-sky-400 cursor-pointer"
                title="Edit Punch"
              >
                <i className="ri-edit-line text-xs" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300 text-[11px]">
            <span>
              {hasClockIn ? formatTime(r.clock_in) : "N/A"} -{" "}
              {hasClockOut ? formatTime(r.clock_out) : "N/A"}
            </span>
            <button
              type="button"
              onClick={() => onEditRecord(r)}
              className="text-gray-400 hover:text-[#253C7D] dark:hover:text-sky-400 cursor-pointer"
              title="Edit Punch"
            >
              <i className="ri-edit-line text-xs" />
            </button>
          </div>
        )}
      </td>

      {/* 9. Status / Error */}
      <td className="py-3 px-4 whitespace-nowrap">
        {statusBadge && (
          <span
            className={`px-2.5 py-1 rounded text-[11px] font-bold inline-block shadow-2xs ${statusBadge.bg} ${statusBadge.text}`}
          >
            {statusBadge.label}
          </span>
        )}
      </td>

      {/* 10. Actions Dropdown */}
      <td className="py-3 px-3 w-16 text-center relative whitespace-nowrap">
        <div ref={actionMenuRef} className="inline-block text-left">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActionMenuOpen((p) => !p);
            }}
            className="inline-flex items-center justify-center gap-1 w-8 h-7 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-2xs transition-colors cursor-pointer"
            title="Options"
          >
            <i className="ri-settings-3-line text-xs text-[#253C7D] dark:text-sky-400" />
            <i className="ri-arrow-down-s-line text-[10px] text-gray-400" />
          </button>

          {actionMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 rounded-xl shadow-lg py-1 z-30 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActionMenuOpen(false);
                  onEditRecord(r);
                }}
                className="w-full px-3 py-1.5 text-left text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-edit-line text-[#253C7D] dark:text-sky-400" />
                <span>Edit Log</span>
              </button>

              {onLogTimeForEmployee && emp?.id && (
                <button
                  type="button"
                  onClick={() => {
                    setActionMenuOpen(false);
                    onLogTimeForEmployee(emp.id);
                  }}
                  className="w-full px-3 py-1.5 text-left text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <i className="ri-time-line text-[#253C7D] dark:text-sky-400" />
                  <span>Log Time</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setActionMenuOpen(false);
                  onSelectRecord(r);
                }}
                className="w-full px-3 py-1.5 text-left text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-file-list-3-line text-[#253C7D] dark:text-sky-400" />
                <span>View Details</span>
              </button>

              {canManage && (
                <>
                  <div className="border-t border-gray-100 dark:border-slate-700 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setActionMenuOpen(false);
                      onDeleteRecord(r.id);
                    }}
                    className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                  >
                    <i className="ri-delete-bin-line" />
                    <span>Delete Record</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});
