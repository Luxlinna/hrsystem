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
    <div className="w-full bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors">
      {/* Left Title & Description */}
      <div className="space-y-1 max-w-2xl">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          <span>Facilities</span>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-[#253C7D] dark:text-sky-400">Meeting Rooms</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Meeting Rooms
        </h1>

        <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Manage conference rooms, track reservation schedules, and coordinate workspace facilities.
        </p>
      </div>

      {/* Right Controls Bar */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
        {/* Book Room Primary Action */}
        <button
          onClick={onOpenBookModal}
          className="inline-flex items-center justify-center gap-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-98 whitespace-nowrap"
        >
          <i className="ri-calendar-check-line text-sm" />
          <span>Book Meeting Room</span>
        </button>

        {/* New Room Secondary Button — admins/approvers only */}
        {canManageRooms && onCreateRoom && (
          <button
            onClick={onCreateRoom}
            className="inline-flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-98 whitespace-nowrap"
          >
            <i className="ri-add-line text-sm text-slate-500 dark:text-slate-400" />
            <span>New Room</span>
          </button>
        )}

        {/* Export Menu */}
        <MeetingRoomsExportMenu
          bookings={bookings}
          rooms={rooms}
          selectedDate={selectedDate}
        />

        {/* View Switcher Segmented Control */}
        <div className="flex items-center bg-slate-100/90 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700">
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === "timeline"
                ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-300 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <i className="ri-time-line text-xs" />
            <span>Day Timeline</span>
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === "month"
                ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-300 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <i className="ri-calendar-2-line text-xs" />
            <span>Month</span>
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === "cards"
                ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-300 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <i className="ri-layout-grid-line text-xs" />
            <span>Rooms</span>
          </button>
        </div>
      </div>
    </div>
  );
});
