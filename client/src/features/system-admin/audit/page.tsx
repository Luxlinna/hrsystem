import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useBranchScope } from "@/context/BranchContext";
import { useAudit } from "./hooks/useAudit";
import { AuditHeader } from "./components/AuditHeader";
import { AuditFilters } from "./components/AuditFilters";
import { ModuleStatsRow } from "./components/ModuleStatsRow";
import { AuditTimeline } from "./components/AuditTimeline";

export default function AuditLogPage() {
  const { isPartnerBranch, userBranchName, isSuperAdmin, isHrDivision } = useBranchScope();

  const { logsData, filters } = useAudit();

  if (isPartnerBranch && !isSuperAdmin && !isHrDivision) {
    return (
      <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-4 sm:p-6 font-sans">
        <PartnerBranchPrivacyShield
          moduleName="System Audit & Security Logs"
          userBranchName={userBranchName || undefined}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 font-sans">

      {/* ── MOBILE: Coming Soon placeholder (mobile responsive not done yet) ── */}
      <div className="sm:hidden p-4 space-y-4">
        {/* Mobile header */}
        <div className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
              <span>Administration</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-[#253C7D] dark:text-sky-400 font-extrabold">Audit Log</span>
            </div>
            {/* Under Development badge */}
            <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-2xs whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Under Development
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Activity Audit Log
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Real-time tracking of all HR system changes and operational actions.
            </p>
          </div>
        </div>

        {/* Coming Soon card */}
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center shadow-2xs animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-[#253C7D] dark:text-sky-400 flex items-center justify-center text-3xl mb-4 shadow-sm border border-sky-100 dark:border-sky-900/50">
            <i className="ri-history-line" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Coming Soon
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md leading-relaxed">
            The Activity Audit Log & Security Tracking module is currently under development and will be available in an upcoming release.
          </p>
        </div>
      </div>

      {/* ── DESKTOP: Full audit log (sm and above) ── */}
      <div className="hidden sm:block p-6 lg:p-8 space-y-5">
        <AuditHeader
          isLive={logsData.isLive}
          newCount={logsData.newCount}
          exporting={filters.exporting}
          onExport={filters.handleExport}
        />

        <ModuleStatsRow
          topModules={filters.topModules}
          moduleFilter={filters.moduleFilter}
          onSelectModule={filters.setModuleFilter}
        />

        <AuditFilters
          search={filters.search}
          setSearch={filters.setSearch}
          moduleFilter={filters.moduleFilter}
          setModuleFilter={filters.setModuleFilter}
          actionFilter={filters.actionFilter}
          setActionFilter={filters.setActionFilter}
          buFilter={filters.buFilter}
          setBuFilter={filters.setBuFilter}
          availableBusinessUnits={filters.availableBusinessUnits}
          scopeFilter={filters.scopeFilter}
          setScopeFilter={filters.setScopeFilter}
          dateFrom={filters.dateFrom}
          setDateFrom={filters.setDateFrom}
          dateTo={filters.dateTo}
          setDateTo={filters.setDateTo}
          onClearAll={filters.clearAllFilters}
        />

        <AuditTimeline
          loading={logsData.loading}
          filteredCount={filters.filtered.length}
          pagedLogs={filters.pagedLogs}
          expanded={filters.expanded}
          toggleExpand={filters.toggleExpand}
          selectedIds={filters.selectedIds}
          toggleSelect={filters.toggleSelect}
          selectAll={filters.selectAll}
          clearSelection={filters.clearSelection}
          onDeleteLogs={logsData.deleteLogs}
          pageSize={filters.pageSize}
          setPageSize={filters.setPageSize}
          page={filters.page}
          setPage={filters.setPage}
          totalPages={filters.auditTotalPages}
        />
      </div>

    </div>
  );
}