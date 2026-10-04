import { memo } from "react";
import type { MeetingRoom, Booking } from "../../types";
import { FloorBadge } from "../FloorBadge";
import { fmtTime, getRoomFloor, getRoomImage } from "../../roomUtils";

interface MobileRoomScheduleListProps {
  rooms: MeetingRoom[];
  bookings: Booking[];
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  onOpenBookModal: (room: MeetingRoom, startTime?: string) => void;
  onSelectBooking: (b: Booking) => void;
  onSelectRoomDetails?: (room: MeetingRoom) => void;
}

export const MobileRoomScheduleList = memo(function MobileRoomScheduleList({
  rooms,
  bookings,
  searchQuery = "",
  setSearchQuery,
  onOpenBookModal,
  onSelectBooking,
  onSelectRoomDetails,
}: MobileRoomScheduleListProps) {
  return (
    <div className="space-y-4 block sm:hidden pb-16">
      {/* Search Bar */}
      {setSearchQuery && (
        <div className="relative">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search room name, location, or capacity..."
            className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] shadow-2xs transition-all"
          />
        </div>
      )}

      {/* Room Cards List */}
      <div className="space-y-3.5">
        {rooms.map((room) => {
          const roomBookings = bookings.filter((b) => b.room_id === room.id);
          const roomFloor = getRoomFloor(room);
          const isVIP = roomFloor === 5 || room.name.toLowerCase().includes("vip");
          const hasBookings = roomBookings.length > 0;
          const roomImgUrl = getRoomImage(room);

          return (
            <div
              key={room.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3.5 transition-all"
            >
              {/* Top Room Header Row */}
              <div className="flex items-center justify-between gap-3">
                <div
                  onClick={() => onSelectRoomDetails && onSelectRoomDetails(room)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  {/* Room Thumbnail */}
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shrink-0 shadow-2xs">
                    <img
                      src={roomImgUrl}
                      alt={room.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Room Meta */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-tight truncate">
                        {room.name}
                      </h4>
                      {isVIP ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                          <i className="ri-vip-crown-line text-[11px]" />
                          Floor 5
                        </span>
                      ) : (
                        <FloorBadge floor={roomFloor} size="sm" isVIP={false} />
                      )}
                      {room.branch_name && (
                        <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-sky-50 dark:bg-sky-950/60 text-[#253C7D] dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60 truncate max-w-[120px]">
                          <i className="ri-building-line text-[9.5px]" />
                          {room.branch_name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/60">
                        <i className="ri-user-3-line text-slate-400 text-xs" />
                        Max {room.capacity || "—"} ppl
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <i className="ri-map-pin-2-line text-emerald-500" />
                        Floor {roomFloor}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Book Button */}
                <button
                  type="button"
                  onClick={() => onOpenBookModal(room)}
                  className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-[#253C7D] hover:bg-[#1E3064] dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <i className="ri-add-line text-xs font-bold" />
                  <span>Book</span>
                </button>
              </div>

              {/* Schedule Section */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    TODAY'S SCHEDULE ({roomBookings.length})
                  </span>
                  {!hasBookings ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Available All Day
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {roomBookings.length} {roomBookings.length === 1 ? "Booking" : "Bookings"}
                    </span>
                  )}
                </div>

                {hasBookings ? (
                  <div className="space-y-1.5">
                    {roomBookings.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => onSelectBooking(b)}
                        className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2.5 cursor-pointer hover:border-[#253C7D] transition-colors shadow-2xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{b.title}</p>
                          <p className="text-[10px] text-slate-400">{b.employees?.first_name || "Staff"} {b.employees?.last_name || ""}</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
                          {fmtTime(b.start_time)} – {fmtTime(b.end_time)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => onOpenBookModal(room)}
                    className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 cursor-pointer hover:border-[#253C7D] transition-colors shadow-2xs"
                  >
                    <span className="font-medium text-slate-500 dark:text-slate-400 text-xs">
                      No reservations for this date
                    </span>
                    <span className="text-[#253C7D] dark:text-sky-400 font-bold inline-flex items-center gap-1 text-xs">
                      Reserve now <i className="ri-arrow-right-s-line" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
