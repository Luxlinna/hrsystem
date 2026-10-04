import { usePositions } from "../hooks/usePositions";
import { PositionsTable } from "./positions/PositionsTable";
import { CreateOrEditPositionForm } from "./positions/CreateOrEditPositionForm";

interface BranchPositionsSectionProps {
  branchId?: string;
  canManage?: boolean;
}

export function BranchPositionsSection({
  branchId,
  canManage = true,
}: BranchPositionsSectionProps) {
  const {
    positions,
    loading,
    saving,
    currentView,
    selectedPosition,
    openCreate,
    openEdit,
    openView,
    closeForm,
    handleSavePosition,
    handleToggleStatus,
    handleDeletePosition,
    handleBulkDeletePositions,
    handleImportPositions,
  } = usePositions(branchId);

  if (currentView === "create" || currentView === "edit" || currentView === "view") {
    return (
      <CreateOrEditPositionForm
        editingPosition={selectedPosition}
        isReadOnly={currentView === "view"}
        saving={saving}
        onBack={closeForm}
        onSave={handleSavePosition}
        onSwitchToEdit={() => {
          if (selectedPosition) openEdit(selectedPosition);
        }}
      />
    );
  }

  return (
    <PositionsTable
      positions={positions}
      loading={loading}
      canManage={canManage}
      onCreateNew={openCreate}
      onView={openView}
      onEdit={openEdit}
      onToggleStatus={handleToggleStatus}
      onDelete={handleDeletePosition}
      onBulkDelete={handleBulkDeletePositions}
      onImport={handleImportPositions}
    />
  );
}

