import { memo } from "react";
import { pageWindow } from "../../dateUtils";

interface LeavePaginationProps {
  pageStart: number;
  pageEnd: number;
  totalRows: number;
  safePage: number;
  totalPages: number;
  setPage: (p: number) => void;
  pageSize?: number;
  setPageSize?: (size: number) => void;
}

export const LeavePagination = memo(function LeavePagination({
  pageStart,
  pageEnd,
  totalRows,
  safePage,
  totalPages,
  setPage,
  pageSize = 10,
  setPageSize,
}: LeavePaginationProps) {
  if (totalRows === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-white rounded-b-2xl border-t border-gray-100 text-xs text-slate-500">
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-[11px] text-gray-500">
          Showing <span className="font-semibold text-gray-700">{pageStart}</span>–<span className="font-semibold text-gray-700">{pageEnd}</span> of <span className="font-semibold text-gray-700">{totalRows}</span> leave records
        </p>

        {setPageSize && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400">Per page</span>
            <select
              value={pageSize >= 999999 ? 999999 : pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 border border-gray-200 rounded-lg text-[11px] bg-white text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              {[
                { label: "10", value: 10 },
                { label: "20", value: 20 },
                { label: "50", value: 50 },
                { label: "100", value: 100 },
                { label: "500", value: 500 },
                { label: "All", value: 999999 },
              ].map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          aria-label="Previous page"
          className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <i className="ri-arrow-left-s-line" />
        </button>

        {pageWindow(safePage, totalPages).map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="w-7 h-7 flex items-center justify-center text-[11px] text-slate-400 font-bold">
              …
            </span>
          ) : (
            <button
              key={`page-${p}`}
              onClick={() => setPage(Number(p))}
              aria-label={`Page ${p}`}
              className={`w-7 h-7 flex items-center justify-center rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${
                safePage === p
                  ? "bg-[#253C7D] text-white"
                  : "border border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => setPage(Math.min(totalPages, safePage + 1))}
          disabled={safePage >= totalPages}
          aria-label="Next page"
          className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <i className="ri-arrow-right-s-line" />
        </button>
      </div>
    </div>
  );
});
