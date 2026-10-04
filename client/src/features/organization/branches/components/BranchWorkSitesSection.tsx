import { memo } from "react";
import { useWorkSites } from "../hooks/useWorkSites";
import { SitesTable } from "./sites/SitesTable";
import { CreateOrEditSiteForm } from "./sites/CreateOrEditSiteForm";

export type { WorkSite } from "../hooks/useWorkSites";

interface BranchWorkSitesSectionProps {
  branchId: string;
  branchName?: string;
  canManage: boolean;
}

export const BranchWorkSitesSection = memo(function BranchWorkSitesSection({
  branchId,
  branchName = "Business Unit",
  canManage,
}: BranchWorkSitesSectionProps) {
  const {
    sites,
    sitesLoading,
    currentView,
    selectedSite,
    savingSite,
    openCreate,
    openEdit,
    openView,
    closeForm,
    handleSubmitSite,
    handleToggleStatus,
    handleDeleteSite,
  } = useWorkSites(branchId);

  if (currentView === "create" || currentView === "edit" || currentView === "view") {
    return (
      <CreateOrEditSiteForm
        branchId={branchId}
        companyName={branchName}
        editingSite={selectedSite}
        isReadOnly={currentView === "view"}
        saving={savingSite}
        onBack={closeForm}
        onSave={handleSubmitSite}
        onSwitchToEdit={canManage && selectedSite ? () => openEdit(selectedSite) : undefined}
      />
    );
  }

  return (
    <SitesTable
      sites={sites}
      sitesLoading={sitesLoading}
      canManage={canManage}
      onCreateNew={openCreate}
      onView={openView}
      onEdit={openEdit}
      onToggleStatus={handleToggleStatus}
      onDelete={handleDeleteSite}
    />
  );
});
