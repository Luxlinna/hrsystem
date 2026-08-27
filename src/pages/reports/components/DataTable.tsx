import type { ReportRow } from "../types";
import { useReportViewerPagination } from "../hooks/useReportViewerPagination";
import { ReportCell } from "./ReportCell";
import { Pagination } from "./Pagination";

interface DataTableProps {
  rows: ReportRow[];
  columns: string[];
}

export function DataTable({ rows, columns }: DataTableProps) {
  const {
    pageSize,
    setPageSize,
    page,
    setPage,
    inTableSearch,
    setInTableSearch,
    density,
    setDensity,
    displayRows,
    totalPages,
    pagedRows,
    pageStart,
    pageEnd,
    pageWindow,
  } = useReportViewerPagination(rows);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gray-50/70 border-b border-gray-100">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={inTableSearch}
              onChange={(e) => setInTableSearch(e.target.value)}
              placeholder="Instant search in this table..."
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all shadow-2xs"
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
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200/80 shadow-2xs">
            <button
              onClick={() => setDensity("compact")}
              title="Compact Density"
              className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                density === "compact" ? "bg-[#253C7D] text-white" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-list-check text-xs" /> Compact
            </button>
            <button
              onClick={() => setDensity("comfortable")}
              title="Comfortable Density"
              className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                density === "comfortable" ? "bg-[#253C7D] text-white" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-layout-row-line text-xs" /> Roomy
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <span className="hidden md:inline text-gray-400 font-medium">Show:</span>
            {[10, 25, 50, "all"].map((s) => (
              <button
                key={String(s)}
                onClick={() => { setPageSize(s as any); setPage(1); }}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer border ${
                  pageSize === s
                    ? "bg-[#253C7D] text-white border-[#253C7D]"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {displayRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <i className="ri-file-search-line text-4xl mb-2 text-gray-300" />
          <p className="text-sm font-semibold text-gray-600">No records found</p>
          <p className="text-xs text-gray-400 mt-0.5">Try clearing your filters or search terms</p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[680px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-200/90 shadow-2xs">
              <tr>
                <th className="px-3.5 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-10 text-center">
                  #
                </th>
                {columns.map((col) => {
                  const isDelCol = col.includes("Deleted");
                  return (
                    <th
                      key={col}
                      className={`px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                        isDelCol ? "text-rose-700 bg-rose-50/60" : "text-slate-600"
                      }`}
                    >
                      {col}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedRows.map((row, i) => {
                const isRowDeleted = Boolean((row as any).deleted_at || (row as any).status === "deleted");
                const rowIndex = pageStart + i;

                return (
                  <tr
                    key={i}
                    className={`transition-colors group ${
                      isRowDeleted
                        ? "bg-rose-50/20 hover:bg-rose-50/40"
                        : i % 2 === 0
                          ? "bg-white hover:bg-slate-50/80"
                          : "bg-[#FAFAFA] hover:bg-slate-50/80"
                    }`}
                  >
                    <td className={`px-3.5 text-center text-xs font-mono text-gray-400 group-hover:text-gray-600 ${
                      density === "compact" ? "py-2" : "py-3"
                    }`}>
                      {rowIndex}
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col}
                        className={`px-3.5 text-xs text-gray-700 whitespace-nowrap ${
                          density === "compact" ? "py-2" : "py-3"
                        }`}
                      >
                        <ReportCell col={col} row={row} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {displayRows.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-2 text-gray-500 font-medium">
            <span>
              Showing <span className="font-bold text-gray-800">{pageStart}</span>–<span className="font-bold text-gray-800">{pageEnd}</span> of <span className="font-bold text-gray-800">{displayRows.length}</span> records
            </span>
            {inTableSearch && (
              <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 text-[11px]">
                Filtered from {rows.length} total
              </span>
            )}
          </div>

          <Pagination
            safePage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            pageWindow={pageWindow}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
