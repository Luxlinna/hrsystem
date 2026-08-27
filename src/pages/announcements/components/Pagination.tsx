import { memo } from "react";

interface PaginationProps {
  totalCount: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
}

export const Pagination = memo(function Pagination({
  totalCount,
  pageSize,
  setPageSize,
  page,
  setPage,
  totalPages,
}: PaginationProps) {
  if (totalCount === 0) return null;

  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, totalCount);

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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-white border border-gray-200/80 rounded-2xl shadow-2xs mt-6">
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-xs text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-900">{pageStart}</span>–<span className="font-bold text-gray-900">{pageEnd}</span> of <span className="font-bold text-gray-900">{totalCount}</span> announcements
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-gray-50 font-bold text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            {[6, 9, 18, 36].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={safePage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <i className="ri-arrow-left-s-line" />
        </button>
        {pageWindow(safePage, totalPages).map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                p === safePage ? "bg-[#253C7D] text-white shadow-xs" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={safePage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <i className="ri-arrow-right-s-line" />
        </button>
      </div>
    </div>
  );
});
