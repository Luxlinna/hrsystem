import { memo } from "react";
import type { Branch } from "../../types";
import { ASSET_TYPE_CONFIG } from "../../constants";

interface AssetsFilterBarProps {
  assetSearch: string;
  setAssetSearch: (query: string) => void;
  assetTypeFilter: string;
  setAssetTypeFilter: (type: string) => void;
  assetStatusFilter: string;
  setAssetStatusFilter: (status: string) => void;
  assetBranchFilter: string;
  setAssetBranchFilter: (branch: string) => void;
  assetViewMode: "table" | "cards";
  setAssetViewMode: (mode: "table" | "cards") => void;
  branches: Branch[];
}

export const AssetsFilterBar = memo(function AssetsFilterBar({
  assetSearch,
  setAssetSearch,
  assetTypeFilter,
  setAssetTypeFilter,
  assetStatusFilter,
  setAssetStatusFilter,
  assetBranchFilter,
  setAssetBranchFilter,
  assetViewMode,
  setAssetViewMode,
  branches,
}: AssetsFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
      {/* Search Input */}
      <div className="relative flex-1">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          value={assetSearch}
          onChange={(e) => setAssetSearch(e.target.value)}
          placeholder="Search assets by device name, tag, serial, holder, branch..."
          className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
        />
        {assetSearch && (
          <button
            onClick={() => setAssetSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-circle-fill text-xs" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns & View Mode */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={assetTypeFilter}
          onChange={(e) => setAssetTypeFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          <option value="all">All Device Types</option>
          {Object.keys(ASSET_TYPE_CONFIG).map((t) => (
            <option key={t} value={t}>
              {ASSET_TYPE_CONFIG[t].label}
            </option>
          ))}
        </select>

        <select
          value={assetStatusFilter}
          onChange={(e) => setAssetStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active / Deployed</option>
          <option value="inventory">In Stock</option>
          <option value="maintenance">Under Repair</option>
          <option value="retired">Retired</option>
        </select>

        {branches.length > 0 && (
          <select
            value={assetBranchFilter}
            onChange={(e) => setAssetBranchFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[140px] truncate"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
          <button
            onClick={() => setAssetViewMode("table")}
            className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              assetViewMode === "table" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-table-line" />
          </button>
          <button
            onClick={() => setAssetViewMode("cards")}
            className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              assetViewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-layout-grid-fill" />
          </button>
        </div>
      </div>
    </div>
  );
});
