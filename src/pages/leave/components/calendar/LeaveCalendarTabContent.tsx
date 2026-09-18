import { memo, useState } from "react";
import type { LeaveRequest } from "../../types";
import { LeaveCalendarHeader } from "./LeaveCalendarHeader";
import { LeaveCalendarGrid } from "./LeaveCalendarGrid";
import { LeaveCalendarDayAgenda } from "./LeaveCalendarDayAgenda";
import type { Holiday } from "@/services/holidays/holidaysService";

interface LeaveCalendarTabContentProps {
  calendarYear: number;
  calendarMonth: number;
  selectedCalendarDay: number | null;
  setSelectedCalendarDay: (d: number | null) => void;
  calDeptFilter: string;
  setCalDeptFilter: (dept: string) => void;
  departments: string[];
  calendarDays: {
    day: number;
    dateStr: string;
    leaves: LeaveRequest[];
    holiday?: Holiday;
  }[];
  firstDayOfWeek: number;
  prevMonth: () => void;
  nextMonth: () => void;
  todayMonth: () => void;
  selectedDayDateStr: string | null;
  selectedDayLeaves: LeaveRequest[];
  selectedDayHoliday?: Holiday | null;
  onInspectRequest: (req: LeaveRequest) => void;
  onOpenHolidaysModal?: () => void;
  holidayCount?: number;
}

export const LeaveCalendarTabContent = memo(function LeaveCalendarTabContent({
  calendarYear,
  calendarMonth,
  selectedCalendarDay,
  setSelectedCalendarDay,
  calDeptFilter,
  setCalDeptFilter,
  departments,
  calendarDays,
  firstDayOfWeek,
  prevMonth,
  nextMonth,
  todayMonth,
  selectedDayLeaves,
  selectedDayHoliday,
  onInspectRequest,
  onOpenHolidaysModal,
  holidayCount,
}: LeaveCalendarTabContentProps) {
  const [calendarLang, setCalendarLang] = useState<"en" | "km">(() => {
    try {
      return (localStorage.getItem("leave_calendar_lang") as "en" | "km") || "en";
    } catch {
      return "en";
    }
  });

  const handleToggleLang = (lang: "en" | "km") => {
    setCalendarLang(lang);
    try {
      localStorage.setItem("leave_calendar_lang", lang);
    } catch {
      // Fallback if localStorage is unavailable
    }
  };

  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs">
        <LeaveCalendarHeader
          calendarYear={calendarYear}
          calendarMonth={calendarMonth}
          calendarLang={calendarLang}
          onToggleLang={handleToggleLang}
          todayMonth={todayMonth}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
          onOpenHolidaysModal={onOpenHolidaysModal}
          holidayCount={holidayCount}
          departments={departments}
          calDeptFilter={calDeptFilter}
          setCalDeptFilter={setCalDeptFilter}
          monthNamesEn={monthNamesEn}
        />

        <LeaveCalendarGrid
          calendarDays={calendarDays}
          firstDayOfWeek={firstDayOfWeek}
          selectedCalendarDay={selectedCalendarDay}
          setSelectedCalendarDay={setSelectedCalendarDay}
          calendarLang={calendarLang}
        />
      </div>

      <LeaveCalendarDayAgenda
        selectedCalendarDay={selectedCalendarDay}
        calendarMonth={calendarMonth}
        calendarYear={calendarYear}
        selectedDayLeaves={selectedDayLeaves}
        selectedDayHoliday={selectedDayHoliday}
        monthNames={monthNamesEn}
        calendarLang={calendarLang}
        onInspectRequest={onInspectRequest}
      />
    </div>
  );
});
