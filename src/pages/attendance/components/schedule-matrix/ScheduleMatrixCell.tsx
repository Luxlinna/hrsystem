import { memo } from "react";
import { getShiftPillStyle, getStatusUnderlineColor } from "./shiftCodeStyles";
import type { CellScheduleData } from "./types";

interface ScheduleMatrixCellProps {
  empId: string;
  empName: string;
  employeeCode: string;
  dateString: string;
  dayNumber: number;
  cellData?: CellScheduleData;
  isHoliday: boolean;
  isWeekend: boolean;
  onClick: (data: {
    empId: string;
    empName: string;
    employeeCode: string;
    dateString: string;
    dayNumber: number;
    code: string;
    currentCode?: string;
    status?: string;
    clockIn?: string | null;
    clockOut?: string | null;
    x: number;
    y: number;
  }) => void;
  onHover: (data: { empId: string; dateString: string; text: string; x: number; y: number } | null) => void;
}

export const ScheduleMatrixCell = memo(function ScheduleMatrixCell({
  empId,
  empName,
  employeeCode,
  dateString,
  dayNumber,
  cellData,
  isHoliday,
  isWeekend,
  onClick,
  onHover,
}: ScheduleMatrixCellProps) {
  const code = cellData?.shiftCode || "OFF";
  const pillStyle = getShiftPillStyle(code, isHoliday);
  const underlineColor = getStatusUnderlineColor(cellData?.status || "future");

  const handleClick = (clientX: number, clientY: number) => {
    onClick({
      empId,
      empName,
      employeeCode,
      dateString,
      dayNumber,
      code,
      currentCode: code || "OFF",
      status: cellData?.status,
      clockIn: cellData?.clockIn,
      clockOut: cellData?.clockOut,
      x: clientX,
      y: clientY,
    });
  };

  return (
    <td
      onClick={(e) => handleClick(e.clientX, e.clientY)}
      onContextMenu={(e) => {
        e.preventDefault();
        handleClick(e.clientX, e.clientY);
      }}
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onHover({
          empId,
          dateString,
          text: cellData?.tooltipText || code,
          x: rect.left + rect.width / 2,
          y: rect.top,
        });
      }}
      onMouseLeave={() => onHover(null)}
      className={`w-[66px] min-w-[66px] max-w-[66px] p-1 text-center border-b border-r border-gray-100 relative group cursor-pointer transition-all ${
        isHoliday ? "bg-orange-50/20" : isWeekend ? "bg-slate-50/50" : ""
      } hover:ring-2 hover:ring-blue-400 hover:z-10`}
    >
      <div className="flex flex-col items-center justify-center py-0.5">
        <span
          className={`w-full max-w-[60px] py-1 px-1 rounded text-[10px] font-bold tracking-tight text-center leading-none select-none shadow-2xs truncate block ${pillStyle.bg} ${pillStyle.text}`}
        >
          {code}
        </span>
        <div className={`w-6 h-[2px] rounded-full mt-1 transition-opacity ${underlineColor}`} />
      </div>
    </td>
  );
});
