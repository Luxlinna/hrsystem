import { memo } from "react";
import type { Booking, MeetingRoom } from "../types";
import { FloorBadge } from "./FloorBadge";
import { fmtTime, getRoomFloor, formatDateDisplay } from "../roomUtils";

interface PendingBookingsQueueProps {
  bookings: Booking[];
  rooms: MeetingRoom[];
  onSelectBooking: (b: Booking) => void;
  onJumpToBookingDate?: (dateStr: string) => void;
  canApprove?: boolean;
}

export const PendingBookingsQueue = memo(function PendingBookingsQueue({
  bookings,
  rooms,
  onSelectBooking,
  onJumpToBookingDate,
  canApprove = false,
}: PendingBookingsQueueProps) {
  const pendingBookings = bookings.filter((b) => b.status === "pending");

  if (pendingBookings.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2">
          <i className="ri-checkbox-circle-line" />
        </div>
        <p className="font-extrabold text-sm text-gray-800">All Caught Up!</p>
        <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
          There are no pending meeting room reservation requests awaiting review.
        </p>
      </div>
    );
  }

  const roomMap = new Map<string, MeetingRoom>();
  rooms.forEach((r) => roomMap.set(r.id, r));

  return (
    <div className="bg-white rounded-3xl border border-amber-200/80 p-5 sm:p-6 shadow-2xs space-y-4 animate-in fade-in duration-150">
      <div className="flex items-center justify-between pb-3 border-b border-amber-100 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
            <i className="ri-hourglass-2-line" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-900">
              Pending Room Reservations ({pendingBookings.length})
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Review and decision requests requiring Admin/HR approval
            </p>
          </div>
        </div>

        <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
          {pendingBookings.length} Awaiting Decision
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pendingBookings.map((b) => {
          const room = roomMap.get(b.room_id);
          const roomFloor = getRoomFloor(room);
          const isVIP = roomFloor === 5;
          const bookerName = `${b.employees?.first_name || ""} ${b.employees?.last_name || ""}`.trim() || b.booked_by || "Employee";
          const dept = b.employees?.department || "General";

          return (
            <div
              key={b.id}
              onClick={() => onSelectBooking(b)}
              className="bg-amber-50/40 hover:bg-amber-50 border border-amber-200/90 hover:border-amber-300 rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs space-y-3 relative group"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-gray-900 group-hover:text-[#253C7D] transition-colors">
                      {b.title}
                    </span>
                    <FloorBadge floor={roomFloor} size="sm" isVIP={isVIP} />
                  </div>
                  <p className="text-xs text-gray-600 font-medium mt-1 flex items-center gap-1.5">
                    <i className="ri-door-open-line text-gray-400" />
                    <strong>{room?.name || "Meeting Room"}</strong>
                    <span className="text-gray-300">&bull;</span>
                    <span>Max {room?.capacity || "—"} ppl</span>
                  </p>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white uppercase tracking-wider shrink-0">
                  Pending
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-white/80 p-2.5 rounded-xl border border-amber-100/80">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Reserved Date
                  </span>
                  <span className="font-bold text-gray-800">{formatDateDisplay(b.date)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Time Window
                  </span>
                  <span className="font-bold text-[#253C7D]">
                    {fmtTime(b.start_time)} &rarr; {fmtTime(b.end_time)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <div className="flex items-center gap-1.5 truncate">
                  <i className="ri-user-3-line text-gray-400" />
                  <span className="font-semibold text-gray-800">{bookerName}</span>
                  <span className="text-gray-400">({dept})</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onJumpToBookingDate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onJumpToBookingDate(b.date);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-[#253C7D] bg-white border border-[#253C7D]/30 hover:bg-[#253C7D]/5 rounded-lg transition-colors cursor-pointer"
                    >
                      View on Date
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBooking(b);
                    }}
                    className="px-3 py-1 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    {canApprove ? "Review Decision" : "View Details"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
