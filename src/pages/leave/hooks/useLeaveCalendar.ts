import { useState, useMemo, useRef, useCallback } from "react";
import type { LeaveRequest } from "../types";
import { toYMD } from "../dateUtils";
import type { Holiday } from "@/services/holidays/holidaysService";

interface UseLeaveCalendarProps {
  calendarRequests: LeaveRequest[];
  holidays?: Holiday[];
}

export function useLeaveCalendar({ calendarRequests, holidays = [] }: UseLeaveCalendarProps) {
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(new Date().getDate());
  const [calDeptFilter, setCalDeptFilter] = useState("all");
  const calendarRef = useRef<HTMLDivElement>(null);

  const prevMonth = useCallback(() => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
    setSelectedCalendarDay(null);
  }, [calendarMonth]);

  const nextMonth = useCallback(() => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
    setSelectedCalendarDay(null);
  }, [calendarMonth]);

  const todayMonth = useCallback(() => {
    const now = new Date();
    setCalendarYear(now.getFullYear());
    setCalendarMonth(now.getMonth());
    setSelectedCalendarDay(now.getDate());
  }, []);

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();

  const holidayMap = useMemo(() => {
    const map = new Map<string, Holiday>();
    holidays.forEach((h) => map.set(h.date, h));
    return map;
  }, [holidays]);

  const calendarDays = useMemo(() => {
    const days: {
      day: number;
      dateStr: string;
      leaves: LeaveRequest[];
      holiday?: Holiday;
    }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayLeaves = calendarRequests.filter(
        (r) =>
          dateStr >= r.start_date &&
          dateStr <= r.end_date &&
          (calDeptFilter === "all" || r.employees?.department === calDeptFilter)
      );
      const hol = holidayMap.get(dateStr);
      days.push({ day: d, dateStr, leaves: dayLeaves, holiday: hol });
    }
    return days;
  }, [calendarYear, calendarMonth, daysInMonth, calendarRequests, calDeptFilter, holidayMap]);

  const selectedDayDateStr = selectedCalendarDay
    ? `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(selectedCalendarDay).padStart(2, "0")}`
    : null;

  const selectedDayLeaves = useMemo(() => {
    if (!selectedDayDateStr) return [];
    return calendarRequests.filter(
      (r) =>
        selectedDayDateStr >= r.start_date &&
        selectedDayDateStr <= r.end_date &&
        (calDeptFilter === "all" || r.employees?.department === calDeptFilter)
    );
  }, [selectedDayDateStr, calendarRequests, calDeptFilter]);

  const selectedDayHoliday = useMemo(() => {
    if (!selectedDayDateStr) return null;
    return holidayMap.get(selectedDayDateStr) || null;
  }, [selectedDayDateStr, holidayMap]);

  return {
    calendarYear,
    setCalendarYear,
    calendarMonth,
    setCalendarMonth,
    selectedCalendarDay,
    setSelectedCalendarDay,
    calDeptFilter,
    setCalDeptFilter,
    calendarRef,
    prevMonth,
    nextMonth,
    todayMonth,
    daysInMonth,
    firstDayOfWeek,
    calendarDays,
    selectedDayDateStr,
    selectedDayLeaves,
    selectedDayHoliday,
  };
}
