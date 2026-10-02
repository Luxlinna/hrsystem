import { RecycleBinHeader } from "./components/RecycleBinHeader";
import { RecycleBinStatsRow } from "./components/RecycleBinStatsRow";
import { RecycleBinFilterChips } from "./components/RecycleBinFilterChips";
import { RecycleBinListView } from "./components/RecycleBinListView";
import { RecycleBinConfirmModal } from "./components/RecycleBinConfirmModal";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useRecycleBin } from "./hooks/useRecycleBin";

export default function RecycleBinPage() {
  const {
    isAdmin,
    items,
    loading,
    filter,
    setFilter,
    filteredItems,
    counts,
    loadItems,
    confirming,
    setConfirming,
    working,
    restore,
    selectedIds,
    toggleSelectItem,
    toggleSelectAll,
    clearSelection,
    handleBulkRestore,
    handleConfirmBulkDelete,
    handleConfirmDeleteSingle,
    handleExecuteDelete,
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
  } = useRecycleBin();

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F8F6] p-6 font-sans">
        <RecycleBinHeader working={false} onRefresh={() => {}} />
        <PartnerBranchPrivacyShield
          moduleName="Recycle Bin"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6] p-6 font-sans">
      {/* Header */}
      <RecycleBinHeader
        working={working}
        onRefresh={loadItems}
      />

      {/* Stats KPI Row */}
      <RecycleBinStatsRow
        totalItems={items.length}
        activeModulesCount={counts.length}
      />

      {/* Module filter chips */}
      <RecycleBinFilterChips
        filter={filter}
        setFilter={setFilter}
        totalCount={items.length}
        counts={counts}
      />

      {/* Soft-deleted records list */}
      <RecycleBinListView
        loading={loading}
        items={filteredItems}
        isAdmin={isAdmin}
        working={working}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelectItem}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={clearSelection}
        onRestore={restore}
        onBulkRestore={handleBulkRestore}
        onConfirmDelete={handleConfirmDeleteSingle}
        onConfirmBulkDelete={handleConfirmBulkDelete}
      />

      {/* Delete forever dialog (Single & Bulk) */}
      <RecycleBinConfirmModal
        confirming={confirming}
        working={working}
        onCancel={() => setConfirming(null)}
        onConfirm={handleExecuteDelete}
      />

      <p className="text-xs text-gray-400 mt-6">
        Note: personal notifications and system configuration are permanently deleted by design and never appear here.
      </p>
    </div>
  );
}
