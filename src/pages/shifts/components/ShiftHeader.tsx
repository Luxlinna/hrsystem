import { memo } from "react";
import { Link } from "react-router-dom";
import type { Shift, ShiftAssignment } from "../types";
import { formatDate } from "../utils";
import { ShiftExportMenu } from "./ShiftExportMenu";

interface ShiftHeaderProps {
  kpiTotalShiftsThisWeek: number;
  kpiTotalWeeklyHours: number;
  kpiCoveragePercentage: number;
  weekDates: Date[];
  weekShiftsCount: number;
  filteredShifts: Shift[];
  assignments: ShiftAssignment[];
  currentDate: Date;
  onOpenWorkload: () => void;
  onOpenCopyWeek: () => void;
  onOpenCreate: () => void;
}

export const ShiftHeader = memo(function ShiftHeader({
  kpiTotalShiftsThisWeek,
  kpiTotalWeeklyHours,
  kpiCoveragePercentage,
  weekDates,
  weekShiftsCount,
  filteredShifts,
  assignments,
  currentDate,
  onOpenWorkload,
  onOpenCopyWeek,
  onOpenCreate,
}: ShiftHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
          Shift Scheduling
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">
          {kpiTotalShiftsThisWeek} shifts this week &middot; {kpiTotalWeeklyHours} total scheduled hours &middot; {kpiCoveragePercentage}% staffing coverage
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          to={`/reports?module=shifts&from=${formatDate(weekDates[0])}&to=${formatDate(weekDates[6])}`}
          title="Open detailed Shift Scheduling Report in Reports Center"
          className="inline-flex items-center gap-1.5 border border-blue-200 bg-blue-50/80 text-blue-800 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
        >
          <i className="ri-file-chart-line text-xs text-blue-700" />
          <span>Shift Reports</span>
        </Link>

        <button
          onClick={onOpenWorkload}
          title="View weekly staff workload & hours allocation"
          className="inline-flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
        >
          <i className="ri-user-star-line text-xs text-[#253C7D]" />
          <span>Workload</span>
        </button>

        <button
          onClick={onOpenCopyWeek}
          title="Duplicate entire weekly schedule to next week in 1 click"
          className="inline-flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
        >
          <i className="ri-file-copy-2-line text-xs text-[#253C7D]" />
          <span>Copy Week ({weekShiftsCount})</span>
        </button>

        <ShiftExportMenu
          filteredShifts={filteredShifts}
          assignments={assignments}
          currentDate={currentDate}
        />

        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-1.5 bg-[#253C7D] text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#1F336A] transition-colors whitespace-nowrap cursor-pointer shadow-xs active:scale-98"
        >
          <i className="ri-add-line font-bold text-sm" />
          <span>Create Shift</span>
        </button>
      </div>
    </div>
  );
});
