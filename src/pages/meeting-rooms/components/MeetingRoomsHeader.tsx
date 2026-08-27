import { memo } from "react";

interface MeetingRoomsHeaderProps {
  viewMode: "timeline" | "month" | "cards";
  setViewMode: (mode: "timeline" | "month" | "cards") => void;
  onOpenBookModal: () => void;
}

export const MeetingRoomsHeader = memo(function MeetingRoomsHeader({
  viewMode,
  setViewMode,
  onOpenBookModal,
}: MeetingRoomsHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-2xs">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#253C7D]/10 text-[#253C7D] tracking-wide uppercase">
            Facility Management
          </span>
          <span className="text-gray-300">&bull;</span>
          <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <i className="ri-building-4-line text-gray-400" />
            Floor 3 & 5
          </span>
          <span className="text-gray-300">&bull;</span>
          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          Meeting Rooms Hub
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
          Reserve conference rooms across Floor 3 & 5, track real-time occupancy, and coordinate equipment & refreshments.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Book Room Action Button */}
        <button
          onClick={onOpenBookModal}
          className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-98"
        >
          <i className="ri-calendar-check-line text-base font-bold" />
          Book Meeting Room
        </button>

        {/* View Switcher */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60">
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "timeline"
                ? "bg-white text-[#253C7D] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <i className="ri-time-line" />
            <span className="hidden sm:inline">Day Timeline</span>
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "month"
                ? "bg-white text-[#253C7D] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <i className="ri-calendar-2-line" />
            <span className="hidden sm:inline">Month</span>
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "cards"
                ? "bg-white text-[#253C7D] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <i className="ri-layout-grid-line" />
            <span className="hidden sm:inline">Rooms</span>
          </button>
        </div>
      </div>
    </div>
  );
});
