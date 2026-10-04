import { memo, useMemo } from "react";
import type { MeetingRoom, Booking } from "../../types";
import { FloorBadge } from "../FloorBadge";
import { fmtTime, getRoomFloor, getRoomImage, toYMD } from "../../roomUtils";
import { getBookingTheme } from "../../bookingThemeUtils";

interface MobileDayTimelineViewProps {
  rooms: MeetingRoom[];
  bookings: Booking[];
  selectedDate: string;
  onSelectDate: (d: string) => void;
  onOpenBookModal: (room: MeetingRoom, startTime?: string) => void;
  onSelectBooking: (b: Booking) => void;
}

export const MobileDayTimelineView = memo(function MobileDayTimelineView({
  rooms,
  bookings,
  selectedDate,
  onSelectDate,
  onOpenBookModal,
  onSelectBooking,
}: MobileDayTimelineViewProps) {
  // Generate 7-day week strip centered around selectedDate
  const weekDays = useMemo(() => {
    const cur = new Date(`${selectedDate}T00:00:00`);
    const dayOfWeek = cur.getDay();
    const sunday = new Date(cur);
    sunday.setDate(cur.getDate() - dayOfWeek);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const ymd = toYMD(d);
      const isSelected = ymd === selectedDate;
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return {
        dateStr: ymd,
        dayName: dayNames[i],
        dayNum: d.getDate(),
        isSelected,
      };
    });
  }, [selectedDate]);

  const currentMonthTitle = useMemo(() => {
    const d = new Date(`${selectedDate}T00:00:00`);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [selectedDate]);

  const shiftWeek = (deltaDays: number) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + deltaDays);
    onSelectDate(toYMD(d));
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Week Strip Navigation Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => shiftWeek(-7)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer active:scale-95"
          >
            <i className="ri-arrow-left-s-line text-lg" />
          </button>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {currentMonthTitle}
          </span>
          <button
            type="button"
            onClick={() => shiftWeek(7)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer active:scale-95"
          >
            <i className="ri-arrow-right-s-line text-lg" />
          </button>
        </div>

        {/* 7 Days Row */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((w) => (
            <button
              key={w.dateStr}
              type="button"
              onClick={() => onSelectDate(w.dateStr)}
              className="flex flex-col items-center py-1.5 rounded-2xl transition-all cursor-pointer select-none active:scale-95"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {w.dayName}
              </span>
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  w.isSelected
                    ? "bg-[#253C7D] dark:bg-sky-500 text-white dark:text-slate-950 font-bold shadow-md"
                    : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {w.dayNum}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Per-Room Schedule Timeline Cards */}
      <div className="space-y-4">
        {rooms.map((room) => {
          const roomBookings = bookings.filter((b) => b.room_id === room.id);
          const floor = getRoomFloor(room);
          const isVIP = floor === 5 || room.name.toLowerCase().includes("vip");
          const roomImg = getRoomImage(room);

          return (
            <div
              key={room.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3"
            >
              {/* Room Card Header */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={roomImg}
                    alt={room.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200/60 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {room.name}
                      </h4>
                    </div>
                    <p className="text-[10.5px] text-slate-400">
                      Max {room.capacity || "—"} ppl
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <FloorBadge floor={floor} size="sm" isVIP={isVIP} />
                </div>
              </div>

              {/* Hourly Bookings Timeline List */}
              <div className="space-y-2">
                {roomBookings.length > 0 ? (
                  roomBookings.map((b, bIdx) => {
                    const theme = getBookingTheme(b.title || bIdx);

                    return (
                      <div
                        key={b.id}
                        onClick={() => onSelectBooking(b)}
                        className="flex items-center gap-2 text-xs cursor-pointer group"
                      >
                        <span className="w-11 font-mono font-bold text-[11px] text-slate-500 shrink-0 text-right">
                          {fmtTime(b.start_time)}
                        </span>
                        <div
                          className={`flex-1 p-2.5 rounded-2xl ${theme.bg} border ${theme.border} flex items-center justify-between gap-2 shadow-2xs transition-colors group-hover:shadow-xs`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-5 h-5 rounded-md ${theme.iconColor} flex items-center justify-center text-xs shrink-0`}>
                              <i className={theme.icon} />
                            </div>
                            <div className="min-w-0">
                              <p className={`font-bold ${theme.text} truncate text-[11.5px]`}>
                                {b.title}
                              </p>
                              <p className={`text-[10px] ${theme.subtext} truncate`}>
                                {room.name}
                              </p>
                            </div>
                          </div>
                          <i className="ri-arrow-right-s-line text-slate-400 text-sm shrink-0" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-11 font-mono font-bold text-[11px] text-slate-400 shrink-0 text-right">
                      15:00
                    </span>
                    <div
                      onClick={() => onOpenBookModal(room)}
                      className="flex-1 p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2 text-slate-400 cursor-pointer hover:border-[#253C7D] transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <i className="ri-user-line text-xs text-slate-400" />
                        <div>
                          <p className="font-semibold text-slate-500 dark:text-slate-400 text-[11px]">
                            Available
                          </p>
                          <p className="text-[10px] text-slate-400">{room.name}</p>
                        </div>
                      </div>
                      <span className="text-[#253C7D] dark:text-sky-400 font-bold text-[10.5px]">
                        + Book
                      </span>
                    </div>
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
