import { useState, useMemo, useEffect, useCallback } from "react";
import type { Employee, AccountStatus, VisibleColumns, SortField, SortDirection, ViewMode, EmployeeStats } from "../types";
import { INITIAL_VISIBLE_COLUMNS, COLUMN_WIDTHS } from "../constants";
import { exportEmployeesCSV } from "../exportUtils";

interface UseEmployeesFiltersProps {
  employees: Employee[];
  managerEmails: Set<string>;
  accountStatus: Record<string, AccountStatus>;
  canManage: boolean;
  workSites?: { id: string; name: string; branch_id: string; is_default?: boolean }[];
  currentBranchName?: string;
}

export function useEmployeesFilters({
  employees,
  managerEmails,
  accountStatus,
  canManage,
  workSites = [],
  currentBranchName,
}: UseEmployeesFiltersProps) {
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterWorkLocation, setFilterWorkLocation] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(INITIAL_VISIBLE_COLUMNS);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const employeeLocations = useMemo(() => {
    if (!workSites || workSites.length === 0) return [];
    const mainCount = employees.filter((e) => !e.default_work_location_id).length;
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
        count: employees.filter((e) => e.default_work_location_id === ws.id).length,
        isMain: false,
      })),
    ];
  }, [workSites, employees, currentBranchName]);

  const depts = useMemo(() => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))), [employees]);
  const branchCount = useMemo(() => new Set(employees.map((e) => e.branch_id).filter(Boolean)).size, [employees]);
  const managers = useMemo(
    () => employees.filter((employee) => managerEmails.has(employee.email?.toLowerCase())),
    [employees, managerEmails]
  );

  const stats: EmployeeStats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((e) => e.status === "active").length,
      onboarding: employees.filter((e) => e.status === "onboarding").length,
      withAccounts: Object.values(accountStatus).filter((acc) => acc.hasAccount).length,
      invited: Object.values(accountStatus).filter((acc) => acc.invited && !acc.hasAccount).length,
      byDepartment: depts.reduce((acc, dept) => {
        if (dept) acc[dept] = employees.filter((e) => e.department === dept).length;
        return acc;
      }, {} as Record<string, number>),
    }),
    [employees, accountStatus, depts]
  );

  const filtered = useMemo(() => {
    return employees
      .filter((e) => {
        const fullName = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
        const email = (e.email || "").toLowerCase();
        const phone = (e.phone || "").toLowerCase();
        const role = (e.role || "").toLowerCase();
        const dept = (e.department || "").toLowerCase();
        const q = search.toLowerCase();
        const matchesSearch =
          !search ||
          fullName.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          role.includes(q) ||
          dept.includes(q);
        const matchesDept = !filterDept || e.department === filterDept;
        const matchesStatus = !filterStatus || e.status === filterStatus;
        let matchesBranch = true;
        if (filterBranch) {
          if (filterBranch.startsWith("site:")) {
            const siteId = filterBranch.substring(5);
            matchesBranch = e.default_work_location_id === siteId;
          } else if (filterBranch.startsWith("main:")) {
            const branchId = filterBranch.substring(5);
            matchesBranch = e.branch_id === branchId && !e.default_work_location_id;
          } else if (filterBranch.startsWith("branch:")) {
            const branchId = filterBranch.substring(7);
            matchesBranch = e.branch_id === branchId;
          } else {
            matchesBranch = e.branch_id === filterBranch;
          }
        }
        let matchesAccount = true;
        if (filterAccount) {
          const status = accountStatus[e.email];
          if (filterAccount === "has_account") matchesAccount = !!status?.hasAccount;
          else if (filterAccount === "invited") matchesAccount = !!status?.invited && !status?.hasAccount;
          else if (filterAccount === "no_account") matchesAccount = !status?.hasAccount && !status?.invited;
        }
        const matchesLocation =
          filterWorkLocation === "all" ||
          (filterWorkLocation === "main" ? !e.default_work_location_id : e.default_work_location_id === filterWorkLocation);
        return matchesSearch && matchesDept && matchesStatus && matchesBranch && matchesLocation && matchesAccount;
      })
      .sort((a, b) => {
        if (!sortField) return 0;
        let aVal = a[sortField] || "";
        let bVal = b[sortField] || "";
        if (sortField === "first_name") {
          aVal = `${a.first_name} ${a.last_name}`;
          bVal = `${b.first_name} ${b.last_name}`;
        } else if (sortField === "email") {
          aVal = a.email || a.phone || "";
          bVal = b.email || b.phone || "";
        }
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [employees, search, filterDept, filterStatus, filterBranch, filterWorkLocation, filterAccount, sortField, sortDirection, accountStatus]);

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
    setPage(1);
  }, [search, filterDept, filterStatus, filterBranch, filterWorkLocation, filterAccount]);

  return {
    search, setSearch,
    filterDept, setFilterDept,
    filterStatus, setFilterStatus,
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
