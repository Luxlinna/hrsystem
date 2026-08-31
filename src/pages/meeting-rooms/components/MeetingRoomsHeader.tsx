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
    <div className="w-full bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-5">
      {/* Left Title & Description */}
      <div className="space-y-1.5 max-w-3xl">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#253C7D]/10 text-[#253C7D] tracking-wide uppercase">
            Facility Management
          </span>
          <span className="text-gray-300">&bull;</span>
          <span className="text-xs text-gray-500 font-semibold flex items-center gap-1">
            <i className="ri-building-4-line text-gray-400" />
            Floor 3 &amp; 5
          </span>
          <span className="text-gray-300">&bull;</span>
          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Meeting Rooms Hub
        </h1>

        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
          Reserve conference rooms across Floor 3 &amp; 5, track real-time occupancy, and coordinate equipment &amp; refreshments.
        </p>
      </div>

      {/* Right Controls Bar */}
      <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
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
        <div className="flex items-center bg-gray-100/90 p-1 rounded-xl border border-gray-200/70">
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === "timeline"
                ? "bg-white text-[#253C7D] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <i className="ri-time-line text-sm" />
            <span>Day Timeline</span>
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === "month"
                ? "bg-white text-[#253C7D] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <i className="ri-calendar-2-line text-sm" />
            <span>Month</span>
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === "cards"
                ? "bg-white text-[#253C7D] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
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
