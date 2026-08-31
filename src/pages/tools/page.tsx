import { useTools } from "./hooks/useTools";
import { ToolsHeader } from "./components/ToolsHeader";
import { ToolsFilterBar } from "./components/ToolsFilterBar";
import { ToolsCardGridView } from "./components/views/ToolsCardGridView";
import { ToolsTableView } from "./components/views/ToolsTableView";
import { ToolsAccessMatrixView } from "./components/views/ToolsAccessMatrixView";
import { ToolsActivityAuditView } from "./components/views/ToolsActivityAuditView";
import { ToolDetailDrawer } from "./components/drawers/ToolDetailDrawer";
import { GrantAccessModal } from "./components/modals/GrantAccessModal";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";

export default function ToolsPage() {
  const {
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    canManage,
    tools,
    assignments,
    usages,
    employees,
    loading,
    tab,
    setTab,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    activeTools,
    totalAssignments,
    totalUsages,
    avgUsagePerTool,
    categories,
    departments,
    filteredTools,
    saving,
    selectedTool,
    setSelectedTool,
    assignModalOpen,
    setAssignModalOpen,
    assignTargetTool,
    assignEmployeeIds,
    setAssignEmployeeIds,
    assignSearch,
    setAssignSearch,
    assignDeptFilter,
    setAssignDeptFilter,
    openAssign,
    handleGrantAccess,
    handleRevokeAccess,
    handleToggleStatus,
  } = useTools();

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F8F7] p-6 font-sans">
        <ToolsHeader
          tab={tab}
          setTab={setTab}
          activeTools={0}
          totalAssignments={0}
          totalUsages={0}
          avgUsagePerTool={0}
        />
        <PartnerBranchPrivacyShield
          moduleName="System Tools & Utilities"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F7] p-6 font-sans">
      {/* Top Header & Metrics Summary */}
      <ToolsHeader
        tab={tab}
        setTab={setTab}
        activeTools={activeTools}
        totalAssignments={totalAssignments}
        totalUsages={totalUsages}
        avgUsagePerTool={avgUsagePerTool}
        tools={filteredTools}
        assignments={assignments}
        usages={usages}
      />

      {/* Main Tab Views */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-gray-500">Loading tools &amp; permissions catalog...</p>
        </div>
      ) : tab === "tools" ? (
        <>
          <ToolsFilterBar
            categories={categories}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          {viewMode === "cards" ? (
            <ToolsCardGridView
              tools={filteredTools}
              assignments={assignments}
              usages={usages}
              canManage={canManage}
              onSelect={setSelectedTool}
              onOpenAssign={openAssign}
              onToggleStatus={handleToggleStatus}
            />
          ) : (
            <ToolsTableView
              tools={filteredTools}
              assignments={assignments}
              usages={usages}
              canManage={canManage}
              onSelect={setSelectedTool}
              onOpenAssign={openAssign}
              onToggleStatus={handleToggleStatus}
            />
          )}
        </>
      ) : tab === "access" ? (
        <ToolsAccessMatrixView
          tools={tools}
          employees={employees}
          assignments={assignments}
          departments={departments}
          canManage={canManage}
          onRevokeAccess={handleRevokeAccess}
          onOpenAssign={openAssign}
        />
      ) : (
        <ToolsActivityAuditView
          usages={usages}
          tools={tools}
        />
      )}

      {/* Tool Detail Slide-Over Drawer */}
      <ToolDetailDrawer
        tool={selectedTool}
        assignments={assignments}
        usages={usages}
        canManage={canManage}
        onClose={() => setSelectedTool(null)}
        onOpenAssign={openAssign}
        onToggleStatus={handleToggleStatus}
        onRevokeAccess={handleRevokeAccess}
      />

      {/* Grant Access Modal */}
      <GrantAccessModal
        open={assignModalOpen}
        tool={assignTargetTool}
        employees={employees}
        departments={departments}
        assignEmployeeIds={assignEmployeeIds}
        setAssignEmployeeIds={setAssignEmployeeIds}
        assignSearch={assignSearch}
        setAssignSearch={setAssignSearch}
        assignDeptFilter={assignDeptFilter}
        setAssignDeptFilter={setAssignDeptFilter}
        saving={saving}
        onGrant={handleGrantAccess}
        onClose={() => setAssignModalOpen(false)}
      />
    </div>
  );
}