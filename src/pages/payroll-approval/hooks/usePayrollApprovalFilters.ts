import { useState, useMemo } from "react";
import type { PayrollRun, EmployeeItemRecord } from "../types";

export function usePayrollApprovalFilters(
  pendingRuns: PayrollRun[],
  approvedRuns: PayrollRun[],
  historyRuns: PayrollRun[],
  itemizedRecords: EmployeeItemRecord[]
) {
  const [tab, setTab] = useState<"pending" | "approved" | "history" | "itemized" | "create">("pending");
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  const displayedRuns = useMemo(() => {
    let list: PayrollRun[] = [];
    if (tab === "pending") list = pendingRuns;
    else if (tab === "approved") list = approvedRuns;
    else if (tab === "history") list = historyRuns;

    return list.filter((r) => {
      if (periodFilter !== "all" && r.period !== periodFilter) return false;
      if (deptFilter !== "all" && r.department !== deptFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const dept = (r.department || "").toLowerCase();
        const period = (r.period || "").toLowerCase();
        const submitter = (r.submitted_by || "").toLowerCase();
        const notes = (r.notes || "").toLowerCase();
        if (!dept.includes(q) && !period.includes(q) && !submitter.includes(q) && !notes.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [tab, pendingRuns, approvedRuns, historyRuns, periodFilter, deptFilter, searchQuery]);

  const filteredItemized = useMemo(() => {
    return itemizedRecords.filter((r) => {
      if (periodFilter !== "all" && r.month !== periodFilter) return false;
      if (deptFilter !== "all" && r.employees?.department !== deptFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.toLowerCase();
        const role = (r.employees?.role || "").toLowerCase();
        const dept = (r.employees?.department || "").toLowerCase();
        const month = (r.month || "").toLowerCase();
        if (!name.includes(q) && !role.includes(q) && !dept.includes(q) && !month.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [itemizedRecords, periodFilter, deptFilter, searchQuery]);

  return {
    tab,
    setTab,
    expandedRun,
    setExpandedRun,
    searchQuery,
    setSearchQuery,
    periodFilter,
    setPeriodFilter,
    deptFilter,
    setDeptFilter,
    displayedRuns,
    filteredItemized,
  };
}
