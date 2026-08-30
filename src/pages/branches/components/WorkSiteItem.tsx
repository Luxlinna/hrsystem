import { memo } from "react";
import type { WorkSite } from "./BranchWorkSitesSection";

interface WorkSiteItemProps {
  site: WorkSite;
  canManage: boolean;
  editingSiteId: string | null;
  editingSiteName: string;
  setEditingSiteName: (name: string) => void;
  editingSiteAddress: string;
  setEditingSiteAddress: (addr: string) => void;
  locatingEdit: boolean;
  savingSite: boolean;
  onUseCurrentLocation: (setter: (v: string) => void, setLoc: (v: boolean) => void) => void;
  setLocatingEdit: (v: boolean) => void;
  onStartEdit: (site: WorkSite) => void;
  onCancelEdit: () => void;
  onSaveEdit: (site: WorkSite) => void;
  onSetDefault: (site: WorkSite) => void;
  onDeleteSite: (site: WorkSite) => void;
}

export const WorkSiteItem = memo(function WorkSiteItem({
  site,
  canManage,
  editingSiteId,
  editingSiteName,
  setEditingSiteName,
  editingSiteAddress,
  setEditingSiteAddress,
  locatingEdit,
  savingSite,
  onUseCurrentLocation,
  setLocatingEdit,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onSetDefault,
  onDeleteSite,
}: WorkSiteItemProps) {
  if (editingSiteId === site.id) {
    return (
      <div className="p-3 rounded-xl border border-gray-300 bg-white text-xs space-y-2">
        <input
          type="text"
          value={editingSiteName}
          onChange={(e) => setEditingSiteName(e.target.value)}
          className="w-full px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-lg"
          placeholder="Site Name"
        />
        <div className="relative">
          <input
            type="text"
            value={editingSiteAddress}
            onChange={(e) => setEditingSiteAddress(e.target.value)}
            className="w-full px-2.5 pr-7 py-1 text-xs bg-white border border-gray-300 rounded-lg"
            placeholder="Address"
          />
          <button
            type="button"
            onClick={() => onUseCurrentLocation(setEditingSiteAddress, setLocatingEdit)}
            disabled={locatingEdit}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#253C7D] cursor-pointer"
          >
            <i className={locatingEdit ? "ri-loader-4-line animate-spin text-xs" : "ri-map-pin-user-line text-xs"} />
          </button>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancelEdit} className="px-2 py-0.5 text-xs text-gray-500 cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSaveEdit(site)}
            disabled={savingSite}
            className="px-2 py-0.5 text-xs font-bold bg-[#253C7D] text-white rounded-lg cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
        site.is_default ? "bg-amber-50/50 border-amber-200" : "bg-white border-gray-100"
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-gray-800 truncate">{site.name}</span>
          {site.is_default && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              Default
            </span>
          )}
        </div>
        {site.description && <p className="text-[11px] text-gray-400 truncate">{site.description}</p>}
      </div>

      {canManage && (
        <div className="flex items-center gap-1 shrink-0">
          {!site.is_default && (
            <button
              type="button"
              onClick={() => onSetDefault(site)}
              className="px-2 py-0.5 text-[10px] text-gray-600 hover:bg-gray-100 rounded-md border border-gray-200 cursor-pointer"
            >
              Make Default
            </button>
          )}
          <button
            type="button"
            onClick={() => onStartEdit(site)}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-[#253C7D] cursor-pointer"
          >
            <i className="ri-edit-line text-xs" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteSite(site)}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-rose-600 cursor-pointer"
          >
            <i className="ri-delete-bin-line text-xs" />
          </button>
        </div>
      )}
    </div>
  );
});
