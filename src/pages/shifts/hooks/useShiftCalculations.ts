import { useMemo, useCallback } from "react";
import type { Shift, ShiftAssignment, Employee, StaffWorkloadItem, QuickFilter } from "../types";
import { formatDate, getWeekDates, calculateHours } from "../utils";

interface UseShiftCalculationsProps {
  shifts: Shift[];
  assignments: ShiftAssignment[];
  employees: Employee[];
  currentDate: Date;
  selectedShift: Shift | null;
  filterBranch: string;
  filterDept: string;
  quickFilter: QuickFilter;
  searchQuery: string;
}

export function useShiftCalculations({
  shifts,
  assignments,
  employees,
  currentDate,
  selectedShift,
  filterBranch,
  filterDept,
  quickFilter,
  searchQuery,
}: UseShiftCalculationsProps) {
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const filteredShifts = useMemo(() => {
    return shifts.filter((sh) => {
      const matchBranch = filterBranch === "all" || sh.branch_id === filterBranch;
      const matchDept = filterDept === "all" || sh.department === filterDept;

      const assignedCount = sh.assignmentCount ?? 0;
      let matchQuick = true;
      if (quickFilter === "open") matchQuick = assignedCount < sh.capacity;
      else if (quickFilter === "filled") matchQuick = assignedCount >= sh.capacity;

      if (!matchBranch || !matchDept || !matchQuick) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = sh.name?.toLowerCase().includes(q);
        const matchDepartment = sh.department?.toLowerCase().includes(q);
        const matchBranchName = sh.branches?.name?.toLowerCase().includes(q);
        const matchNotes = sh.notes?.toLowerCase().includes(q);
        const shiftAssignedEmp = assignments
          .filter((a) => a.shift_id === sh.id)
          .some((a) =>
            `${a.employee?.first_name || ""} ${a.employee?.last_name || ""} ${a.employee?.role || ""}`
              .toLowerCase()
              .includes(q)
          );
        return matchName || matchDepartment || matchBranchName || matchNotes || shiftAssignedEmp;
      }
      return true;
    });
  }, [shifts, filterBranch, filterDept, quickFilter, searchQuery, assignments]);

  const getShiftsForDay = useCallback(
    (date: Date): Shift[] => {
      const dateStr = formatDate(date);
      return filteredShifts.filter((s) => s.shift_date === dateStr);
    },
    [filteredShifts]
  );

  const getDaySummary = useCallback(
    (date: Date) => {
      const dayShifts = getShiftsForDay(date);
      const totalCapacity = dayShifts.reduce((sum, s) => sum + (s.capacity || 1), 0);
      const totalAssigned = dayShifts.reduce((sum, s) => sum + (s.assignmentCount || 0), 0);
      const totalHours = dayShifts.reduce((sum, s) => sum + calculateHours(s.start_time, s.end_time), 0);
      return { count: dayShifts.length, totalCapacity, totalAssigned, totalHours };
    },
    [getShiftsForDay]
  );

  const weekShifts = useMemo(() => {
    const startStr = formatDate(weekDates[0]);
    const endStr = formatDate(weekDates[6]);
    return filteredShifts.filter((s) => s.shift_date >= startStr && s.shift_date <= endStr);
  }, [filteredShifts, weekDates]);

  const kpiTotalShiftsThisWeek = weekShifts.length;
  const kpiTotalWeeklyCapacity = weekShifts.reduce((acc, s) => acc + (s.capacity || 1), 0);
  const kpiTotalWeeklyAssigned = weekShifts.reduce((acc, s) => acc + (s.assignmentCount || 0), 0);
  const kpiTotalWeeklyHours = weekShifts.reduce((acc, s) => acc + calculateHours(s.start_time, s.end_time), 0);
  const kpiTotalOpenSpots = Math.max(0, kpiTotalWeeklyCapacity - kpiTotalWeeklyAssigned);
  const kpiCoveragePercentage =
    kpiTotalWeeklyCapacity > 0 ? Math.round((kpiTotalWeeklyAssigned / kpiTotalWeeklyCapacity) * 100) : 100;

  const totalOpenShiftsCount = shifts.filter((s) => (s.assignmentCount || 0) < s.capacity).length;
  const totalFilledShiftsCount = shifts.filter((s) => (s.assignmentCount || 0) >= s.capacity).length;

  const staffWorkload: StaffWorkloadItem[] = useMemo(() => {
    const startStr = formatDate(weekDates[0]);
    const endStr = formatDate(weekDates[6]);
    const currentWeekShiftIds = shifts
      .filter((s) => s.shift_date >= startStr && s.shift_date <= endStr)
      .map((s) => s.id);

    const weekAssignments = assignments.filter((a) => currentWeekShiftIds.includes(a.shift_id));

    return employees
      .map((emp) => {
        const empAssignments = weekAssignments.filter((a) => a.employee_id === emp.id);
        const totalHours = empAssignments.reduce((acc, a) => {
          const sh = shifts.find((s) => s.id === a.shift_id);
          return acc + (sh ? calculateHours(sh.start_time, sh.end_time) : 0);
        }, 0);

        return {
          employee: emp,
          shiftCount: empAssignments.length,
          totalHours: Math.round(totalHours * 10) / 10,
          isOvertime: totalHours > 40,
          isFullTime: totalHours >= 35 && totalHours <= 40,
          isUnscheduled: totalHours === 0,
        };
      })
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [shifts, assignments, employees, weekDates]);

  const selectedShiftAssignments = useMemo(() => {
    if (!selectedShift) return [];
    return assignments.filter((a) => a.shift_id === selectedShift.id);
  }, [assignments, selectedShift]);

  const remainingSpots = selectedShift ? Math.max(0, selectedShift.capacity - selectedShiftAssignments.length) : 0;
  const isSelectedShiftFull = selectedShift ? selectedShiftAssignments.length >= selectedShift.capacity : false;

  const checkEmployeeConflict = useCallback(
    (employeeId: string, shiftDate: string, excludeShiftId: string) => {
      const sameDayAssignments = assignments.filter((a) => {
        if (a.employee_id !== employeeId || a.shift_id === excludeShiftId) return false;
        const sh = shifts.find((s) => s.id === a.shift_id);
        return sh && sh.shift_date === shiftDate;
      });
      return sameDayAssignments.length > 0;
    },
    [assignments, shifts]
  );

  return {
    weekDates,
    filteredShifts,
    weekShifts,
    getShiftsForDay,
    getDaySummary,
    kpiTotalShiftsThisWeek,
    kpiTotalWeeklyCapacity,
    kpiTotalWeeklyAssigned,
    kpiTotalWeeklyHours,
    kpiTotalOpenSpots,
    kpiCoveragePercentage,
    totalOpenShiftsCount,
    totalFilledShiftsCount,
    staffWorkload,
    selectedShiftAssignments,
    remainingSpots,
    isSelectedShiftFull,
    checkEmployeeConflict,
  };
}
