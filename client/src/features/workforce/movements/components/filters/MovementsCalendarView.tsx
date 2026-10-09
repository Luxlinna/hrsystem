import React, { useState } from "react";

interface MovementsCalendarViewProps {
  startDate: string;
  endDate: string;
  onSelectDate: (d: string) => void;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const MovementsCalendarView: React.FC<MovementsCalendarViewProps> = ({
  startDate,
  endDate,
  onSelectDate,
}) => {
  const initialYear = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear();
  const initialMonth = startDate ? new Date(startDate).getMonth() : new Date().getMonth();

  const [currentYear, setCurrentYear] = useState(initialYear || 2024);
  const [currentMonth, setCurrentMonth] = useState(initialMonth || 0);

  const nextMonth = (currentMonth + 1) % 12;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  const handlePrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const renderMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }

    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 1 : month + 2;
      const y = month === 11 ? year + 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    return (
      <div className="w-52 select-none">
        <div className="text-center font-semibold text-xs text-slate-800 pb-2">
          {MONTH_NAMES[month]} {year}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400 font-medium pb-1 border-b border-slate-100">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 pt-1 text-xs">
          {cells.slice(0, 35).map((c, idx) => {
            const isSelectedStart = startDate && c.dateStr === startDate;
            const isSelectedEnd = endDate && c.dateStr === endDate;
            const inRange = startDate && endDate && c.dateStr > startDate && c.dateStr < endDate;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectDate(c.dateStr)}
                className={`h-6 w-full flex items-center justify-center text-[11px] cursor-pointer rounded-xs transition-colors ${
                  isSelectedStart || isSelectedEnd
                    ? "bg-[#253C7D] text-white font-bold"
                    : inRange
                    ? "bg-[#253C7D]/15 text-[#253C7D] font-medium"
                    : c.isCurrentMonth
                    ? "text-slate-800 hover:bg-slate-100"
                    : "text-slate-300 hover:bg-slate-50"
                }`}
              >
                {c.dayNum}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-start gap-4 relative">
      <button
        type="button"
        onClick={handlePrev}
        className="absolute -top-1 left-0 w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer text-xs z-10"
      >
        <i className="ri-arrow-left-s-line text-sm" />
      </button>

      <div className="flex items-start gap-5">
        {renderMonth(currentYear, currentMonth)}
        <div className="border-r border-slate-200 self-stretch my-2" />
        {renderMonth(nextYear, nextMonth)}
      </div>

      <button
        type="button"
        onClick={handleNext}
        className="absolute -top-1 right-0 w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer text-xs z-10"
      >
        <i className="ri-arrow-right-s-line text-sm" />
      </button>
    </div>
  );
};
