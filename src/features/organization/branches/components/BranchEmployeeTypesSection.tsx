import { useEmployeeTypes } from "../hooks/useEmployeeTypes";
import { EmployeeTypesTable } from "./employeeTypes/EmployeeTypesTable";
import { CreateOrEditEmployeeTypeForm } from "./employeeTypes/CreateOrEditEmployeeTypeForm";

interface BranchEmployeeTypesSectionProps {
  branchId?: string;
  canManage?: boolean;
}

export function BranchEmployeeTypesSection({
  branchId,
  canManage = true,
}: BranchEmployeeTypesSectionProps) {
  const {
    employeeTypes,
    loading,
    saving,
    currentView,
    selectedEmployeeType,
    openCreate,
    openEdit,
    openView,
    closeForm,
    handleSaveEmployeeType,
    handleToggleStatus,
    handleDeleteEmployeeType,
  } = useEmployeeTypes(branchId);

  if (currentView === "create" || currentView === "edit" || currentView === "view") {
    return (
      <CreateOrEditEmployeeTypeForm
        editingEmployeeType={selectedEmployeeType}
        isReadOnly={currentView === "view"}
        saving={saving}
        onBack={closeForm}
        onSave={handleSaveEmployeeType}
        onSwitchToEdit={() => {
          if (selectedEmployeeType) openEdit(selectedEmployeeType);
        }}
      />
    );
  }

  return (
    <EmployeeTypesTable
      employeeTypes={employeeTypes}
      loading={loading}
      canManage={canManage}
      onCreateNew={openCreate}
      onView={openView}
      onEdit={openEdit}
      onToggleStatus={handleToggleStatus}
      onDelete={handleDeleteEmployeeType}
    />
  );
}
