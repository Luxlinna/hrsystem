import React from "react";
import type { AssetFormState, Branch } from "../../types";
import { ASSET_CATEGORIES, ASSET_CONDITIONS } from "../../constants";

interface AssetModalFormFieldsProps {
  assetForm: AssetFormState;
  setAssetForm: React.Dispatch<React.SetStateAction<AssetFormState>>;
  branches: Branch[];
  activeBranchName?: string | null;
  onRefreshSites?: () => void;
  refreshingSites: boolean;
}

export const AssetModalFormFields: React.FC<AssetModalFormFieldsProps> = ({
  assetForm,
  setAssetForm,
  branches,
  activeBranchName,
  onRefreshSites,
  refreshingSites,
}) => {
  return (
    <div className="space-y-3.5">
      {/* 1. Asset Category */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
        <label className="sm:col-span-4 text-xs font-semibold text-slate-700 sm:text-right sm:pr-2">
          Asset Category <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-8">
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
            className="w-full px-3 py-1.5 rounded-sm bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#2585c8] cursor-pointer"
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
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
        <label className="sm:col-span-4 text-xs font-semibold text-slate-700 sm:text-right sm:pr-2">
          Name <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-8">
          <input
            type="text"
            required
            value={assetForm.name}
            onChange={(e) => setAssetForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Name"
            className="w-full px-3 py-1.5 rounded-sm bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#2585c8]"
          />
        </div>
      </div>

      {/* 3. Purchase Date */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
        <label className="sm:col-span-4 text-xs font-semibold text-slate-700 sm:text-right sm:pr-2">
          Purchase Date <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-8 relative">
          <input
            type="date"
            required
            value={assetForm.purchase_date || ""}
            onChange={(e) => setAssetForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
            placeholder="Purchase Date"
            className="w-full px-3 py-1.5 rounded-sm bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#2585c8]"
          />
        </div>
      </div>

      {/* 4. Description */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-start">
        <label className="sm:col-span-4 text-xs font-semibold text-slate-700 sm:text-right sm:pr-2 sm:pt-2">
          Description
        </label>
        <div className="sm:col-span-8">
          <textarea
            rows={3}
            value={assetForm.description || ""}
            onChange={(e) => setAssetForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
            className="w-full px-3 py-1.5 rounded-sm bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#2585c8] resize-y"
          />
        </div>
      </div>

      {/* 5. Condition */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
        <label className="sm:col-span-4 text-xs font-semibold text-slate-700 sm:text-right sm:pr-2">
          Condition <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-8">
          <select
            required
            value={assetForm.condition || ""}
            onChange={(e) => setAssetForm((prev) => ({ ...prev, condition: e.target.value }))}
            className="w-full px-3 py-1.5 rounded-sm bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#2585c8] cursor-pointer"
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
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
        <label className="sm:col-span-4 text-xs font-semibold text-slate-700 sm:text-right sm:pr-2">
          Price
        </label>
        <div className="sm:col-span-8 flex rounded-sm border border-slate-300 bg-white overflow-hidden focus-within:border-[#2585c8]">
          <span className="px-3 py-1.5 bg-slate-100 text-slate-600 font-semibold text-xs uppercase border-r border-slate-300 select-none flex items-center">
            USD
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={assetForm.price ?? 0}
            onChange={(e) => setAssetForm((prev) => ({ ...prev, price: e.target.value }))}
            placeholder="0"
            className="flex-1 px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
          />
        </div>
      </div>

      {/* 7. Site with Refresh Button */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
        <label className="sm:col-span-4 text-xs font-semibold text-slate-700 sm:text-right sm:pr-2">
          Site <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-8">
          {activeBranchName ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-1.5 rounded-sm bg-blue-50/60 border border-blue-200 text-xs font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#2585c8]">
                  <i className="ri-building-2-fill text-emerald-600 text-sm" />
                  <span>{activeBranchName}</span>
                </span>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Active BU
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  required
                  value={assetForm.branch_id || assetForm.site || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const matchedBranch = branches.find((b) => b.id === val || b.name === val);
                    setAssetForm((prev) => ({
                      ...prev,
                      branch_id: matchedBranch ? matchedBranch.id : val,
                      site: matchedBranch ? matchedBranch.name : val,
                    }));
                  }}
                  className="w-full px-3 py-1.5 pr-10 rounded-sm bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#2585c8] cursor-pointer"
                >
                  <option value="">Select</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={onRefreshSites}
                  disabled={refreshingSites}
                  title="Refresh Sites"
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  <i className={`ri-refresh-line text-xs ${refreshingSites ? "animate-spin text-[#2585c8]" : ""}`} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

