import { memo } from "react";

interface AssetCategoryFilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  featureFilter: string;
  setFeatureFilter: (f: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
}

export const AssetCategoryFilterBar = memo(function AssetCategoryFilterBar({
  searchQuery,
  setSearchQuery,
  featureFilter,
  setFeatureFilter,
  statusFilter,
  setStatusFilter,
}: AssetCategoryFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Search Box with blue search button attached on right */}
      <div className="flex rounded-sm overflow-hidden border border-slate-300 bg-white max-w-sm w-full shadow-2xs focus-within:border-[#253C7D] h-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="flex-1 px-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none bg-white"
        />
        <button
          type="button"
          className="px-3 bg-[#253C7D] hover:bg-[#1E2E5D] text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <i className="ri-search-line text-xs" />
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2">
        {/* Features Filter Pill */}
        <div className="relative">
          <select
            value={featureFilter}
            onChange={(e) => setFeatureFilter(e.target.value)}
            className="appearance-none px-4 py-1.5 pr-8 rounded-full border border-slate-300 text-xs text-slate-600 bg-white hover:border-slate-400 focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-2xs"
          >
            <option value="All">Features</option>
            <option value="Track Serial Number">Track Serial Number</option>
            <option value="Track Warranty">Track Warranty</option>
            <option value="Track Tagging">Track Tagging</option>
            <option value="Allow Request">Allow Request</option>
            <option value="Manage Quantity">Manage Quantity</option>
          </select>
          <i className="ri-arrow-down-s-line text-slate-400 text-xs absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Status Filter Pill */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none px-4 py-1.5 pr-8 rounded-full border border-slate-300 text-xs text-slate-600 bg-white hover:border-slate-400 focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-2xs"
          >
            <option value="All">Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <i className="ri-arrow-down-s-line text-slate-400 text-xs absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  );
});
