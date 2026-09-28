import { useState, memo } from "react";
import { ScheduleMatrixRow } from "./ScheduleMatrixRow";
import type { EmployeeRosterRow, DayColumn, MatrixViewMode } from "./types";

interface ScheduleMatrixTableProps {
  loading: boolean;
  dayColumns: DayColumn[];
  scheduledEmployees: EmployeeRosterRow[];
  selectedIds: Set<string>;
  matrixViewMode?: MatrixViewMode;
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
  matrixViewMode = "roster",
  toggleSelectAll,
  toggleSelectOne,
  onCellClick,
  onCellHover,
}: ScheduleMatrixTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(scheduledEmployees.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedEmployees = scheduledEmployees.slice((safePage - 1) * pageSize, safePage * pageSize);

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
          <thead className="sticky top-0 z-20 bg-white shadow-xs">
            <tr>
              <th className="sticky left-0 z-30 bg-white w-[40px] min-w-[40px] max-w-[40px] px-2.5 py-2.5 text-center border-b border-r border-gray-200">
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === scheduledEmployees.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="sticky left-[40px] z-30 bg-white w-[48px] min-w-[48px] max-w-[48px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 border-b border-r border-gray-200">
                No.
              </th>
              <th className="sticky left-[88px] z-30 bg-white w-[200px] min-w-[200px] max-w-[200px] px-3.5 py-2.5 text-[11px] font-bold text-gray-700 border-b border-r border-gray-200">
                Employee
              </th>
              <th className="sticky left-[288px] z-30 bg-white w-[160px] min-w-[160px] max-w-[160px] px-3 py-2.5 text-[11px] font-bold text-gray-700 border-b border-r-2 border-gray-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)]">
                Designation
              </th>
              {matrixViewMode === "timesheet" && (
                <th className="sticky left-[448px] z-30 bg-white w-[26px] min-w-[26px] max-w-[26px] p-0 border-b border-r border-gray-200 text-center text-[8.5px] font-extrabold text-gray-400 font-mono select-none" title="S: Scheduled / C: Clocked / L: Deficit">
                  HRS
                </th>
              )}
              {dayColumns.map((col) => {
                const isToday = col.dateString === "2026-09-28";
                return (
                  <th
                    key={col.dayNumber}
                    className={`w-[66px] min-w-[66px] max-w-[66px] px-1 py-1.5 text-center border-b border-r border-gray-200 transition-colors ${
                      isToday
                        ? "bg-blue-50/90 text-blue-900 border-blue-200 font-bold"
                        : col.isHoliday
                        ? "bg-orange-50 text-orange-950 border-orange-200"
                        : col.isWeekend
                        ? "bg-slate-50 text-gray-700"
                        : "bg-white text-gray-700"
                    }`}
                    title={isToday ? `Today - ${col.dayName}, Day ${col.dayNumber}` : col.holidayName || `${col.dayName}, Day ${col.dayNumber}`}
                  >
                    <div className="font-extrabold text-[12px] leading-tight">{col.dayNumber}</div>
                    <div className={`text-[10px] font-semibold uppercase tracking-wider leading-tight mt-0.5 ${
                      isToday ? "text-blue-600 font-bold" : col.isHoliday ? "text-orange-700 font-bold" : col.isWeekend ? "text-slate-500" : "text-gray-400"
                    }`}>
                      {col.dayName}
                    </div>
                  </th>
                );
              })}
              {matrixViewMode === "timesheet" && (
                <>
                  <th className="w-[82px] min-w-[82px] px-1 py-1.5 text-center border-b border-r border-gray-200 text-[10.5px] font-bold text-gray-700 leading-tight">
                    Work Schedule(Hour)
                  </th>
                  <th className="w-[84px] min-w-[84px] px-1 py-1.5 text-center border-b border-r border-gray-200 text-[10.5px] font-bold text-gray-700 leading-tight">
                    On Duty Hour
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white">
            {scheduledEmployees.length === 0 ? (
              <tr>
                <td colSpan={4 + dayColumns.length + (matrixViewMode === "timesheet" ? 3 : 0)} className="text-center py-12 text-gray-400 border-b border-gray-100">
                  No employees match your search or filter.
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp, idx) => (
                <ScheduleMatrixRow
                  key={emp.id}
                  emp={emp}
                  index={(safePage - 1) * pageSize + idx}
                  isSelected={selectedIds.has(emp.id)}
                  dayColumns={dayColumns}
                  matrixViewMode={matrixViewMode}
                  onToggleSelect={toggleSelectOne}
                  onCellClick={onCellClick}
                  onCellHover={onCellHover}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {scheduledEmployees.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white text-xs select-none">
          <div className="flex items-center gap-1">
            <button type="button" disabled={safePage === 1} onClick={() => setCurrentPage(1)} className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">«</button>
            <button type="button" disabled={safePage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">‹</button>
            {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
              const pNum = i + 1;
              const isActive = pNum === safePage;
              return (
                <button key={pNum} type="button" onClick={() => setCurrentPage(pNum)} className={`w-7 h-7 flex items-center justify-center rounded text-xs font-semibold cursor-pointer ${isActive ? "bg-[#2563EB] text-white" : "border border-gray-200 text-gray-700 hover:bg-gray-50"}`}>{pNum}</button>
              );
            })}
            <button type="button" disabled={safePage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">›</button>
            <button type="button" disabled={safePage === totalPages} onClick={() => setCurrentPage(totalPages)} className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">»</button>
          </div>
          <div className="text-gray-400 text-[11px]">
            Showing {(safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, scheduledEmployees.length)} of {scheduledEmployees.length} employees
          </div>
        </div>
      )}
    </div>
  );
});
