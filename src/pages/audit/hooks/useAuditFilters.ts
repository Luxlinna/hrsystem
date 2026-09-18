import { useState, useMemo, useCallback, useEffect } from "react";
import type { AuditLog, CrossBuScopeFilter, ExportFormat } from "../types";
import { MODULES } from "../constants";
import { downloadCSV, exportExcel, exportPDF } from "../exportUtils";

export function useAuditFilters(logs: AuditLog[]) {
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [buFilter, setBuFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState<CrossBuScopeFilter>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const availableBusinessUnits = useMemo(() => {
    const buSet = new Set<string>();
    for (const l of logs) {
      if (l.branches?.name) buSet.add(l.branches.name);
      if (l.metadata?.business_unit && typeof l.metadata.business_unit === "string") {
        buSet.add(l.metadata.business_unit);
      }
      if (l.metadata?.target_business_unit && typeof l.metadata.target_business_unit === "string") {
        buSet.add(l.metadata.target_business_unit);
      }
    }
    return Array.from(buSet).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      // Scope filter: local vs across-site BU
      if (scopeFilter === "cross_bu" && !l.metadata?.is_cross_bu) return false;
      if (scopeFilter === "local" && Boolean(l.metadata?.is_cross_bu)) return false;

      // BU filter
      if (buFilter !== "all") {
        const buMatches =
          l.branches?.name === buFilter ||
          l.metadata?.business_unit === buFilter ||
          l.metadata?.target_business_unit === buFilter;
        if (!buMatches) return false;
      }

      // Search query
      if (search) {
        const q = search.toLowerCase().trim();
        const matches =
          l.description.toLowerCase().includes(q) ||
          l.actor_name.toLowerCase().includes(q) ||
          l.module.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          (typeof l.metadata?.business_unit === "string" && l.metadata.business_unit.toLowerCase().includes(q)) ||
          (typeof l.metadata?.target_business_unit === "string" && l.metadata.target_business_unit.toLowerCase().includes(q)) ||
          (l.branches?.name && l.branches.name.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [logs, search, buFilter, scopeFilter]);

  const auditTotalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const auditSafePage = Math.min(page, auditTotalPages);
  const pagedLogs = useMemo(
    () => filtered.slice((auditSafePage - 1) * pageSize, auditSafePage * pageSize),
    [filtered, auditSafePage, pageSize]
  );

  useEffect(() => {
    if (page > auditTotalPages) setPage(auditTotalPages);
  }, [page, auditTotalPages]);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleExport = useCallback((format: ExportFormat) => {
    if (format === "pdf") exportPDF(filtered, setExporting);
    else if (format === "csv") downloadCSV(filtered, setExporting);
    else exportExcel(filtered, setExporting);
  }, [filtered]);

  const clearAllFilters = useCallback(() => {
    setModuleFilter("all");
    setActionFilter("all");
    setBuFilter("all");
    setScopeFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  }, []);

  const statsByModule = useMemo(() => {
    return MODULES.slice(1).reduce((acc, m) => {
      acc[m] = logs.filter((l) => l.module === m).length;
      return acc;
    }, {} as Record<string, number>);
  }, [logs]);

  const topModules = useMemo(() => {
    return Object.entries(statsByModule)
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) as [string, number][];
  }, [statsByModule]);

  return {
    moduleFilter, setModuleFilter,
    actionFilter, setActionFilter,
    buFilter, setBuFilter,
    scopeFilter, setScopeFilter,
    availableBusinessUnits,
    search, setSearch,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    expanded, toggleExpand,
    selectedIds, setSelectedIds,
    toggleSelect, selectAll, clearSelection,
    exporting, handleExport,
    pageSize, setPageSize,
    page, setPage,
    filtered,
    auditTotalPages,
    pagedLogs,
    clearAllFilters,
    topModules,
  };
}
