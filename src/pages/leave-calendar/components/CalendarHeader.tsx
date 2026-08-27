import { memo } from "react";

interface CalendarHeaderProps {
  viewMode: "month" | "timeline" | "agenda";
  setViewMode: (mode: "month" | "timeline" | "agenda") => void;
  onExportCSV: () => void;
  onOpenQuickRequest: () => void;
}

export const CalendarHeader = memo(function CalendarHeader({
  viewMode,
  setViewMode,
  onExportCSV,
  onOpenQuickRequest,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-2xs">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#253C7D]/10 text-[#253C7D] tracking-wider uppercase">
            Schedule & Availability
          </span>
          <span className="text-gray-300">&bull;</span>
          <span className="text-xs text-gray-505 font-medium flex items-center gap-1">
            <i className="ri-time-line text-gray-400" />
            Live Sync
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          Leave Schedule Calendar
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
          Visual team availability, department coverage tracking, and real-time absence planning.
        </p>
      </div>

      {/* Responsive Actions & Switcher Container */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full lg:w-auto shrink-0">
        {/* Call to Actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenQuickRequest}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-extrabold transition-all shadow-xs hover:shadow-sm cursor-pointer active:scale-98"
          >
            <i className="ri-add-circle-line text-base" />
            <span>Request Leave</span>
          </button>

          <button
            onClick={onExportCSV}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-extrabold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <i className="ri-download-2-line text-sm text-gray-500" />
            <span>Export Schedule</span>
          </button>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => setViewMode("month")}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === "month"
                ? "bg-white text-[#253C7D] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <i className="ri-calendar-2-line" />
            <span>Month</span>
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === "timeline"
                ? "bg-white text-[#253C7D] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <i className="ri-bar-chart-horizontal-line" />
            <span>Timeline</span>
          </button>
          <button
            onClick={() => setViewMode("agenda")}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === "agenda"
                ? "bg-white text-[#253C7D] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <i className="ri-list-check" />
            <span>Agenda</span>
          </button>
        </div>
      </div>
    </div>
  );
});
