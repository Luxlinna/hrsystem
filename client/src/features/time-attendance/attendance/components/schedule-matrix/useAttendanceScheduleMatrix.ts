import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import { attendanceCache } from "../../services/attendanceCacheService";
import { DAY_NAMES_SHORT, CAMBODIA_OCTOBER_HOLIDAYS } from "./matrixConstants";
import { useMatrixDataLoader } from "./useMatrixDataLoader";
import { buildRosterRows } from "./matrixRosterBuilder";
import { buildAvailableShiftList, deriveShiftCode } from "./matrixShiftHelper";
import type { DayColumn, EmployeeRosterRow } from "./types";

export function useAttendanceScheduleMatrix() {
  const { targetBranch, isSuperAdmin, visibleBranches } = useBranchScope();

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 8, 1));
  const [activeTab, setActiveTab] = useState<"schedules" | "no_schedules">("schedules");
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterWorkLocation, setFilterWorkLocation] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterEmploymentType, setFilterEmploymentType] = useState("all");
  const [filterEmployeeLevel, setFilterEmployeeLevel] = useState("");

  // Lookup data for filter flyout
  const [branches, setBranches] = useState<{ id: string; name: string }[]>(() => {
    const cached = attendanceCache.getCachedBranches();
    if (cached && cached.length > 0) return cached;
    if (visibleBranches && visibleBranches.length > 0) return visibleBranches.map((b) => ({ id: b.id, name: b.name }));
    return [];
  });
  const [workLocations, setWorkLocations] = useState<{ id: string; name: string; branch_id: string }[]>(() => {
    return (attendanceCache.getCachedWorkLocations() as any) || [];
  });
  const [positionList, setPositionList] = useState<string[]>(() => attendanceCache.getCachedTableValues("positions") || []);
  const [employeeTypeList, setEmployeeTypeList] = useState<string[]>(["FULL-TIME", "HOD", "INTERNSHIP", "PART-TIME"]);
  const [employeeLevelList, setEmployeeLevelList] = useState<string[]>(() => attendanceCache.getCachedTableValues("employee_levels") || ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Manager", "Director", "Executive"]);

  useEffect(() => {
    attendanceCache.getBranches().then((data) => {
      if (data && data.length > 0) setBranches(data);
    });
    attendanceCache.getWorkLocations().then((data) => {
      if (data && data.length > 0) setWorkLocations(data as any);
    });
    attendanceCache.getTableValues("positions", []).then((data) => {
      if (data && data.length > 0) setPositionList(data);
    });
    attendanceCache.getTableValues("employee_levels", ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Manager", "Director", "Executive"]).then((data) => {
      if (data && data.length > 0) setEmployeeLevelList(data);
    });
  }, []);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [manualCellOverrides, setManualCellOverrides] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("hrm_matrix_cell_overrides_v1") || "{}"); } catch { return {}; }
  });

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
  } = useMatrixDataLoader(targetBranch, currentDate, isSuperAdmin);

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

  const prevMonth = useCallback(() => setCurrentDate((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1)), []);
  const nextMonth = useCallback(() => setCurrentDate((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1)), []);

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
      if (filterBranch) {
        const branchList = filterBranch.split(",").map((s) => s.trim()).filter(Boolean);
        if (branchList.length > 0) {
          const emp = rawEmployees.find((e) => e.id === row.id);
          const empBranchId = emp?.branch_id || "";
          const empBranchName = (emp?.branches?.name || "").toLowerCase();
          const matched = branchList.some((s) => empBranchId === s || empBranchName === s.toLowerCase());
          if (!matched) return false;
        }
      }
      if (filterDept && filterDept !== "all") {
        const deptList = filterDept.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
        if (deptList.length > 0 && !deptList.includes((row.department || "").toLowerCase())) return false;
      }
      if (filterWorkLocation && filterWorkLocation !== "all") {
        const locList = filterWorkLocation.split(",").map((s) => s.trim()).filter(Boolean);
        if (locList.length > 0) {
          const emp = rawEmployees.find((e) => e.id === row.id);
          const empLocId = emp?.default_work_location_id || "";
          const empBranchId = emp?.branch_id || "";
          const empSite = ((emp as any)?.site || "").toLowerCase();
          const matched = locList.some((s) => {
            if (s.startsWith("site:")) return empLocId === s.substring(5);
            return empLocId === s || empBranchId === s || empSite === s.toLowerCase();
          });
          if (!matched) return false;
        }
      }
      if (filterRole && filterRole !== "all") {
        const roleList = filterRole.split(",").map((r) => r.trim().toLowerCase()).filter(Boolean);
        if (roleList.length > 0 && !roleList.some((r) => (row.role || "").toLowerCase().includes(r))) return false;
      }
      if (filterEmploymentType && filterEmploymentType !== "all") {
        const emp = rawEmployees.find((e) => e.id === row.id);
        const typeList = filterEmploymentType.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
        const empType = (emp?.employment_type || emp?.contract_type || "").toLowerCase().replace(/[-_]/g, " ");
        if (typeList.length > 0 && !typeList.some((t) => empType.includes(t.replace(/[-_]/g, " ")))) return false;
      }
      if (filterEmployeeLevel) {
        const emp = rawEmployees.find((e) => e.id === row.id);
        const lvlList = filterEmployeeLevel.split(",").map((l) => l.trim().toLowerCase()).filter(Boolean);
        const empLevel = (emp?.employee_level || "").toLowerCase();
        if (lvlList.length > 0 && !lvlList.some((l) => empLevel.includes(l))) return false;
      }
      return true;
    });
  }, [rosterRows, search, filterBranch, filterDept, filterWorkLocation, filterRole, filterEmploymentType, filterEmployeeLevel, rawEmployees]);

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
    setManualCellOverrides((prev) => {
      const next = { ...prev, [`${employeeId}_${dateString}`]: newShiftCode };
      try {
        localStorage.setItem("hrm_matrix_cell_overrides_v1", JSON.stringify(next));
      } catch {
        // ignore localStorage errors
      }
      return next;
    });
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
    branches,
    workLocations,
    positionList,
    employeeTypeList,
    employeeLevelList,
    search,
    setSearch,
    filterBranch,
    setFilterBranch,
    filterDept,
    setFilterDept,
    filterWorkLocation,
    setFilterWorkLocation,
    filterRole,
    setFilterRole,
    filterEmploymentType,
    setFilterEmploymentType,
    filterEmployeeLevel,
    setFilterEmployeeLevel,
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
