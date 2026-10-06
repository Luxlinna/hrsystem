import { memo } from "react";
import { pageWindow } from "../../dateUtils";

interface LeavePaginationProps {
  pageStart: number;
  pageEnd: number;
  totalRows: number;
  safePage: number;
  totalPages: number;
  setPage: (p: number) => void;
}

export const LeavePagination = memo(function LeavePagination({
  pageStart,
  pageEnd,
  totalRows,
  safePage,
  totalPages,
  setPage,
}: LeavePaginationProps) {
  if (totalRows === 0) return null;

  return (
    <div className="hidden lg:flex p-3.5 bg-white rounded-b-2xl border-t border-gray-100 items-center justify-between gap-3 text-xs text-slate-500">
      <p>
        Showing <span className="font-bold text-slate-900">{pageStart}</span> to{" "}
        <span className="font-bold text-slate-900">{pageEnd}</span> of{" "}
        <span className="font-bold text-slate-900">{totalRows}</span> records
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          className="w-6 h-6 rounded-md border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <i className="ri-arrow-left-s-line" />
        </button>

        {pageWindow(safePage, totalPages).map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-bold text-xs">
              ...
            </span>
          ) : (
            <button
              key={`page-${p}`}
              onClick={() => setPage(Number(p))}
              className={`min-w-[24px] h-6 px-1.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
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
          className="w-6 h-6 rounded-md border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <i className="ri-arrow-right-s-line" />
        </button>
      </div>
    </div>
  );
});
