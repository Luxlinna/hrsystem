import { memo } from "react";
import { useWorkSites } from "../hooks/useWorkSites";
import { WorkSiteItem } from "./WorkSiteItem";
import { WorkSiteModal } from "./WorkSiteModal";

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
    modalOpen,
    editingSite,
    savingSite,
    openAddModal,
    openEditModal,
    closeModal,
    handleSubmitSite,
    handleSetDefault,
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
        {canManage && (
          <button
            type="button"
            onClick={openAddModal}
            className="text-[11px] font-semibold text-[#253C7D] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <i className="ri-add-line" /> Add Site
          </button>
        )}
      </div>

      {sitesLoading ? (
        <p className="text-xs text-gray-400 py-2">Loading work sites...</p>
      ) : sites.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center">
          <p className="text-xs text-gray-400 italic">No work sites configured for this branch.</p>
          {canManage && (
            <button
              type="button"
              onClick={openAddModal}
              className="mt-2 text-xs font-semibold text-[#253C7D] hover:underline cursor-pointer"
            >
              + Add first site (e.g. Kampong Thom Site)
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {sites.map((site) => (
            <WorkSiteItem
              key={site.id}
              site={site}
              canManage={canManage}
              onEdit={openEditModal}
              onSetDefault={handleSetDefault}
              onDeleteSite={handleDeleteSite}
            />
          ))}
        </div>
      )}

      {/* Full Work Site Modal matching BranchModal style */}
      <WorkSiteModal
        isOpen={modalOpen}
        editingSite={editingSite}
        saving={savingSite}
        onClose={closeModal}
        onSubmit={handleSubmitSite}
      />
    </div>
  );
});
