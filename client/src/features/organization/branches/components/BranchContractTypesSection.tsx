import { useContractTypes } from "../hooks/useContractTypes";
import { ContractTypesTable } from "./contractTypes/ContractTypesTable";
import { CreateOrEditContractTypeForm } from "./contractTypes/CreateOrEditContractTypeForm";

interface BranchContractTypesSectionProps {
  branchId?: string;
  canManage?: boolean;
}

export function BranchContractTypesSection({
  branchId,
  canManage = true,
}: BranchContractTypesSectionProps) {
  const {
    contractTypes,
    loading,
    saving,
    currentView,
    selectedContractType,
    openCreate,
    openEdit,
    openView,
    closeForm,
    handleSaveContractType,
    handleToggleStatus,
    handleDeleteContractType,
  } = useContractTypes(branchId);

  if (currentView === "create" || currentView === "edit" || currentView === "view") {
    return (
      <CreateOrEditContractTypeForm
        editingContractType={selectedContractType}
        isReadOnly={currentView === "view"}
        saving={saving}
        onBack={closeForm}
        onSave={handleSaveContractType}
        onSwitchToEdit={() => {
          if (selectedContractType) openEdit(selectedContractType);
        }}
      />
    );
  }

  return (
    <ContractTypesTable
      contractTypes={contractTypes}
      loading={loading}
      canManage={canManage}
      onCreateNew={openCreate}
      onView={openView}
      onEdit={openEdit}
      onToggleStatus={handleToggleStatus}
      onDelete={handleDeleteContractType}
    />
  );
}
