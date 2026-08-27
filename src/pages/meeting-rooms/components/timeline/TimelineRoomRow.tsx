import { memo } from "react";
import type { MeetingRoom, Booking } from "../../types";
import { FloorBadge } from "../FloorBadge";
import { fmtTime, timeToMinutes, getRoomFloor } from "../../roomUtils";
import { TIMELINE_HOURS } from "../../constants";

interface TimelineRoomRowProps {
  room: MeetingRoom;
  bookings: Booking[];
  onOpenBookModal: (room: MeetingRoom, startTime: string) => void;
  onSelectBooking: (b: Booking) => void;
}

export const TimelineRoomRow = memo(function TimelineRoomRow({
  room,
  bookings,
  onOpenBookModal,
  onSelectBooking,
}: TimelineRoomRowProps) {
  const roomFloor = getRoomFloor(room);
  const isVIP = roomFloor === 5;
  const startHour = 8;
  const totalMins = 12 * 60; // 8:00 to 20:00 = 720 mins

  return (
    <div className="flex border-b border-gray-100 hover:bg-slate-50/50 transition-colors group">
      {/* Left Room Info Column */}
      <div className="w-56 sm:w-64 p-3.5 border-r border-gray-200 shrink-0 bg-white group-hover:bg-slate-50/50 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">{room.name}</h4>
            <FloorBadge floor={roomFloor} size="sm" isVIP={isVIP} />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
            <span>
              <i className="ri-user-line" /> Max {room.capacity || "—"} ppl
            </span>
          </div>
        </div>

        <button
          onClick={() => onOpenBookModal(room, "14:00")}
          className="mt-2 text-[11px] font-extrabold text-[#253C7D] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <i className="ri-add-line" /> Quick Book
        </button>
      </div>

      {/* Right Grid Column with Bookings */}
      <div className="flex-1 relative min-w-[720px] h-20 bg-gray-50/30">
        {/* Background hour grid dividers */}
        <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
          {TIMELINE_HOURS.slice(0, 12).map((h) => (
            <div key={h} className="border-r border-gray-100 last:border-r-0 h-full" />
          ))}
        </div>

        {/* Clickable Time Slots */}
        <div className="absolute inset-0 grid grid-cols-12">
          {TIMELINE_HOURS.slice(0, 12).map((h) => {
            const timeStr = `${String(h).padStart(2, "0")}:00`;
            return (
              <div
                key={h}
                onClick={() => onOpenBookModal(room, timeStr)}
                className="h-full hover:bg-[#253C7D]/5 transition-colors cursor-pointer"
                title={`Click to book ${room.name} starting at ${timeStr}`}
              />
            );
          })}
        </div>

        {/* Positioned Booking Blocks */}
        {bookings.map((b) => {
          const sMin = timeToMinutes(b.start_time) - startHour * 60;
          const eMin = timeToMinutes(b.end_time) - startHour * 60;
          if (eMin <= 0 || sMin >= totalMins) return null;

          const clampedStart = Math.max(0, sMin);
          const clampedEnd = Math.min(totalMins, eMin);
          const leftPct = (clampedStart / totalMins) * 100;
          const widthPct = Math.max(2, ((clampedEnd - clampedStart) / totalMins) * 100);

          const isApproved = b.status === "approved";
          const isPending = b.status === "pending";

          return (
            <div
              key={b.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectBooking(b);
              }}
              style={{
                left: `${leftPct}%`,
                width: `${widthPct}%`,
              }}
              className={`absolute top-2 bottom-2 rounded-xl p-2 z-10 transition-all cursor-pointer shadow-2xs border flex flex-col justify-between overflow-hidden ${
                isApproved
                  ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                  : isPending
                  ? "bg-amber-500 text-white border-amber-600 hover:bg-amber-600"
                  : "bg-slate-500 text-white border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between gap-1 leading-none">
                <span className="font-extrabold text-[11px] truncate">{b.title}</span>
                <span className="text-[9px] font-black uppercase opacity-90 shrink-0">
                  {isPending ? "Pending" : "Booked"}
                </span>
              </div>
              <p className="text-[10px] opacity-90 truncate leading-none">
                {b.employees?.first_name} &middot; {fmtTime(b.start_time)}–{fmtTime(b.end_time)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
});
