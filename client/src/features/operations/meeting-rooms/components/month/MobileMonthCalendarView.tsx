import { memo, useMemo } from "react";
import type { Booking, MeetingRoom } from "../../types";
import { fmtTime, toYMD } from "../../roomUtils";
import { getBookingTheme } from "../../bookingThemeUtils";

interface MobileMonthCalendarViewProps {
  selectedDate: string;
  onSelectDate: (d: string) => void;
  onShiftMonth: (delta: number) => void;
  bookings: Booking[];
  rooms: MeetingRoom[];
  onSelectBooking: (b: Booking) => void;
  onOpenBookModal: () => void;
  onOpenFilter?: () => void;
  onViewAll?: () => void;
}

export const MobileMonthCalendarView = memo(function MobileMonthCalendarView({
  selectedDate,
  onSelectDate,
  onShiftMonth,
  bookings,
  rooms,
  onSelectBooking,
  onOpenBookModal,
  onOpenFilter,
  onViewAll,
}: MobileMonthCalendarViewProps) {
  const current = new Date(`${selectedDate}T00:00:00`);
  const year = current.getFullYear();
  const month = current.getMonth();
  const monthTitle = current.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const daysHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate 7-col grid cells with previous and next month trailing days
  const calendarCells = useMemo(() => {
    const cells: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, prevDay);
      cells.push({ day: prevDay, isCurrentMonth: false, dateStr: toYMD(prevDate) });
    }

    // Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const curDate = new Date(year, month, day);
      cells.push({ day, isCurrentMonth: true, dateStr: toYMD(curDate) });
    }

    // Next month days to fill grid
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let day = 1; day <= remaining; day++) {
        const nextDate = new Date(year, month + 1, day);
        cells.push({ day, isCurrentMonth: false, dateStr: toYMD(nextDate) });
      }
    }

    return cells;
  }, [year, month, firstDayOfWeek, daysInCurrentMonth, daysInPrevMonth]);

  const dayBookings = useMemo(
    () => bookings.filter((b) => b.date === selectedDate),
    [bookings, selectedDate]
  );

  return (
    <div className="space-y-4 pb-20">
      {/* Calendar Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3.5">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onShiftMonth(-1)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer active:scale-95"
          >
            <i className="ri-arrow-left-s-line text-lg" />
          </button>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {monthTitle}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onShiftMonth(1)}
              className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer active:scale-95"
            >
              <i className="ri-arrow-right-s-line text-lg" />
            </button>
            {onOpenFilter && (
              <button
                type="button"
                onClick={onOpenFilter}
                className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200/60 cursor-pointer"
              >
                <i className="ri-equalizer-line text-sm" />
              </button>
            )}
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {daysHeaders.map((d) => (
            <span key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-0.5">
              {d}
            </span>
          ))}
        </div>

        {/* Month Dates Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((cell) => {
            const isSelected = cell.dateStr === selectedDate;
            const hasBookings = bookings.some((b) => b.date === cell.dateStr);

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => onSelectDate(cell.dateStr)}
                className="flex flex-col items-center justify-center py-2 relative rounded-2xl transition-all cursor-pointer select-none active:scale-95"
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    isSelected
                      ? "bg-[#253C7D] dark:bg-sky-500 text-white dark:text-slate-950 font-bold shadow-md"
                      : cell.isCurrentMonth
                      ? "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      : "text-slate-300 dark:text-slate-600"
                  }`}
                >
                  {cell.day}
                </span>
                {hasBookings && !isSelected && (
                  <span className="w-1 h-1 rounded-full bg-[#253C7D] dark:bg-sky-400 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's Schedule Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Today's Schedule ({dayBookings.length})
          </h3>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-bold text-[#253C7D] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View all</span>
              <i className="ri-arrow-right-line text-xs" />
            </button>
          )}
        </div>

        {/* Schedule List */}
        <div className="space-y-2">
          {dayBookings.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 text-center shadow-2xs space-y-2">
              <i className="ri-calendar-event-line text-3xl text-slate-300 dark:text-slate-600 block" />
              <p className="text-xs font-medium text-slate-400">No meetings scheduled for this date.</p>
              <button
                type="button"
                onClick={onOpenBookModal}
                className="mt-1 text-xs font-bold text-[#253C7D] dark:text-sky-400 hover:underline cursor-pointer"
              >
                + Book a Meeting Room
              </button>
            </div>
          ) : (
            dayBookings.map((b, idx) => {
              const theme = getBookingTheme(b.title || idx);
              const room = rooms.find((r) => r.id === b.room_id);

              return (
                <div
                  key={b.id}
                  onClick={() => onSelectBooking(b)}
                  className="flex items-center gap-2.5 text-xs cursor-pointer group"
                >
                  <span className="w-11 font-mono font-bold text-[11px] text-slate-500 shrink-0 text-right">
                    {fmtTime(b.start_time)}
                  </span>
                  <div
                    className={`flex-1 p-3 rounded-2xl ${theme.bg} border ${theme.border} flex items-center justify-between gap-2 shadow-2xs transition-all group-hover:shadow-xs active:scale-[0.99]`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-6 h-6 rounded-lg ${theme.iconColor} flex items-center justify-center text-sm shrink-0`}>
                        <i className={theme.icon} />
                      </div>
                      <div className="min-w-0">
                        <p className={`font-bold ${theme.text} text-xs truncate`}>{b.title}</p>
                        <p className={`text-[10.5px] ${theme.subtext} truncate font-medium`}>
                          {room?.name || "Meeting Room"}
                        </p>
                      </div>
                    </div>
                    <i className="ri-arrow-right-s-line text-slate-400 text-base shrink-0" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});
