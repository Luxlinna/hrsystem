import { memo } from "react";
import type { CellScheduleData } from "./types";

interface Props {
  empId: string;
  empName: string;
  employeeCode: string;
  dateString: string;
  dayNumber: number;
  cellData?: CellScheduleData;
  isHoliday: boolean;
  isWeekend: boolean;
  rowBaseColor: string; // e.g. bg-[#C2410C]
  onClick: (data: any) => void;
  onHover: (data: any) => void;
}

export const ScheduleMatrixTimeSheetCell = memo(function ScheduleMatrixTimeSheetCell({
  empId,
  empName,
  employeeCode,
  dateString,
  dayNumber,
  cellData,
  isHoliday,
  rowBaseColor,
  onClick,
  onHover,
}: Props) {
  const isOff = Boolean(cellData?.isOff || cellData?.shiftCode?.includes("OFF"));
  const leaveCode = cellData?.leaveCode;
  const isLeave = Boolean(leaveCode);

  let cellBg = rowBaseColor;
  if (isOff) {
    cellBg = "bg-[#1E293B]";
  } else if (isLeave) {
    if (leaveCode?.startsWith("AL")) cellBg = "bg-[#7C3AED]";
    else if (leaveCode?.startsWith("SST") || leaveCode?.startsWith("VST")) cellBg = "bg-[#D97706]";
    else cellBg = "bg-[#6D28D9]";
  } else if (isHoliday) {
    cellBg = "bg-[#C2410C]";
  }

  const sText = isOff
    ? "OFF"
    : isLeave
    ? leaveCode
    : cellData?.scheduledHours != null
    ? String(cellData.scheduledHours)
    : "8";

  const cHours = cellData?.clockedHours;
  const cText = cHours != null ? (cHours > 0 ? cHours.toFixed(cHours % 1 === 0 ? 0 : 2) : "0") : (isOff ? "0" : "—");

  const lHours = cellData?.lostHours;
  const hasLost = lHours != null && lHours > 0;
  const lText = lHours != null ? (hasLost ? lHours.toFixed(lHours % 1 === 0 ? 0 : 2) : "0") : (isOff ? "0" : "—");

  const handleClick = (clientX: number, clientY: number) => {
    onClick({
      empId,
      empName,
      employeeCode,
      dateString,
      dayNumber,
      code: cellData?.shiftCode || "OFF",
      currentCode: cellData?.shiftCode || "OFF",
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
          text: cellData?.tooltipText || sText,
          x: rect.left + rect.width / 2,
          y: rect.top,
        });
      }}
      onMouseLeave={() => onHover(null)}
      className={`w-[66px] min-w-[66px] max-w-[66px] p-0.5 border-b border-r border-gray-100 cursor-pointer select-none transition-all hover:ring-2 hover:ring-blue-400 hover:z-10`}
    >
      <div className={`w-full rounded-[3px] overflow-hidden ${cellBg} text-white shadow-2xs font-mono`}>
        {/* Tier S: Scheduled */}
        <div className="h-[18px] flex items-center justify-center px-1 text-[10px] font-bold tracking-tight relative">
          {!isOff && !isLeave && (
            <span className="absolute left-1 w-[2.5px] h-2.5 bg-sky-300 rounded-full" />
          )}
          <span className="truncate">{sText}</span>
        </div>

        {/* Tier C: Clocked / Actual */}
        <div className="h-[18px] flex items-center justify-center px-1 text-[10px] font-semibold border-t border-b border-white/20 bg-white/5">
          <span>{cText}</span>
        </div>

        {/* Tier L: Lost / Late Deficit */}
        <div
          className={`h-[18px] flex items-center justify-center px-1 text-[10px] font-bold ${
            hasLost ? "bg-[#1E3064] text-white border-t border-white/10" : "text-white/80"
          }`}
        >
          <span>{lText}</span>
        </div>
      </div>
    </td>
  );
});
