import { useState, useMemo, useCallback } from "react";
import { useBranchScope } from "@/context/BranchContext";
import { DAY_NAMES_SHORT, CAMBODIA_OCTOBER_HOLIDAYS } from "./matrixConstants";
import { useMatrixDataLoader } from "./useMatrixDataLoader";
import { buildRosterRows } from "./matrixRosterBuilder";
import { buildAvailableShiftList, deriveShiftCode } from "./matrixShiftHelper";
import type { DayColumn, EmployeeRosterRow } from "./types";

export function useAttendanceScheduleMatrix() {
  const { targetBranch } = useBranchScope();

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 9, 1));
  const [activeTab, setActiveTab] = useState<"schedules" | "no_schedules">("schedules");
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [manualCellOverrides, setManualCellOverrides] = useState<Record<string, string>>({});

  const {
    loading,
    rawEmployees,
    rawShifts,
    rawTemplates,
    shiftAssignments,
    templateAssignments,
    templatesById,
    attendanceRecords,
    loadMatrixData,
  } = useMatrixDataLoader(targetBranch, currentDate);

  const availableShifts = useMemo(() => {
    return buildAvailableShiftList(rawShifts, rawTemplates);
  }, [rawShifts, rawTemplates]);

  const shiftAssignmentsByEmpDate = useMemo(() => {
    const map: Record<string, string> = {};
    const shiftsById = new Map<string, any>();
    rawShifts.forEach((s) => shiftsById.set(s.id, s));

    shiftAssignments.forEach((a) => {
      const sh = shiftsById.get(a.shift_id);
      if (sh && sh.shift_date) {
        const code = deriveShiftCode(sh.name, sh.code, sh.start_time, sh.end_time);
        map[`${a.employee_id}_${sh.shift_date}`] = code;
      }
    });
    return map;
  }, [rawShifts, shiftAssignments]);

  const prevMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const dayColumns: DayColumn[] = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cols: DayColumn[] = [];
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const dayOfWeek = d.getDay();
      const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const holiday = month === 9 ? CAMBODIA_OCTOBER_HOLIDAYS[day] : undefined;

      cols.push({
        dayNumber: day,
        dayName: DAY_NAMES_SHORT[dayOfWeek],
        dateString,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isHoliday: Boolean(holiday),
        holidayName: holiday?.name,
        holidayCode: holiday?.code,
      });
    }
    return cols;
  }, [currentDate]);

  const rosterRows: EmployeeRosterRow[] = useMemo(() => {
    return buildRosterRows({
      rawEmployees,
      templateAssignments,
      templatesById,
      dayColumns,
      attendanceRecords,
      manualCellOverrides,
      shiftAssignmentsByEmpDate,
    });
  }, [
    rawEmployees,
    templateAssignments,
    templatesById,
    dayColumns,
    attendanceRecords,
    manualCellOverrides,
    shiftAssignmentsByEmpDate,
  ]);

  const filteredRoster = useMemo(() => {
    return rosterRows.filter((row) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          row.name.toLowerCase().includes(q) ||
          row.employeeCode.toLowerCase().includes(q) ||
          row.role.toLowerCase().includes(q) ||
          row.department.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterDept !== "all" && row.department.toLowerCase() !== filterDept.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [rosterRows, search, filterDept]);

  const scheduledEmployees = useMemo(
    () => filteredRoster.filter((r) => r.hasSchedule),
    [filteredRoster]
  );

  const unscheduledEmployees = useMemo(
    () => filteredRoster.filter((r) => !r.hasSchedule),
    [filteredRoster]
  );

  const departmentList = useMemo(() => {
    const set = new Set(rawEmployees.map((e) => e.department).filter(Boolean));
    return Array.from(set).sort();
  }, [rawEmployees]);

  const handleUpdateCell = useCallback((employeeId: string, dateString: string, newShiftCode: string) => {
    setManualCellOverrides((prev) => ({
      ...prev,
      [`${employeeId}_${dateString}`]: newShiftCode,
    }));
  }, []);

  const currentDisplayList = activeTab === "schedules" ? scheduledEmployees : unscheduledEmployees;

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === currentDisplayList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentDisplayList.map((e) => e.id)));
    }
  }, [selectedIds.size, currentDisplayList]);

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const dateRangeLabel = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return `01/${String(month + 1).padStart(2, "0")}/${year} - ${String(totalDays).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;
  }, [currentDate]);

  return {
    currentDate,
    dateRangeLabel,
    prevMonth,
    nextMonth,
    dayColumns,
    availableShifts,
    scheduledEmployees,
    unscheduledEmployees,
    departmentList,
    search,
    setSearch,
    filterDept,
    setFilterDept,
    activeTab,
    setActiveTab,
    selectedIds,
    toggleSelectAll,
    toggleSelectOne,
    loading,
    handleUpdateCell,
    loadMatrixData,
  };
}
