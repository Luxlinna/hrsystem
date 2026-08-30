import { memo } from "react";

interface NewWorkSiteFormProps {
  newSiteName: string;
  setNewSiteName: (name: string) => void;
  newSiteAddress: string;
  setNewSiteAddress: (addr: string) => void;
  savingSite: boolean;
  locatingNew: boolean;
  onUseCurrentLocation: (setter: (v: string) => void, setLoc: (v: boolean) => void) => void;
  setLocatingNew: (v: boolean) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export const NewWorkSiteForm = memo(function NewWorkSiteForm({
  newSiteName,
  setNewSiteName,
  newSiteAddress,
  setNewSiteAddress,
  savingSite,
  locatingNew,
  onUseCurrentLocation,
  setLocatingNew,
  onCancel,
  onSubmit,
}: NewWorkSiteFormProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 mb-3 space-y-2.5">
      <p className="text-[12px] font-bold text-gray-800">New Work Site</p>
      <input
        type="text"
        placeholder="Site name (e.g. Building A, Floor 3)"
        value={newSiteName}
        onChange={(e) => setNewSiteName(e.target.value)}
        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D]"
      />
      <div className="relative">
        <input
          type="text"
          placeholder="Site location / address"
          value={newSiteAddress}
          onChange={(e) => setNewSiteAddress(e.target.value)}
          className="w-full px-3 pr-8 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D]"
        />
        <button
          type="button"
          onClick={() => onUseCurrentLocation(setNewSiteAddress, setLocatingNew)}
          disabled={locatingNew}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#253C7D] cursor-pointer"
          title="Use current location"
        >
          <i className={locatingNew ? "ri-loader-4-line animate-spin text-xs" : "ri-map-pin-user-line text-xs"} />
        </button>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded-lg cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={savingSite || !newSiteName.trim() || !newSiteAddress.trim()}
          className="px-3 py-1 text-xs font-bold bg-[#253C7D] text-white rounded-lg hover:bg-[#1E3064] disabled:opacity-50 cursor-pointer"
        >
          {savingSite ? "Adding..." : "Add Site"}
        </button>
      </div>
    </div>
  );
});
