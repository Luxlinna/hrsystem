import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import type { Employee, AccountStatus, VisibleColumns, SortField, SortDirection, ViewMode, EmployeeStats } from "../types";
import { INITIAL_VISIBLE_COLUMNS, COLUMN_WIDTHS, getJobStatusBadge } from "../constants";
import { exportEmployeesCSV } from "../exportUtils";
import { matchEmployeeSearch, compareEmployees } from "../searchUtils";

interface UseEmployeesFiltersProps {
  employees: Employee[];
  managerEmails: Set<string>;
  accountStatus: Record<string, AccountStatus>;
  canManage: boolean;
  workSites?: { id: string; name: string; branch_id: string; is_default?: boolean }[];
  currentBranchName?: string;
  isLineManager?: boolean;
  isEmployee?: boolean;
  currentEmployee?: any | null;
}

function matchEmployeeDate(joinDateStr?: string | null, dateOption?: string): boolean {
  if (!dateOption || dateOption === "all") return true;
  if (!joinDateStr) return false;

  const joinDate = new Date(joinDateStr);
  if (isNaN(joinDate.getTime())) return false;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (dateOption === "today") {
    return joinDate >= todayStart && joinDate <= todayEnd;
  }

  if (dateOption === "this_week") {
    const dayOfWeek = todayStart.getDay();
    const startOfWeek = new Date(todayStart);
    startOfWeek.setDate(todayStart.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return joinDate >= startOfWeek && joinDate <= endOfWeek;
  }

  if (dateOption === "last_week") {
    const dayOfWeek = todayStart.getDay();
    const startOfThisWeek = new Date(todayStart);
    startOfThisWeek.setDate(todayStart.getDate() - dayOfWeek);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
    endOfLastWeek.setHours(23, 59, 59, 999);
    return joinDate >= startOfLastWeek && joinDate <= endOfLastWeek;
  }

  if (dateOption === "this_month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return joinDate >= startOfMonth && joinDate <= endOfMonth;
  }

  if (dateOption === "last_month") {
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return joinDate >= startOfLastMonth && joinDate <= endOfLastMonth;
  }

  if (dateOption === "this_year") {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return joinDate >= startOfYear && joinDate <= endOfYear;
  }

  if (dateOption === "last_year") {
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    return joinDate >= startOfLastYear && joinDate <= endOfLastYear;
  }

  if (dateOption.startsWith("custom:")) {
    const parts = dateOption.split(":");
    const startStr = parts[1];
    const endStr = parts[2];
    if (startStr) {
      const s = new Date(startStr);
      s.setHours(0, 0, 0, 0);
      if (joinDate < s) return false;
    }
    if (endStr) {
      const e = new Date(endStr);
      e.setHours(23, 59, 59, 999);
      if (joinDate > e) return false;
    }
    return true;
  }

  return true;
}

function matchEmployeeContract(contractType?: string | null, selected?: string | string[]): boolean {
  if (!selected) return true;
  if (Array.isArray(selected)) {
    if (selected.length === 0) return true;
    if (!contractType) return false;
    const c = contractType.toLowerCase();
    return selected.some((s) => {
      const sLower = s.toLowerCase();
      if (sLower === "all") return true;
      if (sLower.includes("probation")) return c.includes("probation");
      if (sLower.includes("udc") || sLower.includes("permanent")) return c.includes("udc") || c.includes("permanent");
      if (sLower.includes("fdc")) return c.includes("fdc") || c.includes(sLower);
      return c.includes(sLower) || sLower.includes(c);
    });
  }

  if (selected === "All" || selected === "") return true;
  if (!contractType) return false;
  const c = contractType.toLowerCase();
  const s = selected.toLowerCase();
  if (s === "udc") return c.includes("udc") || c.includes("permanent");
  if (s === "fdc") return c.includes("fdc") || c.includes("fixed") || c.includes("year");
  if (s === "probation") return c.includes("probation");
  return c.includes(s);
}

function matchEmployeeJobStatus(status?: string | null, selected?: string[]): boolean {
  if (!selected || selected.length === 0) return true;
  const { jobStatus } = getJobStatusBadge(status);
  return selected.some((s) => {
    const sLower = s.toLowerCase().trim();
    if (sLower === "all") return true;
    return sLower === jobStatus.toLowerCase();
  });
}

const EMPLOYEES_FILTERS_STORAGE_KEY = "hrm_employees_filters_v1";

interface SavedEmployeesFilters {
  filterDept?: string;
  filterStatus?: string;
  filterJobStatus?: string[];
  filterRole?: string;
  filterEmployeeType?: string;
  filterEmployeeLevel?: string;
  filterBranch?: string;
  filterWorkLocation?: string;
  filterAccount?: string;
  filterDateOption?: string;
  filterContractType?: string[];
  pageSize?: number;
}

const getSavedEmployeesFilters = (): SavedEmployeesFilters | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EMPLOYEES_FILTERS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      filterDept: typeof parsed.filterDept === "string" ? parsed.filterDept : "",
      filterStatus: typeof parsed.filterStatus === "string" ? parsed.filterStatus : "",
      filterJobStatus: Array.isArray(parsed.filterJobStatus) ? parsed.filterJobStatus : [],
      filterRole: typeof parsed.filterRole === "string" ? parsed.filterRole : "",
      filterEmployeeType: typeof parsed.filterEmployeeType === "string" ? parsed.filterEmployeeType : "",
      filterEmployeeLevel: typeof parsed.filterEmployeeLevel === "string" ? parsed.filterEmployeeLevel : "",
      filterBranch: typeof parsed.filterBranch === "string" ? parsed.filterBranch : "",
      filterWorkLocation: typeof parsed.filterWorkLocation === "string" ? parsed.filterWorkLocation : "all",
      filterAccount: typeof parsed.filterAccount === "string" ? parsed.filterAccount : "",
      filterDateOption: typeof parsed.filterDateOption === "string" ? parsed.filterDateOption : "all",
      filterContractType: Array.isArray(parsed.filterContractType) ? parsed.filterContractType : [],
      pageSize: typeof parsed.pageSize === "number" && parsed.pageSize > 0 ? parsed.pageSize : 10,
    };
  } catch {
    return null;
  }
};

