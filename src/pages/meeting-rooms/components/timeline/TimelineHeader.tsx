import { memo } from "react";
import { TIMELINE_HOURS } from "../../constants";

export const TimelineHeader = memo(function TimelineHeader() {
  return (
    <div className="flex border-b border-gray-200 bg-gray-50/80 sticky top-0 z-10">
      <div className="w-56 sm:w-64 p-3 font-extrabold text-[11px] text-gray-500 uppercase tracking-wider border-r border-gray-200 shrink-0">
        Meeting Room Space
      </div>
      <div className="flex-1 grid grid-cols-12 min-w-[720px]">
        {TIMELINE_HOURS.slice(0, 12).map((h) => (
          <div
            key={h}
            className="p-2.5 text-center text-[11px] font-bold text-gray-500 border-r border-gray-100 last:border-r-0"
          >
            {h > 12 ? `${h - 12} PM` : h === 12 ? "12 PM" : `${h} AM`}
          </div>
        ))}
      </div>
    </div>
  );
});
