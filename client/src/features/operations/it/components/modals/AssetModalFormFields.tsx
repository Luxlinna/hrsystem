import React from "react";
import type { AssetFormState, Branch } from "../../types";
import { ASSET_CATEGORIES, ASSET_CONDITIONS } from "../../constants";

interface AssetModalFormFieldsProps {
  assetForm: AssetFormState;
  setAssetForm: React.Dispatch<React.SetStateAction<AssetFormState>>;
  branches: Branch[];
  workSites?: Array<{ id: string; name: string; branch_id: string | null }>;
  activeBranchName?: string | null;
  onRefreshSites?: () => void;
  refreshingSites: boolean;
}

export const AssetModalFormFields: React.FC<AssetModalFormFieldsProps> = ({
  assetForm,
  setAssetForm,
  branches,
  workSites = [],
  activeBranchName,
  onRefreshSites,
  refreshingSites,
}) => {
  const selectedBranchId = assetForm.branch_id || (activeBranchName ? branches.find((b) => b.name === activeBranchName)?.id : branches[0]?.id) || "";
  const currentBranch = branches.find((b) => b.id === selectedBranchId);

  const availableSites = workSites.filter((s) => !s.branch_id || s.branch_id === selectedBranchId);

  return (
    <div className="space-y-3.5">
      {/* 1. Asset Category */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-4">
        <label className="text-xs font-medium text-gray-700 sm:text-right pr-1">
          Asset Category <span className="text-red-500">*</span>
        </label>
        <div>
          <select
            required
            value={assetForm.category || assetForm.type || ""}
            onChange={(e) => {
              const val = e.target.value;
              setAssetForm((prev) => ({
                ...prev,
                category: val,
                type: val,
              }));
            }}
            className="w-full px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-800 bg-white focus:outline-none focus:border-[#3498db] cursor-pointer transition-colors"
          >
            <option value="">Select</option>
            {ASSET_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Name */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-4">
        <label className="text-xs font-medium text-gray-700 sm:text-right pr-1">
          Name <span className="text-red-500">*</span>
        </label>
        <div>
          <input
            type="text"
            required
            value={assetForm.name}
            onChange={(e) => setAssetForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Name"
            className="w-full px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#3498db] bg-white transition-colors"
          />
        </div>
      </div>

      {/* 3. Purchase Date */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-4">
        <label className="text-xs font-medium text-gray-700 sm:text-right pr-1">
          Purchase Date <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="date"
            required
            value={assetForm.purchase_date || ""}
            onChange={(e) => setAssetForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
            placeholder="Purchase Date"
            className="w-full px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-800 focus:outline-none focus:border-[#3498db] bg-white transition-colors"
          />
        </div>
      </div>

      {/* 4. Description */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start gap-4">
        <label className="text-xs font-medium text-gray-700 sm:text-right pr-1 pt-1.5">
          Description
        </label>
        <div>
          <textarea
            rows={3}
            value={assetForm.description || ""}
            onChange={(e) => setAssetForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
            className="w-full px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#3498db] bg-white resize-y transition-colors"
          />
        </div>
      </div>

      {/* 5. Condition */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-4">
        <label className="text-xs font-medium text-gray-700 sm:text-right pr-1">
          Condition <span className="text-red-500">*</span>
        </label>
        <div>
          <select
            required
            value={assetForm.condition || ""}
            onChange={(e) => setAssetForm((prev) => ({ ...prev, condition: e.target.value }))}
            className="w-full px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-800 bg-white focus:outline-none focus:border-[#3498db] cursor-pointer transition-colors"
          >
            <option value="">Select</option>
            {ASSET_CONDITIONS.map((cond) => (
              <option key={cond} value={cond}>
                {cond}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 6. Price */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-4">
        <label className="text-xs font-medium text-gray-700 sm:text-right pr-1">
          Price
        </label>
        <div className="flex rounded border border-gray-300 bg-white overflow-hidden focus-within:border-[#3498db] transition-colors">
          <span className="px-3 py-1.5 bg-gray-50 text-gray-600 font-medium text-xs uppercase border-r border-gray-300 select-none flex items-center">
            USD
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={assetForm.price ?? 0}
            onChange={(e) => setAssetForm((prev) => ({ ...prev, price: e.target.value }))}
            placeholder="0"
            className="flex-1 px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none bg-white"
          />
        </div>
      </div>

      {/* 7. Business Unit (BU) Selector */}
      {branches.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-4">
          <label className="text-xs font-medium text-gray-700 sm:text-right pr-1">
            Business Unit <span className="text-red-500">*</span>
          </label>
          <div>
            <select
              required
              value={selectedBranchId}
              onChange={(e) => {
                const bId = e.target.value;
                const bObj = branches.find((b) => b.id === bId);
                setAssetForm((prev) => ({
                  ...prev,
                  branch_id: bId,
                  site: bObj?.name || prev.site,
                }));
              }}
              className="w-full px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-800 bg-white focus:outline-none focus:border-[#3498db] cursor-pointer transition-colors"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 8. Site / Location inside the selected BU with Refresh Button */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-4">
        <label className="text-xs font-medium text-gray-700 sm:text-right pr-1">
          Site <span className="text-red-500">*</span>
        </label>
        <div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <select
                required
                value={assetForm.site || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setAssetForm((prev) => ({
                    ...prev,
                    site: val,
                  }));
                }}
                className="w-full px-3 py-1.5 pr-8 rounded border border-gray-300 text-xs text-gray-800 bg-white focus:outline-none focus:border-[#3498db] cursor-pointer transition-colors"
              >
                <option value="">Select Site Location</option>
                {availableSites.length > 0 ? (
                  availableSites.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))
                ) : (
                  <option value={currentBranch?.name || "Main Office"}>
                    {currentBranch ? `${currentBranch.name} (Main Office)` : "Main Office"}
                  </option>
                )}
              </select>

              <button
                type="button"
                onClick={onRefreshSites}
                disabled={refreshingSites}
                title="Refresh Sites"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#3498db] p-1 cursor-pointer transition-colors"
              >
                <i className={`ri-refresh-line text-xs ${refreshingSites ? "animate-spin text-[#3498db]" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

