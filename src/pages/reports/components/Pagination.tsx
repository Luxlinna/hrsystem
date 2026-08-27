interface PaginationProps {
  safePage: number;
  totalPages: number;
  pageSize: number | "all";
  pageWindow: (current: number, total: number) => (number | "...")[];
  onPageChange: (page: number) => void;
}

export function Pagination({ safePage, totalPages, pageSize, pageWindow, onPageChange }: PaginationProps) {
  if (pageSize === "all" || totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(1)}
        disabled={safePage === 1}
        title="First Page"
        className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
      >
        <i className="ri-skip-left-line text-xs" />
      </button>

      <button
        onClick={() => onPageChange(Math.max(1, safePage - 1))}
        disabled={safePage === 1}
        title="Previous Page"
        className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
      >
        <i className="ri-arrow-left-s-line text-xs" />
      </button>

      {pageWindow(safePage, totalPages).map((p, idx) =>
        p === "..." ? (
          <span key={`ell-${idx}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-400 font-bold">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              p === safePage
                ? "bg-[#253C7D] text-white shadow-xs"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
        disabled={safePage === totalPages}
        title="Next Page"
        className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
      >
        <i className="ri-arrow-right-s-line text-xs" />
      </button>

      <button
        onClick={() => onPageChange(totalPages)}
        disabled={safePage === totalPages}
        title="Last Page"
        className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
      >
        <i className="ri-skip-right-line text-xs" />
      </button>
    </div>
  );
}
