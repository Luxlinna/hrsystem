import { memo } from "react";

interface PaginationProps {
  totalCount: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  pageStart: number;
  pageEnd: number;
}

export const Pagination = memo(function Pagination({
  totalCount,
  pageSize,
  setPageSize,
  page,
  setPage,
  totalPages,
  pageStart,
  pageEnd,
}: PaginationProps) {
  if (totalCount === 0) return null;

  const safePage = Math.min(page, totalPages);

  const pageWindow = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 mt-6 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
      <div className="flex items-center gap-4 flex-wrap">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{pageStart}</span>–<span className="font-semibold text-gray-900">{pageEnd}</span> of <span className="font-semibold text-gray-900">{totalCount}</span> employees
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent cursor-pointer"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={safePage === 1}
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <i className="ri-arrow-left-s-line text-lg" />
        </button>
        {pageWindow(safePage, totalPages).map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="w-10 h-10 flex items-center justify-center text-sm text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                p === safePage ? "bg-[#253C7D] text-white shadow-md shadow-[#253C7D]/20" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={safePage === totalPages}
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <i className="ri-arrow-right-s-line text-lg" />
        </button>
      </div>
    </div>
  );
});
