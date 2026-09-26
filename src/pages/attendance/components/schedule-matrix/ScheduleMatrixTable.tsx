import { memo } from "react";
import { ScheduleMatrixRow } from "./ScheduleMatrixRow";
import type { EmployeeRosterRow, DayColumn } from "./types";

interface ScheduleMatrixTableProps {
  loading: boolean;
  dayColumns: DayColumn[];
  scheduledEmployees: EmployeeRosterRow[];
  selectedIds: Set<string>;
  toggleSelectAll: () => void;
  toggleSelectOne: (id: string) => void;
  onCellClick: (data: any) => void;
  onCellHover: (data: { empId: string; dateString: string; text: string; x: number; y: number } | null) => void;
}

export const ScheduleMatrixTable = memo(function ScheduleMatrixTable({
  loading,
  dayColumns,
  scheduledEmployees,
  selectedIds,
  toggleSelectAll,
  toggleSelectOne,
  onCellClick,
  onCellHover,
}: ScheduleMatrixTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden relative">
      {loading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-30">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
            <i className="ri-loader-4-line animate-spin text-base" />
            Loading schedule matrix...
          </div>
        </div>
      )}

      <div className="overflow-x-auto max-h-[72vh] relative select-none">
        <table className="border-separate border-spacing-0 text-left text-xs min-w-full">
          {/* Sticky Table Header */}
          <thead className="sticky top-0 z-20 bg-white shadow-xs">
            <tr>
              {/* Checkbox */}
              <th className="sticky left-0 z-30 bg-white w-[40px] min-w-[40px] max-w-[40px] px-2.5 py-2.5 text-center border-b border-r border-gray-200">
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === scheduledEmployees.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>

              {/* No. */}
              <th className="sticky left-[40px] z-30 bg-white w-[48px] min-w-[48px] max-w-[48px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 border-b border-r border-gray-200">
                No.
              </th>

              {/* Employee */}
              <th className="sticky left-[88px] z-30 bg-white w-[200px] min-w-[200px] max-w-[200px] px-3.5 py-2.5 text-[11px] font-bold text-gray-700 border-b border-r border-gray-200">
                Employee
              </th>

              {/* Designation */}
              <th className="sticky left-[288px] z-30 bg-white w-[160px] min-w-[160px] max-w-[160px] px-3 py-2.5 text-[11px] font-bold text-gray-700 border-b border-r-2 border-gray-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)]">
                Designation
              </th>

              {/* Day Columns */}
              {dayColumns.map((col) => {
                const isHoliday = col.isHoliday;
                return (
                  <th
                    key={col.dayNumber}
                    className={`w-[66px] min-w-[66px] max-w-[66px] px-1 py-1.5 text-center border-b border-r border-gray-200 transition-colors ${
                      isHoliday
                        ? "bg-orange-50 text-orange-950 border-orange-200"
                        : col.isWeekend
                        ? "bg-slate-50 text-gray-700"
                        : "bg-white text-gray-700"
                    }`}
                    title={col.holidayName || `${col.dayName}, Day ${col.dayNumber}`}
                  >
                    <div className="font-extrabold text-[12px] leading-tight">{col.dayNumber}</div>
                    <div
                      className={`text-[10px] font-semibold uppercase tracking-wider leading-tight mt-0.5 ${
                        isHoliday ? "text-orange-700 font-bold" : col.isWeekend ? "text-slate-500" : "text-gray-400"
                      }`}
                    >
                      {col.dayName}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="bg-white">
            {scheduledEmployees.length === 0 ? (
              <tr>
                <td colSpan={4 + dayColumns.length} className="text-center py-12 text-gray-400 border-b border-gray-100">
                  No employees match your search or filter.
                </td>
              </tr>
            ) : (
              scheduledEmployees.map((emp, idx) => (
                <ScheduleMatrixRow
                  key={emp.id}
                  emp={emp}
                  index={idx}
                  isSelected={selectedIds.has(emp.id)}
                  dayColumns={dayColumns}
                  onToggleSelect={toggleSelectOne}
                  onCellClick={onCellClick}
                  onCellHover={onCellHover}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
