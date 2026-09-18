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
    <>
      {/* 1. Asset Category */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-4 text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
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
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-2xs"
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
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-4 text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Name <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-8">
          <input
            type="text"
            required
            value={assetForm.name}
            onChange={(e) => setAssetForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Name"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#253C7D] shadow-2xs"
          />
        </div>
      </div>

      {/* 3. Purchase Date */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-4 text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Purchase Date <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-8 relative">
          <input
            type="date"
            required
            value={assetForm.purchase_date || ""}
            onChange={(e) => setAssetForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#253C7D] shadow-2xs"
          />
        </div>
      </div>

      {/* 4. Description */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
        <label className="sm:col-span-4 text-xs font-bold text-slate-700 sm:text-right sm:pr-4 sm:pt-2">
          Description
        </label>
        <div className="sm:col-span-8">
          <textarea
            rows={3}
            value={assetForm.description || ""}
            onChange={(e) => setAssetForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#253C7D] shadow-2xs resize-y"
          />
        </div>
      </div>

      {/* 5. Condition */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-4 text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Condition <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-8">
          <select
            required
            value={assetForm.condition || "New"}
            onChange={(e) => setAssetForm((prev) => ({ ...prev, condition: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-2xs"
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
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-4 text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Price
        </label>
        <div className="sm:col-span-8 flex rounded-xl border border-slate-300 bg-white overflow-hidden shadow-2xs focus-within:border-[#253C7D]">
          <span className="px-3.5 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs uppercase border-r border-slate-200 select-none flex items-center">
            USD
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={assetForm.price ?? 0}
            onChange={(e) => setAssetForm((prev) => ({ ...prev, price: e.target.value }))}
            placeholder="0"
            className="flex-1 px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none"
          />
        </div>
      </div>

      {/* 7. Site with BU Lock */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-4 text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Site <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-8">
          {activeBranchName ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-blue-50/60 border border-blue-200 text-xs font-black text-slate-900 flex items-center justify-between shadow-2xs">
                <span className="flex items-center gap-2 text-[#253C7D]">
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
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-2xs"
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
                title="Refresh Work Sites / Branches"
                className="w-10 h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0"
              >
                <i className={`ri-refresh-line text-base ${refreshingSites ? "animate-spin text-[#253C7D]" : ""}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
