import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import { DAY_NAMES_SHORT, CAMBODIA_OCTOBER_HOLIDAYS } from "./matrixConstants";
import { useMatrixDataLoader } from "./useMatrixDataLoader";
import { buildRosterRows } from "./matrixRosterBuilder";
import { buildAvailableShiftList, deriveShiftCode } from "./matrixShiftHelper";
import type { DayColumn, EmployeeRosterRow } from "./types";

export function useAttendanceScheduleMatrix() {
  const { targetBranch, isSuperAdmin } = useBranchScope();

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 8, 1));
  const [activeTab, setActiveTab] = useState<"schedules" | "no_schedules">("schedules");
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterWorkLocation, setFilterWorkLocation] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterEmploymentType, setFilterEmploymentType] = useState("all");
  const [filterEmployeeLevel, setFilterEmployeeLevel] = useState("");

  // Lookup data for filter flyout
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [workLocations, setWorkLocations] = useState<{ id: string; name: string; branch_id: string }[]>([]);
  const [positionList, setPositionList] = useState<string[]>([]);
  const [employeeTypeList, setEmployeeTypeList] = useState<string[]>([]);
  const [employeeLevelList, setEmployeeLevelList] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("branches").select("id, name").is("deleted_at", null).order("name").then(({ data }) => {
      if (data) setBranches(data);
    });
    supabase.from("work_locations").select("id, name, branch_id").is("deleted_at", null).order("name").then(({ data }) => {
      if (data) setWorkLocations(data);
    });
    const loadTable = async (tbl: string, setter: (v: string[]) => void, fallback: string[] = []) => {
      const { data } = await supabase.from(tbl).select("name").is("deleted_at", null).order("sort_order", { ascending: true }).order("name");
      if (data) {
        const vals = Array.from(new Set(data.map((d: any) => d.name).filter(Boolean)));
        setter(vals.length > 0 ? vals : fallback);
      } else if (fallback.length > 0) {
        setter(fallback);
      }
    };
    loadTable("positions", setPositionList);
    loadTable("employee_types", setEmployeeTypeList, ["FULL-TIME", "HOD", "INTERNSHIP", "PART-TIME"]);
    loadTable("employee_levels", setEmployeeLevelList, ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Manager", "Director", "Executive"]);
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
      if (filterDept && filterDept !== "all") {
        const deptList = filterDept.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
        if (deptList.length > 0 && !deptList.includes((row.department || "").toLowerCase())) return false;
      }
      if (filterWorkLocation && filterWorkLocation !== "all") {
        const locList = filterWorkLocation.split(",").map((s) => s.trim()).filter(Boolean);
        if (locList.length > 0) {
          const emp = rawEmployees.find((e) => e.id === row.id);
          const matched = locList.some((s) => {
            if (s.startsWith("site:")) return emp?.default_work_location_id === s.substring(5);
            return emp?.branch_id === s;
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
  }, [rosterRows, search, filterDept, filterWorkLocation, filterRole, filterEmploymentType, filterEmployeeLevel, rawEmployees]);

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
