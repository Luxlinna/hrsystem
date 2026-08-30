import { useAudit } from "./hooks/useAudit";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { AuditHeader } from "./components/AuditHeader";
import { ModuleStatsRow } from "./components/ModuleStatsRow";
import { AuditFilters } from "./components/AuditFilters";
import { AuditTimeline } from "./components/AuditTimeline";

export default function AuditLogPage() {
  const {
    logsData,
    filters,
    moduleFilter,
    setModuleFilter,
    actionFilter,
    setActionFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
  } = useAudit();

  if (logsData.isPartnerBranchBlocked) {
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
          userBranchName={logsData.userBranchName}
          hasNoBranch={!logsData.userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F7] p-6">
      {/* Header with Live Indicator & Export dropdown */}
      <AuditHeader
        isLive={logsData.isLive}
        newCount={logsData.newCount}
        exporting={filters.exporting}
        onExport={filters.handleExport}
      />

      {/* Top Module Activity Stats */}
      <ModuleStatsRow
        topModules={filters.topModules}
        moduleFilter={moduleFilter}
        onSelectModule={(mod) => setModuleFilter((prev) => (prev === mod ? "all" : mod))}
      />

      {/* Filters Bar */}
      <AuditFilters
        search={filters.search}
        setSearch={filters.setSearch}
        moduleFilter={moduleFilter}
        setModuleFilter={setModuleFilter}
        actionFilter={actionFilter}
        setActionFilter={setActionFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        onClearAll={filters.clearAllFilters}
      />

      {/* Activity Timeline Container */}
      <AuditTimeline
        loading={logsData.loading}
        filteredCount={filters.filtered.length}
        pagedLogs={filters.pagedLogs}
        expanded={filters.expanded}
        toggleExpand={filters.toggleExpand}
        pageSize={filters.pageSize}
        setPageSize={filters.setPageSize}
        page={filters.page}
        setPage={filters.setPage}
        totalPages={filters.auditTotalPages}
      />
    </div>
  );
}