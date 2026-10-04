import { useDivisions } from "../hooks/useDivisions";
import { DivisionsTable } from "./divisions/DivisionsTable";
import { CreateOrEditDivisionForm } from "./divisions/CreateOrEditDivisionForm";

interface BranchDivisionsSectionProps {
  branchId?: string;
  canManage?: boolean;
}

export function BranchDivisionsSection({
  branchId,
  canManage = true,
}: BranchDivisionsSectionProps) {
  const {
    divisions,
    employees,
    loading,
    saving,
    currentView,
    selectedDivision,
    openCreate,
    openEdit,
    openView,
    closeForm,
    handleSaveDivision,
    handleToggleStatus,
    handleDeleteDivision,
  } = useDivisions(branchId);

  if (currentView === "create" || currentView === "edit" || currentView === "view") {
    return (
      <CreateOrEditDivisionForm
        editingDivision={selectedDivision}
        employees={employees}
        isReadOnly={currentView === "view"}
        saving={saving}
        onBack={closeForm}
        onSave={handleSaveDivision}
        onSwitchToEdit={() => {
          if (selectedDivision) openEdit(selectedDivision);
        }}
      />
    );
  }

  return (
    <DivisionsTable
      divisions={divisions}
      loading={loading}
      canManage={canManage}
      onCreateNew={openCreate}
      onView={openView}
      onEdit={openEdit}
      onToggleStatus={handleToggleStatus}
      onDelete={handleDeleteDivision}
    />
  );
}
