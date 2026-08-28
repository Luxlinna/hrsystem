import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import type { AuditLog, ExportFormat } from "./types";
import { MODULES } from "./constants";
import { downloadCSV, exportExcel, exportPDF } from "./exportUtils";
import { AuditHeader } from "./components/AuditHeader";
import { ModuleStatsRow } from "./components/ModuleStatsRow";
import { AuditFilters } from "./components/AuditFilters";
import { AuditLogItem } from "./components/AuditLogItem";
import { Pagination } from "./components/Pagination";

export default function AuditLogPage() {
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId, userBranchName } = useBranchScope();

  // Partner Privacy Rule: Super Admin or any user CANNOT access other partner branches' audit logs.
  // Access is strictly confined to the user's home branch (userBranchId).
  const isPartnerBranchBlocked = Boolean(
    !userBranchId || (effectiveBranchId && effectiveBranchId !== userBranchId)
  );
  const targetBranch = isPartnerBranchBlocked ? null : userBranchId;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);
  const [isLive, setIsLive] = useState(false);
  const [newCount, setNewCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let q = supabase
      .from("audit_logs")
      .select("*")
      .eq("branch_id", targetBranch)
      .order("created_at", { ascending: false })
      .limit(200);

    if (moduleFilter !== "all") q = q.eq("module", moduleFilter);
    if (actionFilter !== "all") q = q.eq("action", actionFilter);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo) q = q.lte("created_at", dateTo + "T23:59:59");
    const { data } = await q;
    setLogs(data || []);
    setLoading(false);
  }, [isPartnerBranchBlocked, targetBranch, moduleFilter, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (isPartnerBranchBlocked || !targetBranch) return;

    const channel = supabase
      .channel("audit-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, (payload) => {
        const newLog = payload.new as AuditLog;
        if (newLog.branch_id === targetBranch) {
          setLogs((prev) => [newLog, ...prev]);
          setNewCount((c) => c + 1);
          setTimeout(() => setNewCount((c) => Math.max(0, c - 1)), 5000);
        }
      })
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isPartnerBranchBlocked, targetBranch]);

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

  const handleExport = useCallback(
    (format: ExportFormat) => {
      if (format === "pdf") exportPDF(filtered, setExporting);
      else if (format === "csv") downloadCSV(filtered, setExporting);
      else exportExcel(filtered, setExporting);
    },
    [filtered]
  );

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

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F8F7] p-6 font-sans">
        <AuditHeader
          isLive={false}
          newCount={0}
          exporting={null}
          onExport={() => {}}
        />
        <PartnerBranchPrivacyShield
          moduleName="System Audit & Security Logs"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F7] p-6">
      {/* Header with Live Indicator & Export dropdown */}
      <AuditHeader
        isLive={isLive}
        newCount={newCount}
        exporting={exporting}
        onExport={handleExport}
      />

      {/* Top Module Activity Stats */}
      <ModuleStatsRow
        topModules={topModules}
        moduleFilter={moduleFilter}
        onSelectModule={(mod) => setModuleFilter((prev) => (prev === mod ? "all" : mod))}
      />

      {/* Filters Bar */}
      <AuditFilters
        search={search}
        setSearch={setSearch}
        moduleFilter={moduleFilter}
        setModuleFilter={setModuleFilter}
        actionFilter={actionFilter}
        setActionFilter={setActionFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        onClearAll={clearAllFilters}
      />

      {/* Activity Timeline Container */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Activity Timeline</span>
          <span className="text-xs text-gray-400">{filtered.length} events</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <i className="ri-file-search-line text-3xl mb-2" />
            <p className="text-sm">No audit events found</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {pagedLogs.map((log) => (
                <AuditLogItem
                  key={log.id}
                  log={log}
                  isExpanded={expanded.has(log.id)}
                  onToggleExpand={toggleExpand}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            <Pagination
              totalCount={filtered.length}
              pageSize={pageSize}
              setPageSize={setPageSize}
              page={page}
              setPage={setPage}
              totalPages={auditTotalPages}
            />
          </>
        )}
      </div>
    </div>
  );
}