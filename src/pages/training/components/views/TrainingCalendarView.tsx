import React, { memo, useState, useMemo } from "react";
import type { Course, Enrollment } from "../../types";
import { FORMAT_CONFIG } from "../../constants";
import { CalendarStatsCards } from "./calendar/CalendarStatsCards";
import { CalendarDayModal, type CalendarEvent } from "./calendar/CalendarDayModal";
import { CalendarDayCell } from "./calendar/CalendarDayCell";

interface TrainingCalendarViewProps {
  courses: Course[];
  enrollments: Enrollment[];
  canManage: boolean;
  onSelectCourse: (c: Course) => void;
  onEnroll: (courseId: string, defaultDueDate?: string) => void;
  onNewCourse?: (initialDate?: string) => void;
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
  const month = currentDate.getMonth();

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

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

    // 3. Standalone scheduled course dates
    courses.forEach((c) => {
      if (c.scheduled_date) {
        events.push({
          id: `course-${c.id}`,
          date: c.scheduled_date.slice(0, 10),
          type: "due",
          title: `Class: ${c.title}`,
          subtitle: `${FORMAT_CONFIG[c.format || "in-person"].label} · ${c.instructor || "Self-Paced"}`,
          status: c.status,
          course: c,
        });
      }
    });

    return events;
  }, [enrollments, courses, todayStr]);

  // Filter events based on selected filter pill
  const filteredEvents = useMemo(() => {
    if (filterType === "all") return allEvents;
    if (filterType === "due") return allEvents.filter((e) => e.type === "due" && !e.isOverdue);
    if (filterType === "expired") return allEvents.filter((e) => e.isOverdue);
    if (filterType === "completed") return allEvents.filter((e) => e.type === "completed");
    return allEvents;
  }, [allEvents, filterType]);

  // Generate calendar grid days (including prev/next month buffer days for full 7-col grid)
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: filteredEvents.filter((e) => e.date === dateStr),
      });
    }

    // Current month days
    for (let i = 1; i <= lastDayOfMonth; i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateStr,
        dayNum: i,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: filteredEvents.filter((e) => e.date === dateStr),
      });
    }

    // Next month filler days (fill up to complete last week row)
    const remainingCols = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCols; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: filteredEvents.filter((e) => e.date === dateStr),
      });
    }

    return days;
  }, [year, month, todayStr, filteredEvents]);

  // Quick summaries for current month KPI cards
  const scheduledCount = filteredEvents.length;
  const expiredCount = allEvents.filter((e) => e.isOverdue).length;
  const dueSoonCount = allEvents.filter((e) => e.isDueSoon).length;
  const upcomingCompletions = allEvents.filter((e) => e.type === "completed").length;

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <CalendarStatsCards
        filterType={filterType}
        setFilterType={setFilterType}
        scheduledCount={scheduledCount}
        expiredCount={expiredCount}
        dueSoonCount={dueSoonCount}
        upcomingCompletions={upcomingCompletions}
      />

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
            <CalendarDayCell
              key={`${day.dateStr}-${idx}`}
              day={day}
              idx={idx}
              canManage={canManage}
              onSelectCourse={onSelectCourse}
              onNewCourse={onNewCourse}
              onOpenMore={(dateStr, events) => setSelectedDayEvents({ date: dateStr, events })}
            />
          ))}
        </div>
      </div>

      {/* Modal for Day Events Popup */}
      <CalendarDayModal
        selectedDayEvents={selectedDayEvents}
        onClose={() => setSelectedDayEvents(null)}
        onSelectCourse={onSelectCourse}
        canManage={canManage}
        onNewCourse={onNewCourse}
      />
    </div>
  );
});
