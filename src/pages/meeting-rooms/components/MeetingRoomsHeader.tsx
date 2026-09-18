import { memo } from "react";
import type { Booking, MeetingRoom } from "../types";
import { MeetingRoomsExportMenu } from "./MeetingRoomsExportMenu";

interface MeetingRoomsHeaderProps {
  viewMode: "timeline" | "month" | "cards";
  setViewMode: (mode: "timeline" | "month" | "cards") => void;
  bookings: Booking[];
  rooms: MeetingRoom[];
  selectedDate?: string;
  onOpenBookModal: () => void;
  onCreateRoom?: () => void;
  canManageRooms?: boolean;
}

export const MeetingRoomsHeader = memo(function MeetingRoomsHeader({
  viewMode,
  setViewMode,
  bookings,
  rooms,
  selectedDate,
  onOpenBookModal,
  onCreateRoom,
  canManageRooms,
}: MeetingRoomsHeaderProps) {
  return (
    <div className="w-full bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-5 transition-colors">
      {/* Left Title & Description */}
      <div className="space-y-1.5 max-w-3xl">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#253C7D]/10 dark:bg-sky-950/60 text-[#253C7D] dark:text-sky-300 border border-transparent dark:border-sky-800/40 tracking-wide uppercase">
            Facility Management
          </span>
          <span className="text-gray-300 dark:text-slate-600">&bull;</span>
          <span className="text-xs text-gray-500 dark:text-slate-400 font-semibold flex items-center gap-1">
            <i className="ri-building-4-line text-gray-400 dark:text-slate-500" />
            Floor 3 &amp; 5
          </span>
          <span className="text-gray-300 dark:text-slate-600">&bull;</span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
          Meeting Rooms Hub
        </h1>

        <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
          Reserve conference rooms across Floor 3 &amp; 5, track real-time occupancy, and coordinate equipment &amp; refreshments.
        </p>
      </div>

      {/* Right Controls Bar */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
        {/* Book Room Button */}
        <button
          onClick={onOpenBookModal}
          className="inline-flex items-center justify-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-98 whitespace-nowrap"
        >
          <i className="ri-calendar-check-line text-base" />
          <span>Book Meeting Room</span>
        </button>

        {/* Export Menu */}
        <MeetingRoomsExportMenu
          bookings={bookings}
          rooms={rooms}
          selectedDate={selectedDate}
        />

        {/* New Room Button — admins/approvers only */}
        {canManageRooms && onCreateRoom && (
          <button
            onClick={onCreateRoom}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-98 whitespace-nowrap"
          >
            <i className="ri-add-circle-line text-base" />
            <span>New Room</span>
          </button>
        )}

        {/* View Switcher */}
        <div className="flex items-center bg-gray-100/90 dark:bg-slate-800 p-1 rounded-xl border border-gray-200/70 dark:border-slate-700">
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === "timeline"
                ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-300 shadow-xs"
                : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <i className="ri-time-line text-sm" />
            <span>Day Timeline</span>
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === "month"
                ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-300 shadow-xs"
                : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <i className="ri-calendar-2-line text-sm" />
            <span>Month</span>
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === "cards"
                ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-300 shadow-xs"
                : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <i className="ri-layout-grid-line text-sm" />
            <span>Rooms</span>
          </button>
        </div>
      </div>
    </div>
  );
});
