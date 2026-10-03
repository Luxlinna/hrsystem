import { useState, useMemo, useEffect, useCallback } from "react";
import type { DisciplinaryRecord, DisciplinaryTabKey, ViewMode } from "../types";
import { isOverdueRecord } from "../constants";
import { exportDisciplinaryCSV } from "../exportUtils";

export function useDisciplinaryFilters(records: DisciplinaryRecord[]) {
  const [activeTab, setActiveTab] = useState<DisciplinaryTabKey>("all");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterScope, setFilterScope] = useState<"all" | "admin" | "branch">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  const [pageSize, setPageSize] = useState(9);
  const [page, setPage] = useState(1);

  const warningCount = useMemo(
    () =>
      records.filter((r) => {
        const t = (r.warning_type || r.type || "").toLowerCase();
        return t.includes("warning") || t.includes("show_cause");
      }).length,
    [records]
  );
  const openCount = useMemo(
    () => records.filter((r) => r.status === "open" || r.status === "in_progress").length,
    [records]
  );
  const pipCount = useMemo(() => records.filter((r) => r.type === "pip").length, [records]);
  const criticalCount = useMemo(
    () => records.filter((r) => r.severity === "critical" || r.severity === "high").length,
    [records]
  );
  const resolvedCount = useMemo(
    () => records.filter((r) => r.status === "resolved" || r.status === "closed").length,
    [records]
  );
  const overdueCount = useMemo(
    () => records.filter((r) => isOverdueRecord(r)).length,
    [records]
  );

  const activeScopeRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterScope === "admin") return !r.branch_id;
      if (filterScope === "branch") return !!r.branch_id;
      return true;
    });
  }, [records, filterScope]);

  const filteredRecords = useMemo(() => {
    return activeScopeRecords.filter((r) => {
      if (activeTab === "warnings") {
        const t = (r.warning_type || r.type || "").toLowerCase();
        if (!t.includes("warning") && !t.includes("show_cause")) return false;
      }
      if (activeTab === "open" && r.status !== "open" && r.status !== "in_progress") return false;
      if (activeTab === "pip" && r.type !== "pip") return false;
      if (activeTab === "critical" && r.severity !== "critical" && r.severity !== "high") return false;
      if (activeTab === "resolved" && r.status !== "resolved" && r.status !== "closed") return false;

      if (filterType && r.type !== filterType && r.warning_type !== filterType) return false;
      if (filterStatus) {
        if (filterStatus === "open") {
          if (r.status !== "open" && r.status !== "in_progress") return false;
        } else if (filterStatus === "resolved") {
          if (r.status !== "resolved" && r.status !== "closed") return false;
        } else if (r.status !== filterStatus) {
          return false;
        }
      }
      if (filterSeverity && r.severity !== filterSeverity) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.toLowerCase();
        const empId = (r.employees?.employee_id || r.employee_id || "").toLowerCase();
        const role = (r.employees?.role || "").toLowerCase();
        const dept = (r.employees?.department || "").toLowerCase();
        const title = (r.title || "").toLowerCase();
        const desc = (r.description || "").toLowerCase();
        const promise = (r.employee_promise || "").toLowerCase();

        if (
          !empName.includes(q) &&
          !empId.includes(q) &&
          !title.includes(q) &&
          !role.includes(q) &&
          !dept.includes(q) &&
          !desc.includes(q) &&
          !promise.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [activeScopeRecords, activeTab, filterType, filterStatus, filterSeverity, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRecords = useMemo(
    () => filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredRecords, safePage, pageSize]
  );

  const handleSelectTab = useCallback((tab: DisciplinaryTabKey) => {
    setActiveTab(tab);
    setFilterStatus("");
    setFilterType("");
    setFilterSeverity("");
    setPage(1);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterType, filterStatus, filterSeverity, filterScope, activeTab]);

  const handleExportCSV = useCallback(() => {
    exportDisciplinaryCSV(filteredRecords);
  }, [filteredRecords]);

  return {
    activeTab,
    setActiveTab,
    handleSelectTab,
    totalCount: activeScopeRecords.length,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filterSeverity,
    setFilterSeverity,
    filterScope,
    setFilterScope,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    pageSize,
    setPageSize,
    page,
    setPage,
    warningCount,
    openCount,
    pipCount,
    criticalCount,
    resolvedCount,
    overdueCount,
    filteredRecords,
    totalPages,
    pagedRecords,
    handleExportCSV,
  };
}
