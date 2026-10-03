import { useState, useMemo, useCallback } from "react";
import type { LeaveRequest } from "../types";

interface UseLeaveCalendarDateNavProps {
  filteredLeaves: LeaveRequest[];
}

export function useLeaveCalendarDateNav({ filteredLeaves }: UseLeaveCalendarDateNavProps) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const getDateStr = useCallback(
    (d: number) =>
      `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    [year, month]
  );

  const getDayLeaves = useCallback(
    (d: number) => {
      if (!d) return [];
      const dateStr = getDateStr(d);
      return filteredLeaves.filter((l) => dateStr >= l.start_date && dateStr <= l.end_date);
    },
    [getDateStr, filteredLeaves]
  );

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calCells = useMemo(() => {
    const cells: number[] = [
      ...Array(firstDay).fill(0),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(0);
    return cells;
  }, [firstDay, daysInMonth]);

  const isCurrentDayToday = useCallback(
    (d: number) => {
      const now = new Date();
      return d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
    },
    [month, year]
  );

  const prevMonth = useCallback(() => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDay(null);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDay(null);
  }, [month]);

  const jumpToToday = useCallback(() => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDay(now.getDate());
  }, []);

  const selectedDayLeaves = useMemo(() => {
    return selectedDay ? getDayLeaves(selectedDay) : [];
  }, [selectedDay, getDayLeaves]);

  return {
    year,
    setYear,
    month,
    setMonth,
    selectedDay,
    setSelectedDay,
    getDateStr,
    getDayLeaves,
    firstDay,
    daysInMonth,
    calCells,
    isCurrentDayToday,
    prevMonth,
    nextMonth,
    jumpToToday,
    selectedDayLeaves,
  };
}
