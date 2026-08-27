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
    <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
      <p>
        Showing <span className="font-bold text-gray-900">{pageStart}</span> to{" "}
        <span className="font-bold text-gray-900">{pageEnd}</span> of{" "}
        <span className="font-bold text-gray-900">{totalRows}</span> records
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <i className="ri-arrow-left-s-line" />
        </button>

        {pageWindow(safePage, totalPages).map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 font-bold">
              ...
            </span>
          ) : (
            <button
              key={`page-${p}`}
              onClick={() => setPage(Number(p))}
              className={`min-w-[28px] h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                safePage === p
                  ? "bg-[#253C7D] text-white"
                  : "border border-gray-200 hover:bg-gray-50 text-gray-700"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => setPage(Math.min(totalPages, safePage + 1))}
          disabled={safePage >= totalPages}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <i className="ri-arrow-right-s-line" />
        </button>
      </div>
    </div>
  );
});
