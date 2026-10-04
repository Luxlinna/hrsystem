import { memo } from "react";
import { TIMELINE_HOURS } from "../../constants";

export const TimelineHeader = memo(function TimelineHeader() {
  return (
    <div className="flex border-b border-gray-200 bg-slate-50/90 sticky top-0 z-20 backdrop-blur-xs">
      <div className="w-60 sm:w-72 p-3.5 font-bold text-[11px] text-gray-500 uppercase tracking-wider border-r border-gray-200 shrink-0 flex items-center">
        <i className="ri-building-2-line mr-1.5 text-sm text-[#253C7D]" />
        <span>Meeting Room Space</span>
      </div>
      <div className="flex-1 grid grid-cols-12 min-w-[960px]">
        {TIMELINE_HOURS.slice(0, 12).map((h) => (
          <div
            key={h}
            className="p-3 text-center text-xs font-semibold text-gray-600 border-r border-gray-200/70 last:border-r-0 flex items-center justify-center"
          >
            {h > 12 ? `${h - 12} PM` : h === 12 ? "12 PM" : `${h} AM`}
          </div>
        ))}
      </div>
    </div>
  );
});
