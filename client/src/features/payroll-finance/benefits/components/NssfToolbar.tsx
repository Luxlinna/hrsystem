interface NssfToolbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: "all" | "registered" | "unregistered";
  setStatusFilter: (s: "all" | "registered" | "unregistered") => void;
  onOpenImport: () => void;
  onExportXLSX: () => void;
  onExportCSV: () => void;
  exportLoading: "xlsx" | "csv" | null;
}

export function NssfToolbar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  onOpenImport,
  onExportXLSX,
  onExportCSV,
  exportLoading,
}: NssfToolbarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div className="flex items-center gap-2 flex-1 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, NSSF number…"
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#253C7D] bg-gray-50/50"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200/60">
          {(["all", "registered", "unregistered"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all capitalize cursor-pointer ${
                statusFilter === s ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {s === "all" ? "All" : s === "registered" ? "Registered" : "Pending"}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#253C7D] text-white text-xs font-semibold rounded-xl hover:bg-[#1e3167] transition-colors cursor-pointer shadow-xs"
        >
          <i className="ri-upload-cloud-2-line" />
          Import
        </button>

        <button
          type="button"
          onClick={onExportXLSX}
          disabled={exportLoading === "xlsx"}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
        >
          {exportLoading === "xlsx" ? (
            <span className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <i className="ri-file-excel-2-line text-green-600" />
          )}
          Excel
        </button>

        <button
          type="button"
          onClick={onExportCSV}
          disabled={exportLoading === "csv"}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
        >
          {exportLoading === "csv" ? (
            <span className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <i className="ri-file-text-line text-blue-500" />
          )}
          CSV
        </button>
      </div>
    </div>
  );
}
