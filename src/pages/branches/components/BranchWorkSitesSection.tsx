import { memo } from "react";
import { useWorkSites } from "../hooks/useWorkSites";
import { WorkSiteItem } from "./WorkSiteItem";
import { NewWorkSiteForm } from "./NewWorkSiteForm";

export type { WorkSite } from "../hooks/useWorkSites";

interface BranchWorkSitesSectionProps {
  branchId: string;
  canManage: boolean;
}

export const BranchWorkSitesSection = memo(function BranchWorkSitesSection({
  branchId,
  canManage,
}: BranchWorkSitesSectionProps) {
  const {
    sites,
    sitesLoading,
    newSiteName,
    setNewSiteName,
    newSiteAddress,
    setNewSiteAddress,
    addingMode,
    setAddingMode,
    savingSite,
    editingSiteId,
    setEditingSiteId,
    editingSiteName,
    setEditingSiteName,
    editingSiteAddress,
    setEditingSiteAddress,
    locatingNew,
    setLocatingNew,
    locatingEdit,
    setLocatingEdit,
    handleUseCurrentLocation,
    handleAddSite,
    handleSetDefault,
    handleSaveEdit,
    handleDeleteSite,
  } = useWorkSites(branchId);

  return (
    <div className="p-5 border-b border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <i className="ri-building-2-line" /> Work Sites
          {sites.length > 0 && (
            <span className="bg-[#253C7D]/10 text-[#253C7D] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {sites.length}
            </span>
          )}
        </h3>
        {canManage && !addingMode && (
          <button
            onClick={() => setAddingMode(true)}
            className="text-[11px] font-semibold text-[#253C7D] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <i className="ri-add-line" /> Add Site
          </button>
        )}
      </div>

      {addingMode && (
        <NewWorkSiteForm
          newSiteName={newSiteName}
          setNewSiteName={setNewSiteName}
          newSiteAddress={newSiteAddress}
          setNewSiteAddress={setNewSiteAddress}
          savingSite={savingSite}
          locatingNew={locatingNew}
          onUseCurrentLocation={handleUseCurrentLocation}
          setLocatingNew={setLocatingNew}
          onCancel={() => setAddingMode(false)}
          onSubmit={handleAddSite}
        />
      )}

      {sitesLoading ? (
        <p className="text-xs text-gray-400 py-2">Loading work sites...</p>
      ) : sites.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-1">No work sites configured.</p>
      ) : (
        <div className="space-y-2">
          {sites.map((site) => (
            <WorkSiteItem
              key={site.id}
              site={site}
              canManage={canManage}
              editingSiteId={editingSiteId}
              editingSiteName={editingSiteName}
              setEditingSiteName={setEditingSiteName}
              editingSiteAddress={editingSiteAddress}
              setEditingSiteAddress={setEditingSiteAddress}
              locatingEdit={locatingEdit}
              savingSite={savingSite}
              onUseCurrentLocation={handleUseCurrentLocation}
              setLocatingEdit={setLocatingEdit}
              onStartEdit={(s) => {
                setEditingSiteId(s.id);
                setEditingSiteName(s.name);
                setEditingSiteAddress(s.description || "");
              }}
              onCancelEdit={() => setEditingSiteId(null)}
              onSaveEdit={handleSaveEdit}
              onSetDefault={handleSetDefault}
              onDeleteSite={handleDeleteSite}
            />
          ))}
        </div>
      )}
    </div>
  );
});
