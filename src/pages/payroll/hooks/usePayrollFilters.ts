import { useState, useMemo, useCallback } from "react";
import type { PayrollRecord } from "../types";

export function usePayrollFilters(
  allRecords: PayrollRecord[],
  currentMonthStr: string
) {
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [periodMode, setPeriodMode] = useState<"month" | "all">("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const navigateMonth = useCallback(
    (offset: number) => {
      const [yStr, mStr] = selectedMonth.split("-");
      const d = new Date(parseInt(yStr), parseInt(mStr) - 1 + offset, 1);
      const newM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      setSelectedMonth(newM);
      setPeriodMode("month");
    },
    [selectedMonth]
  );

  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      if (periodMode === "month" && r.month !== selectedMonth) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterDepartment !== "all" && r.employees?.department !== filterDepartment) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.toLowerCase();
        const role = (r.employees?.role || "").toLowerCase();
        const dept = (r.employees?.department || "").toLowerCase();
        const month = r.month.toLowerCase();
        if (!empName.includes(q) && !role.includes(q) && !dept.includes(q) && !month.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allRecords, periodMode, selectedMonth, filterStatus, filterDepartment, searchQuery]);

  return {
    selectedMonth,
    setSelectedMonth,
    periodMode,
    setPeriodMode,
    searchQuery,
    setSearchQuery,
    filterDepartment,
    setFilterDepartment,
    filterStatus,
    setFilterStatus,
    viewMode,
    setViewMode,
    navigateMonth,
    filteredRecords,
  };
}
