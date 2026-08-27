import { useState, useMemo } from "react";
import type { Employee } from "../types";

export function useOrgChartFilters(employees: Employee[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department))).sort(),
    [employees]
  );

  const listEmployees = useMemo(
    () => (deptFilter ? employees.filter((e) => e.department === deptFilter) : employees),
    [employees, deptFilter]
  );

  const filteredList = useMemo(
    () =>
      searchTerm
        ? listEmployees.filter((e) =>
            `${e.first_name} ${e.last_name} ${e.role} ${e.department}`
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          )
        : listEmployees,
    [listEmployees, searchTerm]
  );

  return {
    searchTerm,
    setSearchTerm,
    deptFilter,
    setDeptFilter,
    viewMode,
    setViewMode,
    departments,
    filteredList,
  };
}
