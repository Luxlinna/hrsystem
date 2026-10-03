import { memo } from "react";
import type { Booking, MeetingRoom } from "../../types";
import { MonthCalendarGrid } from "./MonthCalendarGrid";
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
}: MonthViewContentProps) {
  const current = new Date(`${selectedDate}T00:00:00`);
  const monthName = current.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const dayBookings = bookings.filter((b) => b.date === selectedDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 2 Cols: Month Calendar Grid */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-gray-900">{monthName}</h3>
            <button
              onClick={onJumpToToday}
              className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onShiftMonth(-1)}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-s-line" />
            </button>
            <button
              onClick={() => onShiftMonth(1)}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
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
      <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Selected Day Schedule
              </span>
              <h4 className="text-base font-extrabold text-gray-900 mt-0.5">
                {formatDateDisplay(selectedDate)}
              </h4>
            </div>

            {dayBookings.length > 0 && (
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {dayBookings.length} Booked
              </span>
            )}
          </div>

          <div className="space-y-3">
            {dayBookings.length === 0 ? (
              <div className="text-center py-14 text-gray-400">
                <i className="ri-calendar-check-line text-3xl block mb-2 text-gray-300" />
                <p className="text-xs font-medium">No reservations scheduled for this day.</p>
                <button
                  onClick={onOpenBookModal}
                  className="mt-3 text-xs font-bold text-[#253C7D] hover:underline cursor-pointer"
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
                    className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-gray-100 transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-extrabold text-xs text-gray-900 truncate">{b.title}</p>
                      <FloorBadge floor={roomFloor} size="sm" isVIP={roomFloor === 5} />
                    </div>

                    <p className="text-[11px] text-gray-500 font-medium">
                      {targetRoom?.name} &middot; {b.employees?.first_name} {b.employees?.last_name}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                      <span>
                        {fmtTime(b.start_time)} &rarr; {fmtTime(b.end_time)}
                      </span>
                      <span
                        className={`font-bold capitalize ${
                          isApproved ? "text-emerald-700" : "text-amber-700"
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
  );
});
