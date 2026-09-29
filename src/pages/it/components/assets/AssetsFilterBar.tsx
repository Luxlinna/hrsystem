import { memo, useState, useRef, useEffect } from "react";
import type { Branch, ITAsset } from "../../types";
import { ASSET_CATEGORIES, ASSET_CONDITIONS } from "../../constants";

interface AssetsFilterBarProps {
  assetSearch: string;
  setAssetSearch: (query: string) => void;
  assetTypeFilter: string;
  setAssetTypeFilter: (type: string) => void;
  assetStatusFilter: string;
  setAssetStatusFilter: (status: string) => void;
  assetConditionFilter?: string;
  setAssetConditionFilter?: (condition: string) => void;
  assetBranchFilter: string;
  setAssetBranchFilter: (branch: string) => void;
  dateRangeLabel?: string;
  setDateRangeLabel?: (label: string) => void;
  assetViewMode: "table" | "cards";
  setAssetViewMode: (mode: "table" | "cards") => void;
  branches: Branch[];
  selectedAssetIds?: string[];
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onBulkDelete?: () => void;
  onExport?: (format: "csv" | "excel" | "json") => void;
  onImport?: () => void;
  assets?: ITAsset[];
}

export const AssetsFilterBar = memo(function AssetsFilterBar({
  assetSearch,
  setAssetSearch,
  assetTypeFilter,
  setAssetTypeFilter,
  assetStatusFilter,
  setAssetStatusFilter,
  assetConditionFilter = "all",
  setAssetConditionFilter,
  assetBranchFilter,
  setAssetBranchFilter,
  dateRangeLabel = "01/01/2026 - 31/12/2026",
  setDateRangeLabel,
  branches,
  selectedAssetIds = [],
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onExport,
  onImport,
}: AssetsFilterBarProps) {
  const [searchInput, setSearchInput] = useState(assetSearch);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const bulkRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Synchronize local search input with prop
  useEffect(() => {
    setSearchInput(assetSearch);
  }, [assetSearch]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bulkRef.current && !bulkRef.current.contains(e.target as Node)) {
        setShowBulkMenu(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setShowDateMenu(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAssetSearch(searchInput);
  };

  const hasActiveFilters =
    assetTypeFilter !== "all" ||
    assetStatusFilter !== "all" ||
    assetConditionFilter !== "all" ||
    assetBranchFilter !== "all";

  const clearAllFilters = () => {
    setAssetTypeFilter("all");
    setAssetStatusFilter("all");
    if (setAssetConditionFilter) setAssetConditionFilter("all");
    setAssetBranchFilter("all");
    setShowFilterMenu(false);
  };

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-4 select-none">
      {/* Search Bar matching Screenshot 1 */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex items-center rounded-sm border border-slate-300 focus-within:border-[#2585c8] bg-white overflow-hidden shadow-2xs max-w-xs w-full transition-colors h-8"
      >
        <input
          type="text"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            if (!e.target.value) setAssetSearch("");
          }}
          placeholder="Search..."
          className="flex-1 px-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setAssetSearch("");
            }}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            title="Clear Search"
          >
            <i className="ri-close-line text-xs" />
          </button>
        )}
        <button
          type="submit"
          className="bg-[#2585c8] hover:bg-[#1f73b0] text-white px-3 h-full flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="Search"
        >
          <i className="ri-search-line text-xs" />
        </button>
      </form>

      {/* Right Toolbar Action Buttons matching Screenshot 1 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Bulk Action Pill */}
        <div className="relative" ref={bulkRef}>
          <button
            type="button"
            onClick={() => setShowBulkMenu((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#62a7e0] bg-white hover:bg-[#f0f7fd] text-[#2585c8] text-xs font-medium transition-all shadow-2xs cursor-pointer h-7"
          >
            <span>Bulk Action</span>
            <i className="ri-arrow-down-s-line text-xs" />
          </button>

          {showBulkMenu && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  onSelectAll?.();
                  setShowBulkMenu(false);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
              >
                <i className="ri-checkbox-multiple-line text-slate-400" />
                Select All
              </button>
              {selectedAssetIds.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onClearSelection?.();
                      setShowBulkMenu(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                  >
                    <i className="ri-checkbox-blank-line text-slate-400" />
                    Clear Selection ({selectedAssetIds.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onBulkDelete?.();
                      setShowBulkMenu(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                  >
                    <i className="ri-delete-bin-line text-rose-500" />
                    Delete Selected ({selectedAssetIds.length})
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Cloud Upload / Import Button */}
        <button
          type="button"
          onClick={onImport}
          title="Import Assets (CSV / Excel)"
          className="w-7 h-7 rounded-sm border border-[#62a7e0] bg-white hover:bg-[#f0f7fd] text-[#2585c8] flex items-center justify-center transition-all shadow-2xs cursor-pointer"
        >
          <i className="ri-upload-cloud-2-line text-xs" />
        </button>

        {/* Cloud Download / Export Button */}
        <div className="relative" ref={exportRef}>
          <button
            type="button"
            onClick={() => setShowExportMenu((prev) => !prev)}
            title="Export Assets"
            className="w-7 h-7 rounded-sm border border-[#62a7e0] bg-white hover:bg-[#f0f7fd] text-[#2585c8] flex items-center justify-center transition-all shadow-2xs cursor-pointer"
          >
            <i className="ri-download-cloud-2-line text-xs" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs">
              <div className="px-3 py-1 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                Export Data
              </div>
              <button
                type="button"
                onClick={() => {
                  onExport?.("csv");
                  setShowExportMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <i className="ri-file-text-line text-emerald-600" />
                Export as CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  onExport?.("excel");
                  setShowExportMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <i className="ri-file-excel-line text-emerald-700" />
                Export as Excel
              </button>
              <button
                type="button"
                onClick={() => {
                  onExport?.("json");
                  setShowExportMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <i className="ri-code-s-slash-line text-amber-600" />
                Export as JSON
              </button>
            </div>
          )}
        </div>

        {/* Date Range Pill */}
        <div className="relative" ref={dateRef}>
          <button
            type="button"
            onClick={() => setShowDateMenu((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#62a7e0] bg-white hover:bg-[#f0f7fd] text-[#2585c8] text-xs font-medium transition-all shadow-2xs cursor-pointer h-7"
          >
            <i className="ri-calendar-line text-xs" />
            <span>{dateRangeLabel}</span>
            <i className="ri-arrow-down-s-line text-xs" />
          </button>

          {showDateMenu && (
            <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs">
              <div className="px-3 py-1 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                Filter by Year / Range
              </div>
              {[
                "01/01/2026 - 31/12/2026",
                "01/01/2025 - 31/12/2025",
                "Last 30 Days",
                "Last 90 Days",
                "All Recorded Dates",
              ].map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => {
                    setDateRangeLabel?.(range);
                    setShowDateMenu(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left flex items-center justify-between font-medium ${
                    dateRangeLabel === range
                      ? "bg-slate-50 text-[#2585c8] font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{range}</span>
                  {dateRangeLabel === range && <i className="ri-check-line text-[#2585c8]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Pill */}
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => setShowFilterMenu((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#62a7e0] bg-white hover:bg-[#f0f7fd] text-[#2585c8] text-xs font-medium transition-all shadow-2xs cursor-pointer h-7 ${
              hasActiveFilters ? "ring-2 ring-[#2585c8]/20 font-bold" : ""
            }`}
          >
            <span>Filter</span>
            <i className="ri-arrow-down-s-line text-xs" />
          </button>

          {showFilterMenu && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-lg shadow-xl border border-slate-200 p-4 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Filter Assets
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-[11px] font-semibold text-[#2585c8] hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Asset Category
                </label>
                <select
                  value={assetTypeFilter}
                  onChange={(e) => setAssetTypeFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#2585c8]"
                >
                  <option value="all">All Categories</option>
                  {ASSET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Status</label>
                <select
                  value={assetStatusFilter}
                  onChange={(e) => setAssetStatusFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#2585c8]"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active / Deployed</option>
                  <option value="inventory">In Stock / Ready</option>
                  <option value="maintenance">Under Repair</option>
                  <option value="retired">Retired</option>
                </select>
              </div>

              {/* Condition Filter */}
              {setAssetConditionFilter && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Condition
                  </label>
                  <select
                    value={assetConditionFilter}
                    onChange={(e) => setAssetConditionFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#2585c8]"
                  >
                    <option value="all">All Conditions</option>
                    {ASSET_CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>
                        {cond}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Site / Branch Filter */}
              {branches.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Work Site / Branch
                  </label>
                  <select
                    value={assetBranchFilter}
                    onChange={(e) => setAssetBranchFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#2585c8]"
                  >
                    <option value="all">All Sites</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

