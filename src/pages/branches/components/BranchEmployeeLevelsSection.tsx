import { useEmployeeLevels } from "../hooks/useEmployeeLevels";
import { EmployeeLevelsTable } from "./employeeLevels/EmployeeLevelsTable";
import { EmployeeLevelModal } from "./employeeLevels/EmployeeLevelModal";

interface BranchEmployeeLevelsSectionProps {
  branchId?: string;
  canManage?: boolean;
}

export function BranchEmployeeLevelsSection({
  branchId,
  canManage = true,
}: BranchEmployeeLevelsSectionProps) {
  const {
    employeeLevels,
    loading,
    saving,
    isModalOpen,
    modalMode,
    selectedEmployeeLevel,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSaveEmployeeLevel,
    handleToggleStatus,
    handleDeleteEmployeeLevel,
  } = useEmployeeLevels(branchId);

  return (
    <>
      <EmployeeLevelsTable
        employeeLevels={employeeLevels}
        loading={loading}
        canManage={canManage}
        onCreateNew={openCreate}
        onView={openView}
        onEdit={openEdit}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteEmployeeLevel}
      />

      <EmployeeLevelModal
        isOpen={isModalOpen}
        mode={modalMode}
        employeeLevel={selectedEmployeeLevel}
        saving={saving}
        onClose={closeModal}
        onSave={handleSaveEmployeeLevel}
        onSwitchToEdit={() => {
          if (selectedEmployeeLevel) openEdit(selectedEmployeeLevel);
        }}
      />
    </>
  );
}
