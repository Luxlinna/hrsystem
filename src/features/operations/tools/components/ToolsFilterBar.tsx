import { memo } from "react";
import type { ToolsViewMode } from "../types";

interface ToolsFilterBarProps {
  categories: string[];
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  viewMode: ToolsViewMode;
  setViewMode: (v: ToolsViewMode) => void;
}

export const ToolsFilterBar = memo(function ToolsFilterBar({
  categories,
  categoryFilter,
  setCategoryFilter,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
}: ToolsFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* Category selector chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              categoryFilter === cat
                ? "bg-[#253C7D] text-white shadow-2xs"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="relative min-w-[220px]">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools catalog..."
            className="w-full pl-9 pr-8 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#253C7D] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-close-circle-fill text-xs" />
            </button>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-2xs">
          <button
            onClick={() => setViewMode("cards")}
            className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "cards" ? "bg-[#253C7D] text-white" : "text-gray-500 hover:text-gray-800"
            }`}
            title="Card Grid View"
          >
            <i className="ri-grid-fill" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "table" ? "bg-[#253C7D] text-white" : "text-gray-500 hover:text-gray-800"
            }`}
            title="Table List View"
          >
            <i className="ri-list-check-2" />
          </button>
        </div>
      </div>
    </div>
  );
});
