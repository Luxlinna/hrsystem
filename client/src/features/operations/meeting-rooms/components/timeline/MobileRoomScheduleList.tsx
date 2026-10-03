import { memo } from "react";
import type { MeetingRoom, Booking } from "../../types";
import { FloorBadge } from "../FloorBadge";
import { fmtTime, getRoomFloor } from "../../roomUtils";

interface MobileRoomScheduleListProps {
  rooms: MeetingRoom[];
  bookings: Booking[];
  onOpenBookModal: (room: MeetingRoom, startTime?: string) => void;
  onSelectBooking: (b: Booking) => void;
}

export const MobileRoomScheduleList = memo(function MobileRoomScheduleList({
  rooms,
  bookings,
  onOpenBookModal,
  onSelectBooking,
}: MobileRoomScheduleListProps) {
  return (
    <div className="space-y-3.5 block sm:hidden pb-10">
      {rooms.map((room) => {
        const roomBookings = bookings.filter((b) => b.room_id === room.id);
        const roomFloor = getRoomFloor(room);
        const isVIP = roomFloor === 5;
        const hasBookings = roomBookings.length > 0;

        return (
          <div
            key={room.id}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
          >
            {/* Top Room Header Row */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-tight truncate">
                    {room.name}
                  </h4>
                  <FloorBadge floor={roomFloor} size="sm" isVIP={isVIP} />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <i className="ri-user-3-line text-slate-400 text-xs" />
                    Max {room.capacity || "—"} ppl
                  </span>
                  {room.branch_name && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-sky-950/60 text-[11px] font-bold text-[#253C7D] dark:text-sky-300 border border-blue-200/60 dark:border-sky-800/60">
                      <i className="ri-building-line text-xs" />
                      {room.branch_name}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Book Button */}
              <button
                type="button"
                onClick={() => onOpenBookModal(room)}
                className="inline-flex items-center gap-1 px-3.5 py-2 bg-[#253C7D] hover:bg-[#1E3064] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <i className="ri-add-line text-xs font-bold" />
                <span>Book</span>
              </button>
            </div>

            {/* Schedule Section */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  TODAY'S SCHEDULE ({roomBookings.length})
                </span>
                {!hasBookings ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Available All Day
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {roomBookings.length} {roomBookings.length === 1 ? "Reservation" : "Reservations"}
                  </span>
                )}
              </div>

              {hasBookings ? (
                <div className="space-y-2">
                  {roomBookings.map((b) => {
                    const isApproved = b.status === "approved";
                    const isPending = b.status === "pending";

                    return (
                      <div
                        key={b.id}
                        onClick={() => onSelectBooking(b)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer active:scale-98 shadow-2xs flex items-center justify-between gap-2.5 ${
                          isApproved
                            ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100/70"
                            : isPending
                            ? "bg-amber-50/90 dark:bg-amber-950/30 border-amber-200/90 dark:border-amber-800/60 hover:bg-amber-100/70"
                            : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {b.title}
                            </span>
                            <span
                              className={`text-[9.5px] font-extrabold uppercase tracking-wide px-1.5 py-0.2 rounded-md ${
                                isApproved
                                  ? "bg-emerald-600 text-white"
                                  : isPending
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-500 text-white"
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate flex items-center gap-1">
                            <i className="ri-user-line text-xs text-slate-400" />
                            Booked by {b.employees?.first_name || "Staff"} {b.employees?.last_name || ""}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block">
                            {fmtTime(b.start_time)} – {fmtTime(b.end_time)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  onClick={() => onOpenBookModal(room)}
                  className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 cursor-pointer hover:border-[#253C7D] dark:hover:border-sky-400 transition-colors"
                >
                  <span className="font-medium">No reservations for this date</span>
                  <span className="text-[#253C7D] dark:text-sky-400 font-bold inline-flex items-center gap-1 text-[11px]">
                    Reserve now <i className="ri-arrow-right-s-line" />
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
