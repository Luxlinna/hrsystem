import { memo } from "react";
import type { Booking, MeetingRoom } from "../../types";
import { MonthCalendarGrid } from "./MonthCalendarGrid";
import { MobileMonthCalendarView } from "./MobileMonthCalendarView";
import { FloorBadge } from "../FloorBadge";
import { fmtTime, getRoomFloor, formatDateDisplay } from "../../roomUtils";

interface MonthViewContentProps {
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  onShiftMonth: (delta: number) => void;
  onJumpToToday: () => void;
  bookings: Booking[];
  rooms: MeetingRoom[];
  onSelectBooking: (b: Booking) => void;
  onOpenBookModal: () => void;
  onViewAll?: () => void;
}

export const MonthViewContent = memo(function MonthViewContent({
  selectedDate,
  setSelectedDate,
  onShiftMonth,
  onJumpToToday,
  bookings,
  rooms,
  onSelectBooking,
  onOpenBookModal,
  onViewAll,
}: MonthViewContentProps) {
  const current = new Date(`${selectedDate}T00:00:00`);
  const monthName = current.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const dayBookings = bookings.filter((b) => b.date === selectedDate);

  return (
    <div>
      {/* Mobile Month Calendar View (Right Screen from user mockup) */}
      <div className="block sm:hidden">
        <MobileMonthCalendarView
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onShiftMonth={onShiftMonth}
          bookings={bookings}
          rooms={rooms}
          onSelectBooking={onSelectBooking}
          onOpenBookModal={onOpenBookModal}
          onViewAll={onViewAll}
        />
      </div>

      {/* Desktop / Tablet 2-Column Grid */}
      <div className="hidden sm:grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2 Cols: Month Calendar Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{monthName}</h3>
              <button
                onClick={onJumpToToday}
                className="px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onShiftMonth(-1)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <i className="ri-arrow-left-s-line" />
              </button>
              <button
                onClick={() => onShiftMonth(1)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <i className="ri-arrow-right-s-line" />
              </button>
            </div>
          </div>

          <MonthCalendarGrid
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            bookings={bookings}
            rooms={rooms}
            onSelectBooking={onSelectBooking}
          />
        </div>

        {/* 1 Col: Selected Date Schedule Agenda */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Selected Day Schedule
                </span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                  {formatDateDisplay(selectedDate)}
                </h4>
              </div>

              {dayBookings.length > 0 && (
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                  {dayBookings.length} Booked
                </span>
              )}
            </div>

            <div className="space-y-3">
              {dayBookings.length === 0 ? (
                <div className="text-center py-14 text-slate-400">
                  <i className="ri-calendar-check-line text-3xl block mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-medium">No reservations scheduled for this day.</p>
                  <button
                    onClick={onOpenBookModal}
                    className="mt-3 text-xs font-bold text-[#253C7D] dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    + Book a Room
                  </button>
                </div>
              ) : (
                dayBookings.map((b) => {
                  const targetRoom = rooms.find((r) => r.id === b.room_id);
                  const roomFloor = getRoomFloor(targetRoom);
                  const isApproved = b.status === "approved";

                  return (
                    <div
                      key={b.id}
                      onClick={() => onSelectBooking(b)}
                      className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">{b.title}</p>
                        <FloorBadge floor={roomFloor} size="sm" isVIP={roomFloor === 5} />
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {targetRoom?.name} &middot; {b.employees?.first_name} {b.employees?.last_name}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span>
                          {fmtTime(b.start_time)} &rarr; {fmtTime(b.end_time)}
                        </span>
                        <span
                          className={`font-bold capitalize ${
                            isApproved ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
