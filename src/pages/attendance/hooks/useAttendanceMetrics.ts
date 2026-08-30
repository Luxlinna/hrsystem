import { useMemo } from "react";
import type { Employee, AttendanceRecord, WorkLocation, EmployeeSummaryItem, MatrixDay } from "../types";
import { calcHoursNum } from "../constants";

interface UseAttendanceMetricsProps {
  records: AttendanceRecord[];
  employees: Employee[];
  workLocations: WorkLocation[];
  activeScopeRecords: AttendanceRecord[];
  todayYMD: string;
  rosterDate: string;
  matrixMonth: string;
  filterDepartment: string;
  searchQuery: string;
}

export function useAttendanceMetrics({
  records,
  employees,
  workLocations,
  activeScopeRecords,
  todayYMD,
  rosterDate,
  matrixMonth,
  filterDepartment,
  searchQuery,
}: UseAttendanceMetricsProps) {
  const presentCount = useMemo(
    () => activeScopeRecords.filter((r) => r.status === "ontime" || r.status === "present" || r.status === "remote").length,
    [activeScopeRecords]
  );
  const lateCount = useMemo(() => activeScopeRecords.filter((r) => r.status === "late").length, [activeScopeRecords]);
  const absentCount = useMemo(() => activeScopeRecords.filter((r) => r.status === "absent").length, [activeScopeRecords]);
  const remoteCount = useMemo(() => activeScopeRecords.filter((r) => r.status === "remote").length, [activeScopeRecords]);
  const workingNow = useMemo(
    () => records.filter((r) => r.date === todayYMD && r.clock_in && !r.clock_out).length,
    [records, todayYMD]
  );

  const todayByWorkSite = useMemo(() => {
    if (workLocations.length === 0) return [];
    const todayRecs = records.filter((r) => r.date === todayYMD);
    return workLocations.map((wl) => {
      const siteRecs = todayRecs.filter((r) => r.work_location_id === wl.id);
      const present = siteRecs.filter((r) => r.status === "ontime" || r.status === "present" || r.status === "late" || r.status === "remote").length;
      const workingNowHere = siteRecs.filter((r) => r.clock_in && !r.clock_out).length;
      return { ...wl, present, workingNowHere, total: siteRecs.length };
    });
  }, [workLocations, records, todayYMD]);

  const rosterRecords = useMemo(() => records.filter((r) => r.date === rosterDate), [records, rosterDate]);

  const employeeSummary: EmployeeSummaryItem[] = useMemo(() => {
    return employees.map((emp) => {
      const empRecords = activeScopeRecords.filter((r) => r.employee_id === emp.id);
      const present = empRecords.filter((r) => r.status === "ontime" || r.status === "present" || r.status === "remote").length;
      const late = empRecords.filter((r) => r.status === "late").length;
      const absent = empRecords.filter((r) => r.status === "absent").length;
      const remote = empRecords.filter((r) => r.status === "remote").length;
      const totalHours = empRecords.reduce((acc, r) => acc + calcHoursNum(r.clock_in, r.clock_out), 0);
      const totalLateMinutes = empRecords.reduce((acc, r) => acc + (r.late_minutes || 0), 0);
      const totalDays = empRecords.length;
      const attendanceRate = totalDays > 0 ? Math.round(((present + late) / totalDays) * 100) : 0;
      const lastSeen = empRecords[0]?.date || "—";
      const rosterRecord = rosterRecords.find((r) => r.employee_id === emp.id);

      return {
        ...emp,
        present,
        late,
        absent,
        remote,
        totalHours: +totalHours.toFixed(1),
        totalLateMinutes,
        totalDays,
        attendanceRate,
        lastSeen,
        rosterRecord,
      };
    });
  }, [employees, activeScopeRecords, rosterRecords]);

  const filteredSummary = useMemo(() => {
    return employeeSummary.filter((e) => {
      if (filterDepartment !== "all" && e.department !== filterDepartment) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = `${e.first_name} ${e.last_name}`.toLowerCase();
        const roleName = (e.role || "").toLowerCase();
        const dept = (e.department || "").toLowerCase();
        if (!name.includes(q) && !roleName.includes(q) && !dept.includes(q)) return false;
      }
      return true;
    });
  }, [employeeSummary, filterDepartment, searchQuery]);

  const matrixDays: MatrixDay[] = useMemo(() => {
    if (!matrixMonth) return [];
    const [yStr, mStr] = matrixMonth.split("-");
    const year = parseInt(yStr);
    const month = parseInt(mStr);
    const totalDays = new Date(year, month, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const dObj = new Date(year, month - 1, dayNum);
      return {
        dayNum,
        dateStr,
        dayName: dObj.toLocaleDateString("en-US", { weekday: "narrow" }),
        isWeekend: dObj.getDay() === 0 || dObj.getDay() === 6,
      };
    });
  }, [matrixMonth]);

  return {
    presentCount,
    lateCount,
    absentCount,
    remoteCount,
    workingNow,
    todayByWorkSite,
    employeeSummary,
    filteredSummary,
    matrixDays,
  };
}
