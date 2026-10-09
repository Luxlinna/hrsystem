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
  onSelectRoomDetails?: (room: MeetingRoom) => void;
}

export const TimelineRoomRow = memo(function TimelineRoomRow({
  room,
  bookings,
  onOpenBookModal,
  onSelectBooking,
  onSelectRoomDetails,
}: TimelineRoomRowProps) {
  const roomFloor = getRoomFloor(room);
  const isVIP = roomFloor === 5;
  const startHour = 8;
  const totalMins = 12 * 60; // 8:00 to 20:00 = 720 mins

  return (
    <div className="flex border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors group">
      {/* Left Room Info Column */}
      <div className="w-60 sm:w-72 p-4 border-r border-slate-200/80 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/70 dark:group-hover:bg-slate-800/60 flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <button
              type="button"
              onClick={() => onSelectRoomDetails?.(room)}
              className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-[#253C7D] dark:hover:text-sky-300 text-left truncate transition-colors cursor-pointer"
              title="Click to view room details"
            >
              {room.name}
            </button>
            <FloorBadge floor={roomFloor} size="sm" isVIP={isVIP} />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium flex-wrap">
            <span className="flex items-center gap-1">
              <i className="ri-user-3-line text-xs text-slate-400 dark:text-slate-500" />
              Max {room.capacity || "—"} ppl
            </span>
            {room.branch_name && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-50 dark:bg-sky-950/60 text-[#253C7D] dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
                <i className="ri-building-line text-[10px]" />
                {room.branch_name}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenBookModal(room, "14:00")}
            className="text-xs font-semibold text-[#253C7D] dark:text-sky-400 hover:text-[#1F336A] dark:hover:text-sky-300 flex items-center gap-1 cursor-pointer w-fit"
          >
            <i className="ri-add-circle-line text-sm" />
            <span>Quick Book</span>
          </button>
          {onSelectRoomDetails && (
            <button
              type="button"
              onClick={() => onSelectRoomDetails(room)}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-0.5 cursor-pointer"
            >
              <i className="ri-information-line text-xs" />
              <span>Details</span>
            </button>
          )}
        </div>
      </div>

      {/* Right Grid Column with Bookings */}
      <div className="flex-1 relative min-w-[960px] min-h-[96px] bg-slate-50/30 dark:bg-slate-950/30">
        {/* Background hour grid dividers */}
        <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
          {TIMELINE_HOURS.slice(0, 12).map((h) => (
            <div key={h} className="border-r border-slate-200/60 dark:border-slate-800/80 last:border-r-0 h-full" />
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
                className="h-full hover:bg-[#253C7D]/5 dark:hover:bg-sky-400/5 transition-colors cursor-pointer"
                title={`Click to book ${room.name} at ${timeStr}`}
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
          const durationMins = clampedEnd - clampedStart;
          const widthPct = Math.max(3.5, (durationMins / totalMins) * 100);

          const isApproved = b.status === "approved";
          const isPending = b.status === "pending";
          const isShort = durationMins <= 30;

          return (
            <div
              key={b.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectBooking(b);
              }}
              title={`${b.title} (${fmtTime(b.start_time)} - ${fmtTime(b.end_time)})\nBooked by: ${b.employees?.last_name || ""} ${b.employees?.first_name || "Staff"}\nStatus: ${b.status.toUpperCase()}`}
              style={{
                left: `${leftPct}%`,
                width: `${widthPct}%`,
              }}
              className={`absolute top-2.5 bottom-2.5 rounded-xl p-2 z-10 transition-all cursor-pointer shadow-xs border flex flex-col justify-between overflow-hidden group/card hover:scale-[1.01] hover:shadow-md ${
                isApproved
                  ? "bg-emerald-600 dark:bg-emerald-600/90 text-white border-emerald-700 dark:border-emerald-500 hover:bg-emerald-700"
                  : isPending
                  ? "bg-amber-500 dark:bg-amber-600/90 text-white border-amber-600 dark:border-amber-500 hover:bg-amber-600"
                  : "bg-slate-600 text-white border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between gap-1 leading-tight min-w-0">
                <span className="font-bold text-xs truncate drop-shadow-2xs">{b.title}</span>
                {!isShort && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-white/20 shrink-0">
                    {isPending ? "Pending" : "Approved"}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-medium opacity-95 truncate mt-1">
                <span className="truncate">
                  {b.employees?.first_name ? `${b.employees.first_name}` : "Member"}
                </span>
                <span className="shrink-0 font-semibold ml-1">
                  {fmtTime(b.start_time)}–{fmtTime(b.end_time)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
