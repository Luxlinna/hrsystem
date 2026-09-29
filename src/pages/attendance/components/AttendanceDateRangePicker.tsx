import { memo, useState } from "react";
import type { DatePreset } from "../types";
import {
  computeDateRangeBounds,
  formatYMDToDMY,
  shiftDateBounds,
} from "../hooks/attendanceDateRangeUtils";
import { AttendanceDateRangeModal } from "./AttendanceDateRangeModal";

interface AttendanceDateRangePickerProps {
  filterDatePreset: DatePreset;
  setFilterDatePreset: (preset: DatePreset) => void;
  singleDate: string;
  setSingleDate: (date: string) => void;
  fromDate: string;
  setFromDate: (date: string) => void;
  toDate: string;
  setToDate: (date: string) => void;
  todayYMD?: string;
}

export const AttendanceDateRangePicker = memo(function AttendanceDateRangePicker({
  filterDatePreset,
  setFilterDatePreset,
  singleDate,
  setSingleDate,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  todayYMD = new Date().toISOString().split("T")[0],
}: AttendanceDateRangePickerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Compute active bounds for display and shifting
  const currentBounds = computeDateRangeBounds(
    filterDatePreset,
    todayYMD,
    singleDate,
    fromDate,
    toDate
  );

  const displayDateStr = `${formatYMDToDMY(currentBounds.start)} - ${formatYMDToDMY(
    currentBounds.end
  )}`;

  const handleShift = (direction: "prev" | "next") => {
    const nextBounds = shiftDateBounds(currentBounds, direction);
    setFilterDatePreset("custom_range");
    setFromDate(nextBounds.start);
    setToDate(nextBounds.end);
    setSingleDate(nextBounds.start);
  };

  const handleApply = (preset: DatePreset, from: string, to: string) => {
    setFilterDatePreset(preset);
    if (preset === "custom_range") {
      setFromDate(from);
      setToDate(to);
      setSingleDate(from);
    } else if (preset === "today") {
      setSingleDate(todayYMD);
      setFromDate(todayYMD);
      setToDate(todayYMD);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Segmented Pill Navigator */}
      <div className="flex items-center h-8 bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-full shadow-2xs overflow-hidden">
        {/* Left Arrow: Previous */}
        <button
          type="button"
          onClick={() => handleShift("prev")}
          title="Previous period"
          className="h-full px-2.5 flex items-center justify-center text-sky-500 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 border-r border-sky-400 dark:border-sky-500 transition-colors cursor-pointer"
        >
          <i className="ri-arrow-left-s-line text-sm" />
        </button>

        {/* Center: Calendar + Date Range Display (Opens Modal) */}
        <button
          type="button"
          onClick={() => setIsModalOpen((prev) => !prev)}
          className="h-full px-3.5 flex items-center gap-2 text-sky-500 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors cursor-pointer text-xs font-semibold select-none"
        >
          <i className="ri-calendar-line text-sm text-sky-500 dark:text-sky-400" />
          <span className="tabular-nums tracking-tight font-medium text-sky-600 dark:text-sky-300">
            {displayDateStr}
          </span>
        </button>

        {/* Right Arrow: Next */}
        <button
          type="button"
          onClick={() => handleShift("next")}
          title="Next period"
          className="h-full px-2.5 flex items-center justify-center text-sky-500 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 border-l border-sky-400 dark:border-sky-500 transition-colors cursor-pointer"
        >
          <i className="ri-arrow-right-s-line text-sm" />
        </button>
      </div>

      {/* Popover Date Range Modal */}
      <AttendanceDateRangeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preset={filterDatePreset}
        fromDate={fromDate || currentBounds.start}
        toDate={toDate || currentBounds.end}
        todayYMD={todayYMD}
        onApply={handleApply}
      />
    </div>
  );
});
