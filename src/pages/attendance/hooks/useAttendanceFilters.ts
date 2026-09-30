import { useState, useMemo, useCallback, useEffect } from "react";
import { toYMD } from "@/lib/date";
import type { AttendanceRecord, AttendanceTabKey, DatePreset, Employee, ViewMode } from "../types";
import { computeDateRangeBounds } from "./attendanceDateRangeUtils";
import { matchAttendanceRecord } from "./attendanceFilterMatcher";
import { exportAttendanceToCSV } from "./attendanceExportCSV";

export function useAttendanceFilters(records: AttendanceRecord[], employees: Employee[], todayYMD: string) {
  const [activeTab, setActiveTab] = useState<AttendanceTabKey>("records");
  const [viewModeState, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hrm_attendance_view_mode");
      if (saved === "table" || saved === "cards") return "table";
    }
    return "table";
  });

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("hrm_attendance_view_mode", mode);
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterEmployeeId, setFilterEmployeeId] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterEmploymentType, setFilterEmploymentType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterWorkLocation, setFilterWorkLocation] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [filterDatePreset, setFilterDatePreset] = useState<DatePreset>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [singleDate, setSingleDate] = useState(toYMD(new Date()));
  const [rosterDate, setRosterDate] = useState(toYMD(new Date()));

  const now = new Date();
  const [matrixMonth, setMatrixMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  const departments = useMemo(() => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))).sort(), [employees]);
  const roles = useMemo(() => Array.from(new Set(employees.map((e) => e.role).filter(Boolean))).sort(), [employees]);
  const employmentTypes = useMemo(() => Array.from(new Set(employees.map((e) => e.employment_type || e.contract_type).filter(Boolean) as string[])).sort(), [employees]);

  const dateRangeBounds = useMemo(
    () => computeDateRangeBounds(filterDatePreset, todayYMD, singleDate, fromDate, toDate),
    [filterDatePreset, singleDate, fromDate, toDate, todayYMD]
  );

  const activeScopeRecords = useMemo(() => {
    if (dateRangeBounds) {
      return records.filter((r) => r.date >= dateRangeBounds.start && r.date <= dateRangeBounds.end);
    }
    return records;
  }, [records, dateRangeBounds]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) =>
      matchAttendanceRecord(r, {
        filterStatus,
        filterDepartment,
        filterRole,
        filterEmploymentType,
        filterEmployeeId,
        filterWorkLocation,
        dateBounds: dateRangeBounds,
        searchQuery,
      })
    );
  }, [records, filterStatus, filterDepartment, filterRole, filterEmploymentType, filterEmployeeId, filterWorkLocation, dateRangeBounds, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRecords = useMemo(
    () => filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredRecords, safePage, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterDepartment, filterRole, filterEmploymentType, filterEmployeeId, filterStatus, filterWorkLocation, filterDatePreset, fromDate, toDate, singleDate, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const changeRosterDate = useCallback((offsetDays: number) => {
    const d = new Date(`${rosterDate}T00:00:00`);
    d.setDate(d.getDate() + offsetDays);
    setRosterDate(toYMD(d));
  }, [rosterDate]);

  const handleExportCSV = useCallback(() => {
    exportAttendanceToCSV(filteredRecords, dateRangeBounds);
  }, [filteredRecords, dateRangeBounds]);

  const isFiltered = Boolean(
    searchQuery || filterDepartment !== "all" || filterRole !== "all" || filterEmploymentType !== "all" ||
    filterEmployeeId !== "all" || filterStatus !== "all" || filterWorkLocation !== "all" || filterDatePreset !== "all"
  );

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setFilterDepartment("all");
    setFilterRole("all");
    setFilterEmploymentType("all");
    setFilterEmployeeId("all");
    setFilterStatus("all");
    setFilterWorkLocation("all");
    setFilterDatePreset("all");
    setFromDate("");
    setToDate("");
    setSingleDate(todayYMD);
  }, [todayYMD]);

  return {
    activeTab, setActiveTab, viewMode: viewModeState, setViewMode, searchQuery, setSearchQuery,
    filterDepartment, setFilterDepartment, filterRole, setFilterRole, roles,
    filterEmploymentType, setFilterEmploymentType, employmentTypes,
    filterEmployeeId, setFilterEmployeeId,
    filterStatus, setFilterStatus, filterWorkLocation, setFilterWorkLocation,
    pageSize, setPageSize, page, setPage, filterDatePreset, setFilterDatePreset,
    fromDate, setFromDate, toDate, setToDate, singleDate, setSingleDate,
    rosterDate, setRosterDate, matrixMonth, setMatrixMonth, departments,
    dateRangeBounds, activeScopeRecords, filteredRecords, pagedRecords,
    totalPages, changeRosterDate, handleExportCSV, isFiltered, handleResetFilters,
  };
}
