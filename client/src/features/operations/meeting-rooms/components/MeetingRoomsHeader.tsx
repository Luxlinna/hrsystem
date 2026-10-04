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
    <div className="w-full bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4 transition-colors">
      {/* Left Title */}
      <div className="space-y-1 max-w-2xl">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          <span>Facilities</span>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-[#253C7D] dark:text-sky-400 font-extrabold">Meeting Rooms</span>
        </div>

        <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Meeting Rooms
        </h1>

        <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed hidden sm:block">
          Manage conference rooms, track reservation schedules, and coordinate workspace facilities.
        </p>
      </div>

      {/* Right Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
        {/* Actions Row */}
        <div className="flex items-center gap-2 flex-1 sm:flex-none">
          <button
            onClick={onOpenBookModal}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] dark:bg-sky-600 dark:hover:bg-sky-500 text-white px-4 py-2.5 sm:py-2 rounded-2xl sm:rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <i className="ri-calendar-check-line text-sm" />
            <span>Book Meeting Room</span>
          </button>

          {canManageRooms && onCreateRoom && (
            <button
              onClick={onCreateRoom}
              className="inline-flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-2.5 sm:py-2 rounded-2xl sm:rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <i className="ri-add-line text-sm" />
              <span className="hidden sm:inline">New Room</span>
            </button>
          )}

          <MeetingRoomsExportMenu
            bookings={bookings}
            rooms={rooms}
            selectedDate={selectedDate}
          />
        </div>

        {/* View Switcher Segmented Control */}
        <div className="grid grid-cols-3 sm:flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl sm:rounded-xl border border-slate-200/70 dark:border-slate-700/80 w-full sm:w-auto">
          {[
            { id: "timeline", label: "Day Timeline", icon: "ri-time-line" },
            { id: "month", label: "Month", icon: "ri-calendar-2-line" },
            { id: "cards", label: "Rooms", icon: "ri-layout-grid-line" },
          ].map((v) => {
            const isActive = viewMode === v.id || (v.id === "cards" && viewMode === "cards");
            return (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id as any)}
                className={`px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-98 ${
                  isActive
                    ? "bg-[#253C7D] dark:bg-sky-500 text-white dark:text-slate-950 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <i className={`${v.icon} text-xs`} />
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
