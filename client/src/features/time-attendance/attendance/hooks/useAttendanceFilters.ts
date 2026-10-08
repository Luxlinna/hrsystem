import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { toYMD } from "@/lib/date";
import type { AttendanceRecord, AttendanceTabKey, DatePreset, Employee, ViewMode } from "../types";
import { computeDateRangeBounds } from "./attendanceDateRangeUtils";
import { matchAttendanceRecord } from "./attendanceFilterMatcher";
import { exportAttendanceToCSV } from "./attendanceExportCSV";
import { expandRecordsToCalendarDays } from "./attendanceCalendarExpansion";

const ATTENDANCE_FILTERS_STORAGE_KEY = "hrm_attendance_filters_v1";

interface SavedAttendanceFilters {
  filterBranch?: string;
  filterWorkLocation?: string;
  filterDivision?: string;
  filterDepartment?: string;
  filterRole?: string;
  filterEmploymentType?: string;
  filterEmployeeLevel?: string;
  filterStatus?: string;
  pageSize?: number;
}

const getSavedAttendanceFilters = (): SavedAttendanceFilters | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ATTENDANCE_FILTERS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      filterBranch: typeof parsed.filterBranch === "string" ? parsed.filterBranch : "",
      filterWorkLocation: typeof parsed.filterWorkLocation === "string" ? parsed.filterWorkLocation : "all",
      filterDivision: typeof parsed.filterDivision === "string" ? parsed.filterDivision : "all",
      filterDepartment: typeof parsed.filterDepartment === "string" ? parsed.filterDepartment : "all",
      filterRole: typeof parsed.filterRole === "string" ? parsed.filterRole : "all",
      filterEmploymentType: typeof parsed.filterEmploymentType === "string" ? parsed.filterEmploymentType : "all",
      filterEmployeeLevel: typeof parsed.filterEmployeeLevel === "string" ? parsed.filterEmployeeLevel : "",
      filterStatus: typeof parsed.filterStatus === "string" ? parsed.filterStatus : "all",
      pageSize: typeof parsed.pageSize === "number" && parsed.pageSize > 0 ? parsed.pageSize : 10,
    };
  } catch {
    return null;
  }
};

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
      if (saved === "table" || saved === "cards") return saved as ViewMode;
    }
    return "table";
  });

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== "undefined") localStorage.setItem("hrm_attendance_view_mode", mode);
  }, []);

  const savedFilters = useMemo(() => getSavedAttendanceFilters(), []);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState<string>(() => savedFilters?.filterBranch ?? "");
  const [filterDivision, setFilterDivision] = useState<string>(() => savedFilters?.filterDivision ?? "all");
  const [filterDepartment, setFilterDepartment] = useState<string>(() => savedFilters?.filterDepartment ?? "all");
  const [filterEmployeeId, setFilterEmployeeId] = useState("all");
  const [filterRole, setFilterRole] = useState<string>(() => savedFilters?.filterRole ?? "all");
  const [filterEmploymentType, setFilterEmploymentType] = useState<string>(() => savedFilters?.filterEmploymentType ?? "all");
  const [filterEmployeeLevel, setFilterEmployeeLevel] = useState<string>(() => savedFilters?.filterEmployeeLevel ?? "");
  const [filterStatus, setFilterStatus] = useState<string>(() => savedFilters?.filterStatus ?? "all");
  const [filterWorkLocation, setFilterWorkLocation] = useState<string>(() => savedFilters?.filterWorkLocation ?? "all");
  const [pageSize, setPageSize] = useState<number>(() => {
    if (savedFilters?.pageSize && [10, 20, 50, 100, 500, 999999].includes(savedFilters.pageSize)) {
      return savedFilters.pageSize;
    }
    if (typeof window !== "undefined") {
      const savedPageSize = localStorage.getItem("hrm_attendance_page_size");
      if (savedPageSize) {
        const parsed = Number(savedPageSize);
        if ([10, 20, 50, 100, 500, 999999].includes(parsed)) return parsed;
      }
    }
    return 10;
  });

  // Persist filter selections to localStorage so they remain fixed until explicitly updated or reset
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const payload: SavedAttendanceFilters = {
        filterBranch,
        filterWorkLocation,
        filterDivision,
        filterDepartment,
        filterRole,
        filterEmploymentType,
        filterEmployeeLevel,
        filterStatus,
        pageSize,
      };
      localStorage.setItem(ATTENDANCE_FILTERS_STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem("hrm_attendance_page_size", String(pageSize));
    } catch {
      // ignore
    }
  }, [
    filterBranch,
    filterWorkLocation,
    filterDivision,
    filterDepartment,
    filterRole,
    filterEmploymentType,
    filterEmployeeLevel,
    filterStatus,
    pageSize,
  ]);

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
        filterEmployeeLevel,
        filterEmployeeId,
        filterWorkLocation,
        filterBranch,
        dateBounds: dateRangeBounds,
        searchQuery,
      })
    );

    const query = searchQuery.trim().toLowerCase();
    const matchedEmps = employees.filter((e) => {
      if (filterEmployeeId !== "all" && e.id !== filterEmployeeId) return false;
      if (filterBranch) {
        const branchList = filterBranch.split(",").map((s) => s.trim()).filter(Boolean);
        if (branchList.length > 0) {
          const empBranchId = e.branch_id || "";
          const empBranchName = (e.branches?.name || "").toLowerCase();
          const matched = branchList.some((s) => {
            const sLower = s.toLowerCase();
            return empBranchId === s || empBranchName === sLower || empBranchName.includes(sLower);
          });
          if (!matched) return false;
        }
      }
      if (filterWorkLocation && filterWorkLocation !== "all") {
        const locList = filterWorkLocation.split(",").map((s) => s.trim()).filter(Boolean);
        if (locList.length > 0) {
          const empLocId = e.default_work_location_id || "";
          const empSite = (e.site || "").toLowerCase();
          const matched = locList.some((s) => {
            const rawId = s.startsWith("site:") ? s.substring(5) : s;
            return empLocId === rawId || empSite === rawId.toLowerCase() || empSite.includes(rawId.toLowerCase());
          });
          if (!matched) return false;
        }
      }
      if (filterDivision && filterDivision !== "all") {
        const divList = filterDivision.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
        if (divList.length > 0 && !divList.includes((e.division || "").toLowerCase())) return false;
      }
      if (filterDepartment !== "all") {
        const deptsList = filterDepartment.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
        if (deptsList.length > 0 && !deptsList.includes((e.department || "").toLowerCase())) return false;
      }
      if (filterRole !== "all") {
        const rolesList = filterRole.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
        if (rolesList.length > 0 && !rolesList.some((role) => (e.role || "").toLowerCase() === role || (e.role || "").toLowerCase().includes(role))) return false;
      }
      if (filterEmploymentType !== "all") {
        const typesList = filterEmploymentType.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
        const empType = (e.employment_type || e.contract_type || "").toLowerCase();
        if (typesList.length > 0 && !typesList.some((t) => empType === t || empType.includes(t))) return false;
      }
      if (filterEmployeeLevel) {
        const levelList = filterEmployeeLevel.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
        const empLevel = ((e as any).employee_level || "").toLowerCase();
        if (levelList.length > 0 && !levelList.some((l) => empLevel === l || empLevel.includes(l))) return false;
      }
      if (query) {
        const full = `${e.display_name || ""} ${e.full_name || ""} ${e.first_name || ""} ${e.last_name || ""} ${e.employee_code || ""}`.toLowerCase();
        if (!full.includes(query)) return false;
      }
      return true;
    });

    if (matchedEmps.length > 0 && matchedEmps.length <= 15 && dateRangeBounds) {
      return expandRecordsToCalendarDays(rawMatches, matchedEmps, dateRangeBounds, todayYMD);
    }

    return rawMatches;
  }, [records, employees, filterStatus, filterDivision, filterDepartment, filterRole, filterEmploymentType, filterEmployeeLevel, filterEmployeeId, filterWorkLocation, filterBranch, dateRangeBounds, searchQuery, todayYMD]);

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
  }, [searchQuery, filterBranch, filterDivision, filterDepartment, filterRole, filterEmploymentType, filterEmployeeLevel, filterEmployeeId, filterStatus, filterWorkLocation, filterDatePreset, fromDate, toDate, singleDate, pageSize, setPage]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages, setPage]);

  const changeRosterDate = useCallback((offsetDays: number) => {
    const d = new Date(`${rosterDate}T00:00:00`);
    d.setDate(d.getDate() + offsetDays);
    setRosterDate(toYMD(d));
  }, [rosterDate]);

  const handleExportCSV = useCallback(() => {
    exportAttendanceToCSV(filteredRecords, dateRangeBounds);
  }, [filteredRecords, dateRangeBounds]);

  const isFiltered = Boolean(
    searchQuery ||
    (filterBranch && filterBranch !== "all") ||
    (filterDivision && filterDivision !== "all") ||
    (filterDepartment && filterDepartment !== "all") ||
    (filterRole && filterRole !== "all") ||
    (filterEmploymentType && filterEmploymentType !== "all") ||
    Boolean(filterEmployeeLevel) ||
    (filterEmployeeId && filterEmployeeId !== "all") ||
    (filterStatus && filterStatus !== "all") ||
    (filterWorkLocation && filterWorkLocation !== "all") ||
    (filterDatePreset && filterDatePreset !== "all")
  );

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setFilterBranch("");
    setFilterDivision("all");
    setFilterDepartment("all");
    setFilterRole("all");
    setFilterEmploymentType("all");
    setFilterEmployeeLevel("");
    setFilterEmployeeId("all");
    setFilterStatus("all");
    setFilterWorkLocation("all");
    setFilterDatePreset("all");
    setFromDate("");
    setToDate("");
    setSingleDate(todayYMD);
    if (typeof window !== "undefined") {
      localStorage.removeItem(ATTENDANCE_FILTERS_STORAGE_KEY);
    }
  }, [todayYMD]);

  const divisions = useMemo(
    () => Array.from(new Set(employees.map((e) => e.division).filter(Boolean))),
    [employees]
  );

  return {
    activeTab, setActiveTab, viewMode: viewModeState, setViewMode, searchQuery, setSearchQuery,
    filterBranch, setFilterBranch,
    filterDivision, setFilterDivision, divisions,
    filterDepartment, setFilterDepartment, filterRole, setFilterRole, roles,
    filterEmploymentType, setFilterEmploymentType, employmentTypes,
    filterEmployeeLevel, setFilterEmployeeLevel,
    filterEmployeeId, setFilterEmployeeId,
    filterStatus, setFilterStatus, filterWorkLocation, setFilterWorkLocation,
    pageSize, setPageSize, page, setPage, filterDatePreset, setFilterDatePreset,
    fromDate, setFromDate, toDate, setToDate, singleDate, setSingleDate,
    rosterDate, setRosterDate, matrixMonth, setMatrixMonth, departments,
    dateRangeBounds, activeScopeRecords, filteredRecords, pagedRecords,
    totalPages, changeRosterDate, handleExportCSV, isFiltered, handleResetFilters,
  };
}
