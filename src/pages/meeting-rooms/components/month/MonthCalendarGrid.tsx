import { memo, useMemo } from "react";
import type { Booking, MeetingRoom } from "../../types";
import { fmtTime } from "../../roomUtils";

interface MonthCalendarGridProps {
  selectedDate: string;
  onSelectDate: (d: string) => void;
  bookings: Booking[];
  rooms: MeetingRoom[];
  onSelectBooking: (b: Booking) => void;
}

export const MonthCalendarGrid = memo(function MonthCalendarGrid({
  selectedDate,
  onSelectDate,
  bookings,
  rooms,
  onSelectBooking,
}: MonthCalendarGridProps) {
  const current = new Date(`${selectedDate}T00:00:00`);
  const year = current.getFullYear();
  const month = current.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calCells = useMemo(() => {
    const cells: number[] = [
      ...Array(firstDay).fill(0),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(0);
    return cells;
  }, [firstDay, daysInMonth]);

  const getDateStr = (d: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return (
    <div>
      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {daysHeaders.map((d) => (
          <span key={d} className="text-[11px] font-bold text-gray-400 uppercase tracking-wider py-1">
            {d}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calCells.map((d, idx) => {
          if (d === 0) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[85px] sm:min-h-[105px] rounded-2xl bg-gray-50/40 p-2"
              />
            );
          }

          const dateStr = getDateStr(d);
          const isSelected = selectedDate === dateStr;
          const dayBookings = bookings.filter((b) => b.date === dateStr);

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`min-h-[85px] sm:min-h-[105px] rounded-2xl p-2 border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-[#253C7D]/5 border-[#253C7D] ring-2 ring-[#253C7D]/20 shadow-xs"
                  : dayBookings.length > 0
                  ? "bg-white border-gray-200/80 hover:border-gray-300"
                  : "bg-white border-gray-100 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-black w-5 h-5 rounded-full flex items-center justify-center ${
                    isSelected ? "bg-[#253C7D] text-white" : "text-gray-700"
                  }`}
                >
                  {d}
                </span>
                {dayBookings.length > 0 && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                    {dayBookings.length}
                  </span>
                )}
              </div>

              <div className="space-y-1 mt-1">
                {dayBookings.slice(0, 2).map((b) => {
                  const targetRoom = rooms.find((r) => r.id === b.room_id);
                  const isApproved = b.status === "approved";
                  return (
                    <div
                      key={b.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBooking(b);
                      }}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate ${
                        isApproved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {targetRoom?.name.slice(0, 5)}: {fmtTime(b.start_time)}
                    </div>
                  );
                })}

                {dayBookings.length > 2 && (
                  <span className="text-[9px] font-extrabold text-gray-400 block text-right">
                    +{dayBookings.length - 2} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