export function useEmployeesFilters({
  employees,
  managerEmails,
  accountStatus,
  canManage,
  workSites = [],
  currentBranchName,
  isLineManager = false,
  isEmployee = false,
  currentEmployee = null,
}: UseEmployeesFiltersProps) {
  const savedFilters = useMemo(() => getSavedEmployeesFilters(), []);

  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState<string>(() => savedFilters?.filterDept ?? "");
  const [filterStatus, setFilterStatus] = useState<string>(() => savedFilters?.filterStatus ?? "");
  const [filterJobStatus, setFilterJobStatus] = useState<string[]>(() => savedFilters?.filterJobStatus ?? []);
  const [filterRole, setFilterRole] = useState<string>(() => savedFilters?.filterRole ?? "");
  const [filterEmployeeType, setFilterEmployeeType] = useState<string>(() => savedFilters?.filterEmployeeType ?? "");
  const [filterEmployeeLevel, setFilterEmployeeLevel] = useState<string>(() => savedFilters?.filterEmployeeLevel ?? "");
  const [filterBranch, setFilterBranch] = useState<string>(() => savedFilters?.filterBranch ?? "");
  const [filterWorkLocation, setFilterWorkLocation] = useState<string>(() => savedFilters?.filterWorkLocation ?? "all");
  const [filterAccount, setFilterAccount] = useState<string>(() => savedFilters?.filterAccount ?? "");
  const [filterDateOption, setFilterDateOption] = useState<string>(() => savedFilters?.filterDateOption ?? "all");
  const [filterContractType, setFilterContractType] = useState<string[]>(() => savedFilters?.filterContractType ?? []);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [pageSize, setPageSize] = useState<number>(() => savedFilters?.pageSize ?? 10);
  const [searchParams, setSearchParams] = useSearchParams();
  const parsedPage = parseInt(searchParams.get("page") || "1", 10);
  const [page, setPageState] = useState<number>(!isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1);

  // Persist filter selections to localStorage so they remain fixed until explicitly updated or reset
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const payload: SavedEmployeesFilters = {
        filterBranch,
        filterWorkLocation,
        filterDept,
        filterRole,
        filterEmployeeType,
        filterEmployeeLevel,
        filterStatus,
        filterJobStatus,
        filterContractType,
        filterAccount,
        filterDateOption,
        pageSize,
      };
      localStorage.setItem(EMPLOYEES_FILTERS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [
    filterBranch,
    filterWorkLocation,
    filterDept,
    filterRole,
    filterEmployeeType,
    filterEmployeeLevel,
    filterStatus,
    filterJobStatus,
    filterContractType,
    filterAccount,
    filterDateOption,
    pageSize,
  ]);

  const setPage = useCallback(
    (newPageOrFn: number | ((prev: number) => number)) => {
      setPageState((prev) => {
        const resolved = typeof newPageOrFn === "function" ? newPageOrFn(prev) : newPageOrFn;
        return Math.max(1, resolved);
      });
    },
    []
  );

  useEffect(() => {
    setSearchParams(
      (sp) => {
        const next = new URLSearchParams(sp);
        const currentParam = next.get("page");
        const targetParam = page > 1 ? String(page) : null;
        if (currentParam === targetParam || (!currentParam && !targetParam)) {
          return sp;
        }
        if (targetParam) {
          next.set("page", targetParam);
        } else {
          next.delete("page");
        }
        return next;
      },
      { replace: true }
    );
  }, [page, setSearchParams]);

  const isInitialMountRef = useRef(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(INITIAL_VISIBLE_COLUMNS);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const scopedEmployees = useMemo(() => {
    if (isLineManager && currentEmployee) {
      const myId = currentEmployee.id;
      const myName = `${currentEmployee.first_name || ""} ${currentEmployee.last_name || ""}`.trim().toLowerCase();
      const myEmail = (currentEmployee.email || "").trim().toLowerCase();
      const myDept = (currentEmployee.department || "").trim().toLowerCase();
      const myDiv = (currentEmployee.division || "").trim().toLowerCase();

      return employees.filter((e) => {
        if (e.id === myId) return true;
        if (e.reports_to === myId) return true;
        const eLm = (e.line_manager || "").trim().toLowerCase();
        if (eLm && (eLm === myName || eLm === myEmail)) return true;
        if (myDept && e.department && e.department.trim().toLowerCase() === myDept) return true;
        if (myDiv && e.division && e.division.trim().toLowerCase() === myDiv) return true;
        return false;
      });
    }

    if (isEmployee && currentEmployee) {
      return employees.filter((e) => e.id === currentEmployee.id);
    }

    return employees;
  }, [employees, isLineManager, isEmployee, currentEmployee]);

  const employeeLocations = useMemo(() => {
    if (!workSites || workSites.length === 0) return [];
    const mainCount = scopedEmployees.filter((e) => !e.default_work_location_id).length;
    return [
      {
        id: "main",
        name: currentBranchName ? `${currentBranchName} (Main)` : "Main Office",
        count: mainCount,
        isMain: true,
      },
      ...workSites.map((ws) => ({
        id: ws.id,
        name: ws.name,
        count: scopedEmployees.filter((e) => e.default_work_location_id === ws.id).length,
        isMain: false,
      })),
    ];
  }, [workSites, scopedEmployees, currentBranchName]);

  const depts = useMemo(() => Array.from(new Set(scopedEmployees.map((e) => e.department).filter(Boolean))), [scopedEmployees]);
  const branchCount = useMemo(() => new Set(scopedEmployees.map((e) => e.branch_id).filter(Boolean)).size, [scopedEmployees]);
  const managers = useMemo(
    () => scopedEmployees.filter((employee) => managerEmails.has(employee.email?.toLowerCase())),
    [scopedEmployees, managerEmails]
  );

  const stats: EmployeeStats = useMemo(
    () => ({
      total: scopedEmployees.length,
      active: scopedEmployees.filter((e) => e.status === "active").length,
      onboarding: scopedEmployees.filter((e) => e.status === "onboarding").length,
      withAccounts: Object.values(accountStatus).filter((acc) => acc.hasAccount).length,
      invited: Object.values(accountStatus).filter((acc) => acc.invited && !acc.hasAccount).length,
      byDepartment: depts.reduce((acc, dept) => {
        if (dept) acc[dept] = scopedEmployees.filter((e) => e.department === dept).length;
        return acc;
      }, {} as Record<string, number>),
    }),
    [scopedEmployees, accountStatus, depts]
  );

  const filtered = useMemo(() => {
    return scopedEmployees
      .filter((e) => {
        const matchesSearch = matchEmployeeSearch(e, search);
        let matchesDept = true;
        if (filterDept) {
          const deptsList = filterDept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
          matchesDept = deptsList.length === 0 || deptsList.includes((e.department || "").toLowerCase());
        }

        const matchesStatus = !filterStatus || e.status === filterStatus;
        const matchesJobStatus = matchEmployeeJobStatus(e.status, filterJobStatus);

        let matchesRole = true;
        if (filterRole) {
          const rolesList = filterRole.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
          matchesRole =
            rolesList.length === 0 ||
            rolesList.some(
              (r) =>
                (e.role && e.role.toLowerCase() === r) ||
                (e.position && e.position.toLowerCase() === r) ||
                (e.role && e.role.toLowerCase().includes(r)) ||
                (e.position && e.position.toLowerCase().includes(r))
            );
        }

        let matchesEmployeeType = true;
        if (filterEmployeeType) {
          const typesList = filterEmployeeType.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
          matchesEmployeeType =
            typesList.length === 0 ||
            typesList.some((t) => {
              if (t === "all") return true;
              const empType = (e.employment_type || "").toLowerCase().replace(/[-_]/g, " ").trim();
              const tClean = t.toLowerCase().replace(/[-_]/g, " ").trim();
              return empType === tClean || empType.includes(tClean) || tClean.includes(empType);
            });
        }

        let matchesEmployeeLevel = true;
        if (filterEmployeeLevel) {
          const levelsList = filterEmployeeLevel.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
          matchesEmployeeLevel =
            levelsList.length === 0 ||
            levelsList.some((l) => {
              if (l === "all") return true;
              const empLevel = ((e as any).employee_level || "").toLowerCase().replace(/[-_]/g, " ").trim();
              const lClean = l.toLowerCase().replace(/[-_]/g, " ").trim();
              return empLevel === lClean || empLevel.includes(lClean) || lClean.includes(empLevel);
            });
        }

        const matchesDate = matchEmployeeDate(e.join_date || e.start_date, filterDateOption);
        const matchesContract = matchEmployeeContract(e.contract_type, filterContractType);

        let matchesBranch = true;
        if (filterBranch) {
          const branchList = filterBranch.split(",").map((s) => s.trim()).filter(Boolean);
          matchesBranch =
            branchList.length === 0 ||
            branchList.some((s) => {
              if (s.startsWith("site:")) {
                return e.default_work_location_id === s.substring(5);
              } else if (s.startsWith("main:")) {
                return e.branch_id === s.substring(5) && !e.default_work_location_id;
              } else if (s.startsWith("branch:")) {
                return e.branch_id === s.substring(7);
              } else {
                const sLower = s.toLowerCase();
                return (
                  e.branch_id === s ||
                  (e.code_bu && e.code_bu.toLowerCase() === sLower) ||
                  (e.branches?.name && e.branches.name.toLowerCase() === sLower) ||
                  (e.work_locations?.name && e.work_locations.name.toLowerCase() === sLower)
                );
              }
            });
        }

        let matchesAccount = true;
        if (filterAccount) {
          const status = accountStatus[e.email];
          if (filterAccount === "has_account") matchesAccount = !!status?.hasAccount;
          else if (filterAccount === "invited") matchesAccount = !!status?.invited && !status?.hasAccount;
          else if (filterAccount === "no_account") matchesAccount = !status?.hasAccount && !status?.invited;
        }

        let matchesLocation = true;
        if (filterWorkLocation && filterWorkLocation !== "all") {
          const locList = filterWorkLocation.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
          matchesLocation =
            locList.length === 0 ||
            locList.some((locId) => {
              if (locId === "main") return !e.default_work_location_id;
              const empLocId = (e.default_work_location_id || "").toLowerCase();
              const empLocName = (e.work_locations?.name || "").toLowerCase();
              return empLocId === locId || empLocName === locId;
            });
        }

        return (
          matchesSearch &&
          matchesDept &&
          matchesStatus &&
          matchesJobStatus &&
          matchesRole &&
          matchesEmployeeType &&
          matchesEmployeeLevel &&
          matchesDate &&
          matchesContract &&
          matchesBranch &&
          matchesLocation &&
          matchesAccount
        );
      })
      .sort((a, b) => compareEmployees(a, b, sortField, sortDirection));
  }, [
    scopedEmployees,
    search,
    filterDept,
    filterStatus,
    filterJobStatus,
    filterRole,
    filterEmployeeType,
    filterEmployeeLevel,
    filterDateOption,
    filterContractType,
    filterBranch,
    filterWorkLocation,
    filterAccount,
    sortField,
    sortDirection,
    accountStatus,
  ]);

  const empTotalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, empTotalPages);
  const empPageStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const empPageEnd = Math.min(safePage * pageSize, filtered.length);

  const pagedEmployees = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  const tableColumns = useMemo(
    () => [
      ...(visibleColumns.employee ? ["employee"] : []),
      ...(visibleColumns.role ? ["role"] : []),
      ...(visibleColumns.department ? ["department"] : []),
      ...(visibleColumns.branch ? ["branch"] : []),
      ...(visibleColumns.status ? ["status"] : []),
      ...(visibleColumns.account ? ["account"] : []),
      ...(visibleColumns.joinDate ? ["joinDate"] : []),
      ...(visibleColumns.actions && canManage ? ["actions"] : []),
    ],
    [visibleColumns, canManage]
  );

  const tableGridStyle = useMemo(
    () => ({ "--emp-cols": tableColumns.map((c) => COLUMN_WIDTHS[c] || "150px").join(" ") } as React.CSSProperties),
    [tableColumns]
  );

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return field;
      }
      setSortDirection("asc");
      return field;
    });
  }, []);

  const handleExportCSV = useCallback(() => {
    exportEmployeesCSV(filtered);
  }, [filtered]);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    setPage(1);
  }, [search, filterDept, filterStatus, filterJobStatus, filterRole, filterEmployeeType, filterEmployeeLevel, filterDateOption, filterContractType, filterBranch, filterWorkLocation, filterAccount, setPage]);

  return {
    search, setSearch,
    filterDept, setFilterDept,
    filterStatus, setFilterStatus,
    filterJobStatus, setFilterJobStatus,
    filterRole, setFilterRole,
    filterEmployeeType, setFilterEmployeeType,
    filterEmployeeLevel, setFilterEmployeeLevel,
    filterDateOption, setFilterDateOption,
    filterContractType, setFilterContractType,
    filterBranch, setFilterBranch,
    filterWorkLocation, setFilterWorkLocation,
    employeeLocations,
    filterAccount, setFilterAccount,
    sortField, sortDirection,
    pageSize, setPageSize,
    page, setPage,
    showFilters, setShowFilters,
    showColumnMenu, setShowColumnMenu,
    visibleColumns, setVisibleColumns,
    viewMode, setViewMode,
    depts, branchCount, managers, stats,
    filtered, empTotalPages, empPageStart, empPageEnd,
    pagedEmployees, tableGridStyle,
    handleSort, handleExportCSV,
  };
}
