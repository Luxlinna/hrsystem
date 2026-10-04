import { memo, useState, useMemo } from "react";
import type { Task } from "../../types";
import { STATUS_CONFIG, PRIORITY_META } from "../../constants";

interface TaskCalendarViewProps {
  tasks: Task[];
  onSelect: (t: Task) => void;
}

export const TaskCalendarView = memo(function TaskCalendarView({
  tasks,
  onSelect,
}: TaskCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday index

  const days = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDayIndex; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [firstDayIndex, daysInMonth]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (t.due_date) {
        if (!map[t.due_date]) map[t.due_date] = [];
        map[t.due_date].push(t);
      }
    });
    return map;
  }, [tasks]);

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xs">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-900">{monthLabel}</h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer"
          >
            <i className="ri-arrow-left-s-line" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer"
          >
            <i className="ri-arrow-right-s-line" />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          if (d === null) {
            return <div key={`empty-${i}`} className="min-h-[90px] bg-gray-50/40 rounded-xl" />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const dayTasks = tasksByDate[dateStr] || [];
          const isToday =
            new Date().toISOString().substring(0, 10) === dateStr;

          return (
            <div
              key={dateStr}
              className={`min-h-[90px] p-2 rounded-xl border transition-colors flex flex-col ${
                isToday
                  ? "bg-blue-50/30 border-[#253C7D]/30"
                  : "bg-gray-50/70 border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold ${
                    isToday
                      ? "w-5 h-5 rounded-full bg-[#253C7D] text-white flex items-center justify-center text-[10px]"
                      : "text-gray-700"
                  }`}
                >
                  {d}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}
                  </span>
                )}
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[70px] pr-0.5">
                {dayTasks.map((t) => {
                  const statusCfg = STATUS_CONFIG[t.status];
                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelect(t)}
                      className={`text-[10px] p-1 rounded-md border truncate cursor-pointer font-medium hover:opacity-80 transition-opacity ${statusCfg.badge}`}
                      title={t.title}
                    >
                      {t.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
