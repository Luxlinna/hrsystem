import { useState, useMemo, useCallback, useEffect } from "react";
import type { AuditLog, ExportFormat } from "../types";
import { MODULES } from "../constants";
import { downloadCSV, exportExcel, exportPDF } from "../exportUtils";

export function useAuditFilters(logs: AuditLog[]) {
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search) return logs;
    const q = search.toLowerCase().trim();
    return logs.filter(
      (l) =>
        l.description.toLowerCase().includes(q) ||
        l.actor_name.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q)
    );
  }, [logs, search]);

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
    search, setSearch,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    expanded, toggleExpand,
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
