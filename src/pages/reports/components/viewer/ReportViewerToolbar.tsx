import { memo } from "react";

interface ReportViewerToolbarProps {
  inTableSearch: string;
  setInTableSearch: (val: string) => void;
  pageSize: number | "all";
  setPageSize: (size: number | "all") => void;
  density: "comfortable" | "compact";
  setDensity: (d: "comfortable" | "compact") => void;
}

export const ReportViewerToolbar = memo(function ReportViewerToolbar({
  inTableSearch,
  setInTableSearch,
  pageSize,
  setPageSize,
  density,
  setDensity,
}: ReportViewerToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
      {/* Live In-Table Filter Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text"
          value={inTableSearch}
          onChange={(e) => setInTableSearch(e.target.value)}
          placeholder="Filter displayed records instantly..."
          className="w-full pl-9 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#253C7D] transition-colors"
        />
        {inTableSearch && (
          <button
            onClick={() => setInTableSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-circle-fill text-xs" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Density switcher */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200/80">
          <button
            onClick={() => setDensity("compact")}
            title="Compact row density"
            className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
              density === "compact" ? "bg-white text-[#253C7D] shadow-2xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Compact
          </button>
          <button
            onClick={() => setDensity("comfortable")}
            title="Comfortable row density"
            className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
              density === "comfortable" ? "bg-white text-[#253C7D] shadow-2xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Comfortable
          </button>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="hidden sm:inline">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}
            className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>
    </div>
  );
});
