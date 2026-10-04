import { memo, useMemo } from "react";
import type { EmployeeRosterRow, DayColumn } from "./types";

interface Props {
  emp: EmployeeRosterRow;
  dayColumns: DayColumn[];
}

export const ScheduleMatrixMonthlyTotalsCell = memo(function ScheduleMatrixMonthlyTotalsCell({
  emp,
  dayColumns,
}: Props) {
  const totals = useMemo(() => {
    let workSched = 0;
    let onDutySched = 0;
    let clocked = 0;
    let lost = 0;

    dayColumns.forEach((col) => {
      const cell = emp.dailySchedules[col.dateString];
      if (!cell) return;
      const s = cell.scheduledHours ?? 0;
      workSched += s;
      if (!col.isHoliday) {
        onDutySched += s;
      }
      const c = cell.clockedHours ?? 0;
      clocked += c;
      const l = cell.lostHours ?? 0;
      lost += l;
    });

    const finalOnDuty = onDutySched > 0 ? onDutySched : workSched;

    return {
      workSched: workSched.toFixed(workSched % 1 === 0 ? 0 : 1),
      onDutySched: finalOnDuty.toFixed(finalOnDuty % 1 === 0 ? 0 : 1),
      clocked: clocked.toFixed(clocked % 1 === 0 ? 0 : 2),
      lost: lost.toFixed(lost % 1 === 0 ? 0 : 2),
    };
  }, [emp.dailySchedules, dayColumns]);

  return (
    <>
      {/* 1. Work Schedule (Hour) */}
      <td className="w-[82px] min-w-[82px] max-w-[82px] p-0.5 border-b border-r border-gray-100 font-mono select-none">
        <div className="w-full h-[56px] bg-[#253C7D] text-white font-extrabold text-xs flex items-center justify-center rounded-[3px] shadow-2xs">
          {totals.workSched}
        </div>
      </td>

      {/* 2. On Duty Hour (3 Tiers: S, C, L) */}
      <td className="w-[84px] min-w-[84px] max-w-[84px] p-0.5 border-b border-r border-gray-100 font-mono select-none">
        <div className="w-full rounded-[3px] overflow-hidden bg-[#253C7D] text-white shadow-2xs">
          <div className="h-[18px] flex items-center justify-center text-[10.5px] font-bold">
            {totals.onDutySched}
          </div>
          <div className="h-[18px] flex items-center justify-center text-[10.5px] font-semibold border-t border-b border-white/20 bg-white/10">
            {totals.clocked}
          </div>
          <div className="h-[18px] flex items-center justify-center text-[10.5px] font-bold">
            {totals.lost}
          </div>
        </div>
      </td>
    </>
  );
});
