import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { toYMD } from "@/lib/date";
import type { AttendanceRecord, AttendanceTabKey, DatePreset, Employee, ViewMode } from "../types";
import { computeDateRangeBounds } from "./attendanceDateRangeUtils";
import { matchAttendanceRecord } from "./attendanceFilterMatcher";
import { exportAttendanceToCSV } from "./attendanceExportCSV";
import { expandRecordsToCalendarDays } from "./attendanceCalendarExpansion";

export function useAttendanceFilters(records: AttendanceRecord[], employees: Employee[], todayYMD: string) {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSubTab = searchParams.get("subTab") as AttendanceTabKey | null;
  const [activeTab, setActiveTabState] = useState<AttendanceTabKey>(
    urlSubTab === "records" || urlSubTab === "live" || urlSubTab === "matrix" || urlSubTab === "summary"
      ? urlSubTab
      : "records"
  );

  const setActiveTab = useCallback(
    (tab: AttendanceTabKey) => {
      setActiveTabState(tab);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (tab === "records") {
          next.delete("subTab");
        } else {
          next.set("subTab", tab);
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const [viewModeState, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hrm_attendance_view_mode");
      if (saved === "table" || saved === "cards") return "table";
    }
    return "table";
  });

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== "undefined") localStorage.setItem("hrm_attendance_view_mode", mode);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterEmployeeId, setFilterEmployeeId] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterEmploymentType, setFilterEmploymentType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterWorkLocation, setFilterWorkLocation] = useState("all");
  const [pageSize, setPageSize] = useState(10);

  const parsedPage = parseInt(searchParams.get("page") || "1", 10);
  const [page, setPageState] = useState<number>(!isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1);

  const setPage = useCallback(
    (newPageOrFn: number | ((prev: number) => number)) => {
      setPageState((prev) => {
        const resolved = typeof newPageOrFn === "function" ? newPageOrFn(prev) : newPageOrFn;
        const validPage = Math.max(1, resolved);
        setSearchParams((sp) => {
          const next = new URLSearchParams(sp);
          if (validPage > 1) {
            next.set("page", String(validPage));
          } else {
            next.delete("page");
          }
          return next;
        });
        return validPage;
      });
    },
    [setSearchParams]
  );

  const isInitialMountRef = useRef(true);

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
    const rawMatches = records.filter((r) =>
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

    const query = searchQuery.trim().toLowerCase();
    const matchedEmps = employees.filter((e) => {
      if (filterEmployeeId !== "all" && e.id !== filterEmployeeId) return false;
      if (filterDepartment !== "all" && e.department !== filterDepartment) return false;
      if (filterRole !== "all" && e.role !== filterRole) return false;
      if (filterEmploymentType !== "all" && (e.employment_type || e.contract_type) !== filterEmploymentType) return false;
      if (query) {
        const full = `${e.first_name} ${e.last_name} ${e.employee_code || ""}`.toLowerCase();
        if (!full.includes(query)) return false;
      }
      return true;
    });

    if (matchedEmps.length > 0 && matchedEmps.length <= 15 && dateRangeBounds) {
      return expandRecordsToCalendarDays(rawMatches, matchedEmps, dateRangeBounds, todayYMD);
    }

    return rawMatches;
  }, [records, employees, filterStatus, filterDepartment, filterRole, filterEmploymentType, filterEmployeeId, filterWorkLocation, dateRangeBounds, searchQuery, todayYMD]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRecords = useMemo(
    () => filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredRecords, safePage, pageSize]
  );

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    setPage(1);
  }, [searchQuery, filterDepartment, filterRole, filterEmploymentType, filterEmployeeId, filterStatus, filterWorkLocation, filterDatePreset, fromDate, toDate, singleDate, pageSize, setPage]);

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
