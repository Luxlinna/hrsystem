import { memo, useState, useMemo } from "react";
import type { Course, Enrollment } from "../../types";
import { FORMAT_CONFIG } from "../../constants";

interface TrainingCalendarViewProps {
  courses: Course[];
  enrollments: Enrollment[];
  canManage: boolean;
  onSelectCourse: (c: Course) => void;
  onEnroll: (courseId: string, defaultDueDate?: string) => void;
  onNewCourse?: (initialDate?: string) => void;
}

interface CalendarEvent {
  id: string;
  date: string;
  type: "due" | "completed";
  title: string;
  subtitle: string;
  status?: string;
  course?: Course;
  enrollment?: Enrollment;
  isOverdue?: boolean;
  isDueSoon?: boolean;
}

export const TrainingCalendarView = memo(function TrainingCalendarView({
  courses,
  enrollments,
  canManage,
  onSelectCourse,
  onEnroll,
  onNewCourse,
}: TrainingCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [filterType, setFilterType] = useState<"all" | "due" | "expired" | "completed">("all");
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: string; events: CalendarEvent[] } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Compile all calendar events
  const allEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    // 1. Enrollment Due / Expiry Dates
    enrollments.forEach((e) => {
      if (e.due_date) {
        const isOverdue = e.due_date < todayStr && e.status !== "completed";
        const diffDays = Math.ceil((new Date(e.due_date).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24));
        const isDueSoon = diffDays >= 0 && diffDays <= 7 && e.status !== "completed";

        const empName = `${e.employees?.first_name || ""} ${e.employees?.last_name || ""}`.trim() || "Learner";
        const cTitle = e.training_courses?.title || "Course";

        events.push({
          id: `due-${e.id}`,
          date: e.due_date.slice(0, 10),
          type: "due",
          title: `Due: ${cTitle}`,
          subtitle: empName,
          status: e.status,
          course: e.training_courses,
          enrollment: e,
          isOverdue,
          isDueSoon,
        });
      }

      // 2. Completed / Certified Dates
      if (e.completed_at) {
        const empName = `${e.employees?.first_name || ""} ${e.employees?.last_name || ""}`.trim() || "Learner";
        const cTitle = e.training_courses?.title || "Course";

        events.push({
          id: `completed-${e.id}`,
          date: e.completed_at.slice(0, 10),
          type: "completed",
          title: `Completed: ${cTitle}`,
          subtitle: empName,
          status: "completed",
          course: e.training_courses,
          enrollment: e,
        });
      }
    });

    return events;
  }, [enrollments, todayStr]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      if (filterType === "due") return ev.type === "due" && !ev.isOverdue;
      if (filterType === "expired") return ev.type === "due" && ev.isOverdue;
      if (filterType === "completed") return ev.type === "completed";
      return true;
    });
  }, [allEvents, filterType]);

  // Map events by date YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((ev) => {
      const arr = map.get(ev.date) || [];
      arr.push(ev);
      map.set(ev.date, arr);
    });
    return map;
  }, [filteredEvents]);

  // Calendar Grid generation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: {
      dayNum: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: CalendarEvent[];
    }[] = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: eventsByDate.get(dateStr) || [],
      });
    }

    // Days in current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: eventsByDate.get(dateStr) || [],
      });
    }

    // Trailing days to fill 35 or 42 grid cells
    const remaining = 35 - days.length >= 0 ? 35 - days.length : 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: eventsByDate.get(dateStr) || [],
      });
    }

    return days;
  }, [year, month, todayStr, eventsByDate]);

  // Key KPI stats
  const expiredCount = useMemo(() => allEvents.filter((e) => e.type === "due" && e.isOverdue).length, [allEvents]);
  const dueSoonCount = useMemo(() => allEvents.filter((e) => e.type === "due" && e.isDueSoon).length, [allEvents]);
  const upcomingCompletions = useMemo(() => allEvents.filter((e) => e.type === "completed").length, [allEvents]);

  const monthLabel = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div
          onClick={() => setFilterType((prev) => (prev === "expired" ? "all" : "expired"))}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterType === "expired"
              ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 shadow-xs"
              : "bg-white border-gray-100 hover:border-gray-200 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Expired / Overdue
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{expiredCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Trainings past deadline</p>
        </div>

        <div
          onClick={() => setFilterType((prev) => (prev === "due" ? "all" : "due"))}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterType === "due"
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-xs"
              : "bg-white border-gray-100 hover:border-gray-200 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Due Within 7 Days
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{dueSoonCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Approaching completion date</p>
        </div>

        <div
          onClick={() => setFilterType((prev) => (prev === "completed" ? "all" : "completed"))}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterType === "completed"
              ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
              : "bg-white border-gray-100 hover:border-gray-200 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Completed / Certified
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{upcomingCompletions}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Mastery achievements</p>
        </div>
      </div>

      {/* Calendar Navigation Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded-lg text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
              title="Previous Month"
            >
              <i className="ri-arrow-left-s-line text-lg" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded-lg text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
              title="Next Month"
            >
              <i className="ri-arrow-right-s-line text-lg" />
            </button>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
            {monthLabel}
          </h2>

          <button
            onClick={handleToday}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* Event Legend & Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === "all"
                ? "bg-[#253C7D] text-white shadow-2xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilterType("due")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === "due"
                ? "bg-amber-500 text-white shadow-2xs"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Due Dates
          </button>
          <button
            onClick={() => setFilterType("expired")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === "expired"
                ? "bg-rose-600 text-white shadow-2xs"
                : "bg-rose-50 text-rose-800 hover:bg-rose-100"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Expired / Overdue
          </button>
          <button
            onClick={() => setFilterType("completed")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === "completed"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Completed
          </button>
        </div>
      </div>

      {/* Monthly Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/70 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider py-2.5">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days Cells Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-100">
          {calendarDays.map((day, idx) => (
            <div
              key={`${day.dateStr}-${idx}`}
              onClick={(e) => {
                // If user clicks the cell container (not an event pill)
                if (e.target === e.currentTarget && canManage && onNewCourse) {
                  onNewCourse(day.dateStr);
                }
              }}
              className={`min-h-[115px] p-2 flex flex-col justify-between transition-colors group/day ${
                canManage ? "cursor-pointer hover:bg-slate-50/70" : ""
              } ${day.isCurrentMonth ? "bg-white" : "bg-gray-50/40 opacity-60"} ${
                day.isToday ? "bg-blue-50/30" : ""
              }`}
              title={canManage ? `Click to schedule a training on ${day.dateStr}` : undefined}
            >
              {/* Day Number Header & Add Button */}
              <div className="flex items-center justify-between mb-1.5 pointer-events-auto">
                <span
                  className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    day.isToday
                      ? "bg-[#253C7D] text-white shadow-2xs font-extrabold"
                      : day.isCurrentMonth
                      ? "text-gray-800"
                      : "text-gray-400"
                  }`}
                >
                  {day.dayNum}
                </span>

                <div className="flex items-center gap-1">
                  {day.events.length > 0 && (
                    <span className="text-[10px] font-bold text-gray-400">
                      {day.events.length} {day.events.length === 1 ? "item" : "items"}
                    </span>
                  )}
                  {canManage && onNewCourse && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNewCourse(day.dateStr);
                      }}
                      title={`Schedule training on ${day.dateStr}`}
                      className="opacity-0 group-hover/day:opacity-100 p-0.5 text-[#253C7D] hover:bg-blue-100/70 rounded transition-all cursor-pointer"
                    >
                      <i className="ri-add-line font-bold text-xs" />
                    </button>
                  )}
                </div>
              </div>

              {/* Events Stack on this Day */}
              <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-none flex-1">
                {day.events.slice(0, 2).map((ev) => {
                  let pillClass = "bg-blue-50 text-blue-800 border-blue-200/60";
                  if (ev.type === "due") {
                    pillClass = ev.isOverdue
                      ? "bg-rose-100 text-rose-800 border-rose-300 font-bold"
                      : ev.isDueSoon
                      ? "bg-amber-100 text-amber-800 border-amber-300 font-bold"
                      : "bg-sky-50 text-sky-800 border-sky-200";
                  } else if (ev.type === "completed") {
                    pillClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
                  }

                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (ev.course) {
                          onSelectCourse({
                            ...ev.course,
                            scheduled_date: ev.course.scheduled_date || ev.date,
                          });
                        }
                      }}
                      className={`p-1 rounded-md text-[10px] border leading-tight truncate cursor-pointer hover:opacity-90 transition-opacity ${pillClass}`}
                      title={`${ev.title} — ${ev.subtitle}`}
                    >
                      <p className="font-bold truncate">{ev.title}</p>
                      <p className="text-[9px] opacity-75 truncate">{ev.subtitle}</p>
                    </div>
                  );
                })}

                {day.events.length > 2 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDayEvents({ date: day.dateStr, events: day.events });
                    }}
                    className="w-full text-center text-[10px] font-bold text-[#253C7D] hover:bg-blue-50 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    +{day.events.length - 2} more
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Day Events Popup */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Training Schedule &amp; Deadlines
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  {new Date(selectedDayEvents.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {selectedDayEvents.events.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => {
                    if (ev.course) {
                      onSelectCourse({
                        ...ev.course,
                        scheduled_date: ev.course.scheduled_date || ev.date,
                      });
                      setSelectedDayEvents(null);
                    }
                  }}
                  className="p-3 rounded-xl border border-gray-100 hover:border-[#253C7D]/30 bg-gray-50/60 hover:bg-white transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{ev.title}</span>
                    {ev.type === "due" && (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          ev.isOverdue
                            ? "bg-rose-100 text-rose-800"
                            : ev.isDueSoon
                            ? "bg-amber-100 text-amber-800"
                            : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {ev.isOverdue ? "EXPIRED / OVERDUE" : ev.isDueSoon ? "DUE SOON" : "SCHEDULED"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{ev.subtitle}</p>
                </div>
              ))}
            </div>

            {canManage && onNewCourse && (
              <div className="pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    const dateToUse = selectedDayEvents.date;
                    setSelectedDayEvents(null);
                    onNewCourse(dateToUse);
                  }}
                  className="w-full py-2.5 bg-[#253C7D] text-white rounded-xl text-xs font-bold hover:bg-[#1E293B] transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <i className="ri-add-line font-bold text-sm" />
                  Schedule Training Course on this Day
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
