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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 mt-4 bg-white border border-gray-100 rounded-2xl">
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-[11px] text-gray-500">
          Showing <span className="font-semibold text-gray-700">{pageStart}</span>–<span className="font-semibold text-gray-700">{pageEnd}</span> of <span className="font-semibold text-gray-700">{totalCount}</span> attendance records
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400">Per page</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 border border-gray-200 rounded-lg text-[11px] bg-white text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={safePage === 1}
          aria-label="Previous page"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <i className="ri-arrow-left-s-line" />
        </button>
        {pageWindow(safePage, totalPages).map((pageNumber, index) =>
          pageNumber === "..." ? (
            <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center text-[11px] text-gray-400">
              …
            </span>
          ) : (
            <button
              key={pageNumber}
              onClick={() => setPage(pageNumber)}
              aria-label={`Page ${pageNumber}`}
              aria-current={pageNumber === safePage ? "page" : undefined}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${
                pageNumber === safePage ? "bg-[#253C7D] text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {pageNumber}
            </button>
          )
        )}
        <button
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={safePage === totalPages}
          aria-label="Next page"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <i className="ri-arrow-right-s-line" />
        </button>
      </div>
    </div>
  );
});
