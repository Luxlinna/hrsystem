import { RecycleBinHeader } from "./components/RecycleBinHeader";
import { RecycleBinStatsRow } from "./components/RecycleBinStatsRow";
import { RecycleBinFilterChips } from "./components/RecycleBinFilterChips";
import { RecycleBinListView } from "./components/RecycleBinListView";
import { RecycleBinConfirmModal } from "./components/RecycleBinConfirmModal";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useRecycleBin } from "./hooks/useRecycleBin";

export default function RecycleBinPage() {
  const {
    isAdmin, items, loading, filter, setFilter, filteredItems,
    counts, loadItems, confirming, setConfirming, working,
    restore, selectedIds, toggleSelectItem, toggleSelectAll,
    clearSelection, handleBulkRestore, handleConfirmBulkDelete,
    handleConfirmDeleteSingle, handleExecuteDelete, isPartnerBranchBlocked,
    userBranchName, userBranchId,
  } = useRecycleBin();

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-3 sm:p-6 lg:p-8 font-sans">
        <div className="max-w-6xl mx-auto space-y-5">
          <RecycleBinHeader working={false} onRefresh={() => {}} totalCount={0} />
          <PartnerBranchPrivacyShield
            moduleName="Recycle Bin"
            userBranchName={userBranchName}
            hasNoBranch={!userBranchId}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      <div className="flex-1 min-w-0">
        <div className="p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4 sm:space-y-5">
          {/* 1. Header */}
          <RecycleBinHeader
            working={working}
            totalCount={items.length}
            onRefresh={loadItems}
          />

          {/* 2. Stats Row */}
          <RecycleBinStatsRow
            totalItems={items.length}
            activeModulesCount={counts.length}
          />

          {/* 3. Module Filter Chips */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <RecycleBinFilterChips
              filter={filter}
              setFilter={setFilter}
              totalCount={items.length}
              counts={counts}
            />
          </div>

          {/* 4. Unified Data Table View */}
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

          {/* 5. Delete Confirm Dialog */}
          <RecycleBinConfirmModal
            confirming={confirming}
            working={working}
            onCancel={() => setConfirming(null)}
            onConfirm={handleExecuteDelete}
          />

          <p className="text-[11px] text-slate-400 text-center pt-2">
            Personal notifications and system configuration records are permanently purged by design and do not appear in Recycle Bin.
          </p>
        </div>
      </div>
    </div>
  );
}
