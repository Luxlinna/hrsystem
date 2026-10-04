import { useJobStatuses } from "../hooks/useJobStatuses";
import { JobStatusesTable } from "./jobStatuses/JobStatusesTable";
import { CreateOrEditJobStatusForm } from "./jobStatuses/CreateOrEditJobStatusForm";

interface BranchJobStatusesSectionProps {
  branchId?: string;
  canManage?: boolean;
}

export function BranchJobStatusesSection({
  branchId,
  canManage = true,
}: BranchJobStatusesSectionProps) {
  const {
    jobStatuses,
    loading,
    saving,
    currentView,
    selectedJobStatus,
    openCreate,
    openEdit,
    openView,
    closeForm,
    handleSaveJobStatus,
    handleToggleStatus,
    handleDeleteJobStatus,
  } = useJobStatuses(branchId);

  if (currentView === "create" || currentView === "edit" || currentView === "view") {
    return (
      <CreateOrEditJobStatusForm
        editingJobStatus={selectedJobStatus}
        isReadOnly={currentView === "view"}
        saving={saving}
        onBack={closeForm}
        onSave={handleSaveJobStatus}
        onSwitchToEdit={() => {
          if (selectedJobStatus) openEdit(selectedJobStatus);
        }}
      />
    );
  }

  return (
    <JobStatusesTable
      jobStatuses={jobStatuses}
      loading={loading}
      canManage={canManage}
      onCreateNew={openCreate}
      onView={openView}
      onEdit={openEdit}
      onToggleStatus={handleToggleStatus}
      onDelete={handleDeleteJobStatus}
    />
  );
}
