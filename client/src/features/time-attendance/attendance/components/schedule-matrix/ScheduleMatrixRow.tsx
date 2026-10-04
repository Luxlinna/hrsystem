import { memo } from "react";
import { ScheduleMatrixCell } from "./ScheduleMatrixCell";
import { ScheduleMatrixTimeSheetCell } from "./ScheduleMatrixTimeSheetCell";
import { ScheduleMatrixMonthlyTotalsCell } from "./ScheduleMatrixMonthlyTotalsCell";
import type { EmployeeRosterRow, DayColumn, MatrixViewMode } from "./types";

interface ScheduleMatrixRowProps {
  emp: EmployeeRosterRow;
  index: number;
  isSelected: boolean;
  dayColumns: DayColumn[];
  matrixViewMode?: MatrixViewMode;
  onToggleSelect: (id: string) => void;
  onCellClick: (data: any) => void;
  onCellHover: (data: { empId: string; dateString: string; text: string; x: number; y: number } | null) => void;
}

function getRowBaseColor(_emp: EmployeeRosterRow, _index: number): string {
  return "bg-[#253C7D]";
}

export const ScheduleMatrixRow = memo(function ScheduleMatrixRow({
  emp,
  index,
  isSelected,
  dayColumns,
  matrixViewMode = "roster",
  onToggleSelect,
  onCellClick,
  onCellHover,
}: ScheduleMatrixRowProps) {
  const rowBg = isSelected ? "bg-blue-50/40" : "bg-white hover:bg-slate-50/70";
  const rowBaseColor = getRowBaseColor(emp, index);

  return (
    <tr className={`transition-colors ${rowBg}`}>
      {/* Checkbox */}
      <td className={`sticky left-0 z-10 ${rowBg} w-[40px] min-w-[40px] max-w-[40px] px-2.5 py-2 text-center border-b border-r border-gray-100`}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(emp.id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </td>

      {/* Sequence No. */}
      <td className={`sticky left-[40px] z-10 ${rowBg} w-[48px] min-w-[48px] max-w-[48px] px-2 py-2 text-center text-[11px] font-medium text-gray-500 border-b border-r border-gray-100 font-mono`}>
        {index + 1}
      </td>

      {/* Employee Avatar + Name + Code */}
      <td className={`sticky left-[88px] z-10 ${rowBg} w-[200px] min-w-[200px] max-w-[200px] px-3.5 py-2 border-b border-r border-gray-100`}>
        <div className="flex items-center gap-2.5">
          {emp.avatarUrl ? (
            <img
              src={emp.avatarUrl}
              alt={emp.name}
              className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-gray-200"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-slate-100 text-[#253C7D] font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-200">
              {emp.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-gray-900 truncate leading-tight">
              {emp.name}
            </p>
            {emp.displayId ? (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-[#253C7D]/10 text-[#253C7D] border border-[#253C7D]/20 shrink-0 mt-0.5 max-w-full"
                title={`Biometric ID: ${emp.displayId}`}
              >
                <i className="ri-fingerprint-line text-[10px]" />
                <span className="truncate">{emp.displayId}</span>
              </span>
            ) : (
              <p className="text-[10px] font-mono text-gray-400 leading-tight">
                {emp.employeeCode}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Designation */}
      <td className={`sticky left-[288px] z-10 ${rowBg} w-[160px] min-w-[160px] max-w-[160px] px-3 py-2 border-b border-r-2 border-gray-300 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)]`}>
        <p className="text-[11px] font-semibold text-gray-800 truncate leading-tight">
          {emp.role}
        </p>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider truncate leading-tight mt-0.5">
          {emp.department}
        </p>
      </td>

      {/* S C L Indicator for Time Sheet */}
      {matrixViewMode === "timesheet" && (
        <td className={`sticky left-[448px] z-10 ${rowBg} w-[26px] min-w-[26px] max-w-[26px] p-0.5 border-b border-r border-gray-200 text-center`}>
          <div className="flex flex-col h-[56px] justify-between items-center py-0 font-mono select-none">
            <span className="w-5 h-[18px] bg-[#253C7D] text-white font-extrabold text-[9px] flex items-center justify-center rounded-[2px] shadow-2xs">
              S
            </span>
            <span className="w-5 h-[18px] bg-white border border-[#253C7D]/50 text-[#253C7D] font-extrabold text-[9px] flex items-center justify-center rounded-[2px] shadow-2xs">
              C
            </span>
            <span className="w-5 h-[18px] bg-[#1E3064] text-white font-extrabold text-[9px] flex items-center justify-center rounded-[2px] shadow-2xs">
              L
            </span>
          </div>
        </td>
      )}

      {/* 31 Day Cells */}
      {dayColumns.map((col) => {
        if (matrixViewMode === "timesheet") {
          return (
            <ScheduleMatrixTimeSheetCell
              key={col.dayNumber}
              empId={emp.id}
              empName={emp.name}
              employeeCode={emp.displayId || emp.employeeCode}
              dateString={col.dateString}
              dayNumber={col.dayNumber}
              cellData={emp.dailySchedules[col.dateString]}
              isHoliday={col.isHoliday}
              isWeekend={col.isWeekend}
              rowBaseColor={rowBaseColor}
              onClick={onCellClick}
              onHover={onCellHover}
            />
          );
        }
        return (
          <ScheduleMatrixCell
            key={col.dayNumber}
            empId={emp.id}
            empName={emp.name}
            employeeCode={emp.displayId || emp.employeeCode}
            dateString={col.dateString}
            dayNumber={col.dayNumber}
            cellData={emp.dailySchedules[col.dateString]}
            isHoliday={col.isHoliday}
            isWeekend={col.isWeekend}
            onClick={onCellClick}
            onHover={onCellHover}
          />
        );
      })}

      {/* Monthly Sum Totals */}
      {matrixViewMode === "timesheet" && (
        <ScheduleMatrixMonthlyTotalsCell emp={emp} dayColumns={dayColumns} />
      )}
    </tr>
  );
});
