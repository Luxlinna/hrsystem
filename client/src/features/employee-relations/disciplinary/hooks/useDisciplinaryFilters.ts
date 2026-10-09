import { useState, useMemo, useEffect, useCallback } from "react";
import type { DisciplinaryRecord, DisciplinaryTabKey, ViewMode } from "../types";
import { isOverdueRecord } from "../constants";
import { exportDisciplinaryCSV } from "../exportUtils";

function parseToDate(dStr?: string | null): Date | null {
  if (!dStr || dStr === "-" || dStr === "—") return null;
  const str = dStr.trim();
  const dmy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (!isNaN(date.getTime())) return date;
  }
  const date = new Date(str);
  return !isNaN(date.getTime()) ? date : null;
}

function matchDateRange(r: DisciplinaryRecord, preset: string, start?: string, end?: string): boolean {
  if (!preset || preset === "all") return true;
  const recDate = parseToDate(r.warning_date || r.incident_date || r.created_at);
  if (!recDate) return false;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (preset === "today") return recDate >= todayStart && recDate <= todayEnd;
  if (preset === "this_week") {
    const day = todayStart.getDay();
    const s = new Date(todayStart);
    s.setDate(todayStart.getDate() - (day === 0 ? 6 : day - 1));
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    e.setHours(23, 59, 59, 999);
    return recDate >= s && recDate <= e;
  }
  if (preset === "last_week") {
    const day = todayStart.getDay();
    const thisWeekStart = new Date(todayStart);
    thisWeekStart.setDate(todayStart.getDate() - (day === 0 ? 6 : day - 1));
    const s = new Date(thisWeekStart);
    s.setDate(thisWeekStart.getDate() - 7);
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    e.setHours(23, 59, 59, 999);
    return recDate >= s && recDate <= e;
  }
  if (preset === "this_month") {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return recDate >= s && recDate <= e;
  }
  if (preset === "last_month") {
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return recDate >= s && recDate <= e;
  }
  if (preset === "this_year") {
    const s = new Date(now.getFullYear(), 0, 1);
    const e = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return recDate >= s && recDate <= e;
  }
  if (preset === "last_year") {
    const s = new Date(now.getFullYear() - 1, 0, 1);
    const e = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    return recDate >= s && recDate <= e;
  }
  if (preset === "custom") {
    if (start) {
      const s = parseToDate(start);
      if (s) {
        s.setHours(0, 0, 0, 0);
        if (recDate < s) return false;
      }
    }
    if (end) {
      const e = parseToDate(end);
      if (e) {
        e.setHours(23, 59, 59, 999);
        if (recDate > e) return false;
      }
    }
    return true;
  }
  return true;
}

export function useDisciplinaryFilters(records: DisciplinaryRecord[]) {
  const [activeTab, setActiveTab] = useState<DisciplinaryTabKey>("all");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterScope, setFilterScope] = useState<"all" | "admin" | "branch">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [filterDateOption, setFilterDateOption] = useState("this_year");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pageSize, setPageSize] = useState(9);
  const [page, setPage] = useState(1);

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

      if (!matchDateRange(r, filterDateOption, startDate, endDate)) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const empName = `${r.employees?.last_name || ""} ${r.employees?.first_name || ""}`.toLowerCase();
        const empId = (r.employees?.employee_id || r.employee_id || "").toLowerCase();
        const title = (r.title || "").toLowerCase();
        const desc = (r.description || "").toLowerCase();
        const promise = (r.employee_promise || "").toLowerCase();
        if (!empName.includes(q) && !empId.includes(q) && !title.includes(q) && !desc.includes(q) && !promise.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [activeScopeRecords, activeTab, filterType, filterStatus, filterSeverity, searchQuery, filterDateOption, startDate, endDate]);

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
  }, [searchQuery, filterType, filterStatus, filterSeverity, filterScope, activeTab, filterDateOption, startDate, endDate]);

  const handleExportCSV = useCallback(() => {
    exportDisciplinaryCSV(filteredRecords);
  }, [filteredRecords]);

  return {
    activeTab, setActiveTab, handleSelectTab,
    totalCount: activeScopeRecords.length,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    filterSeverity, setFilterSeverity,
    filterScope, setFilterScope,
    searchQuery, setSearchQuery,
    filterDateOption, setFilterDateOption,
    startDate, setStartDate,
    endDate, setEndDate,
    viewMode, setViewMode,
    pageSize, setPageSize,
    page, setPage,
    warningCount: records.length,
    openCount: records.filter((r) => r.status === "open" || r.status === "in_progress").length,
    pipCount: records.filter((r) => r.type === "pip").length,
    criticalCount: records.filter((r) => r.severity === "critical" || r.severity === "high").length,
    resolvedCount: records.filter((r) => r.status === "resolved" || r.status === "closed").length,
    overdueCount: records.filter((r) => isOverdueRecord(r)).length,
    filteredRecords,
    totalPages,
    pagedRecords,
    handleExportCSV,
  };
}
