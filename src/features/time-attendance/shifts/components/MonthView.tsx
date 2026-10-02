import { formatDate } from "../utils";
import { DAYS_SHORT } from "../constants";
import type { Shift } from "../types";

interface MonthViewProps {
  currentDate: Date;
  filteredShifts: Shift[];
  setCurrentDate: (d: Date) => void;
  setViewMode: (v: "day") => void;
}

export function MonthView({ currentDate, filteredShifts, setCurrentDate, setViewMode }: MonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  while (cells.length % 7 !== 0 || cells.length < 35) {
    const nextD = cells.length - (firstDayIndex + daysInMonth) + 1;
    cells.push({ date: new Date(year, month + 1, nextD), isCurrentMonth: false });
  }

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-2xs">
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center py-2.5">
        {DAYS_SHORT.map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
        {cells.map(({ date, isCurrentMonth }, idx) => {
          const dateStr = formatDate(date);
          const isToday = dateStr === formatDate(new Date());
          const dayShifts = filteredShifts.filter((s) => s.shift_date === dateStr);

          return (
            <div
              key={idx}
              onClick={() => { setCurrentDate(date); setViewMode("day"); }}
              className={`min-h-[105px] p-2 transition-all hover:bg-gray-50 cursor-pointer flex flex-col justify-between ${!isCurrentMonth ? "opacity-35 bg-gray-50/40" : ""} ${isToday ? "bg-[#253C7D]/4" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${isToday ? "bg-[#253C7D] text-white" : "text-gray-700"}`}>
                  {date.getDate()}
                </span>
                {dayShifts.length > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600">{dayShifts.length}</span>
                )}
              </div>
              <div className="space-y-1 mt-1.5 flex-1">
                {dayShifts.slice(0, 2).map((sh) => (
                  <div key={sh.id} className="text-[9px] font-semibold px-1.5 py-0.5 rounded truncate text-white" style={{ backgroundColor: sh.color || "#253C7D" }}>
                    {sh.name}
                  </div>
                ))}
                {dayShifts.length > 2 && <div className="text-[9px] font-bold text-gray-400 pl-1">+{dayShifts.length - 2} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
