import { useDepartments } from "../hooks/useDepartments";
import { DepartmentsTable } from "./departments/DepartmentsTable";
import { CreateOrEditDepartmentForm } from "./departments/CreateOrEditDepartmentForm";

interface BranchDepartmentsSectionProps {
  branchId?: string;
  canManage?: boolean;
}

export function BranchDepartmentsSection({
  branchId,
  canManage = true,
}: BranchDepartmentsSectionProps) {
  const {
    departments,
    employees,
    loading,
    saving,
    currentView,
    selectedDepartment,
    openCreate,
    openEdit,
    openView,
    closeForm,
    handleSaveDepartment,
    handleToggleStatus,
    handleDeleteDepartment,
  } = useDepartments(branchId);

  if (currentView === "create" || currentView === "edit" || currentView === "view") {
    return (
      <CreateOrEditDepartmentForm
        editingDepartment={selectedDepartment}
        departments={departments}
        employees={employees}
        isReadOnly={currentView === "view"}
        saving={saving}
        onBack={closeForm}
        onSave={handleSaveDepartment}
        onSwitchToEdit={() => {
          if (selectedDepartment) openEdit(selectedDepartment);
        }}
      />
    );
  }

  return (
    <DepartmentsTable
      departments={departments}
      loading={loading}
      canManage={canManage}
      onCreateNew={openCreate}
      onView={openView}
      onEdit={openEdit}
      onToggleStatus={handleToggleStatus}
      onDelete={handleDeleteDepartment}
    />
  );
}
