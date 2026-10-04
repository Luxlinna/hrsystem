import { memo } from "react";

interface ReportViewerPaginationProps {
  pageStart: number;
  pageEnd: number;
  totalDisplayRows: number;
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  pageWindow: (number | "...")[];
}

export const ReportViewerPagination = memo(function ReportViewerPagination({
  pageStart,
  pageEnd,
  totalDisplayRows,
  page,
  totalPages,
  setPage,
  pageWindow,
}: ReportViewerPaginationProps) {
  if (totalPages <= 1 && totalDisplayRows <= 25) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/40 text-xs text-gray-500">
      <div>
        Showing <span className="font-bold text-gray-800">{pageStart}</span> to{" "}
        <span className="font-bold text-gray-800">{pageEnd}</span> of{" "}
        <span className="font-bold text-gray-800">{totalDisplayRows}</span> records
      </div>

      <div className="flex items-center gap-1.5 self-center">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          Previous
        </button>

        {pageWindow.map((item, idx) =>
          item === "..." ? (
            <span key={`dots-${idx}`} className="px-1 text-gray-400 font-bold">
              &hellip;
            </span>
          ) : (
            <button
              key={`page-${item}`}
              onClick={() => setPage(item as number)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                page === item
                  ? "bg-[#253C7D] text-white shadow-2xs"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item}
            </button>
          )
        )}

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
});
