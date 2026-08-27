import { memo } from "react";
import { MONTHS } from "../../constants";

interface MonthNavigatorProps {
  month: number;
  year: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToToday: () => void;
}

export const MonthNavigator = memo(function MonthNavigator({
  month,
  year,
  onPrevMonth,
  onNextMonth,
  onJumpToToday,
}: MonthNavigatorProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900">
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={onJumpToToday}
          className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
        >
          Today
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onPrevMonth}
          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
          title="Previous Month"
        >
          <i className="ri-arrow-left-s-line text-base" />
        </button>
        <button
          onClick={onNextMonth}
          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
          title="Next Month"
        >
          <i className="ri-arrow-right-s-line text-base" />
        </button>
      </div>
    </div>
  );
});
