import { memo } from "react";
import type { ModuleCount } from "../types";

interface RecycleBinFilterChipsProps {
  filter: string;
  setFilter: (f: string) => void;
  totalCount: number;
  counts: ModuleCount[];
}

export const RecycleBinFilterChips = memo(function RecycleBinFilterChips({
  filter,
  setFilter,
  totalCount,
  counts,
}: RecycleBinFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      <button
        onClick={() => setFilter("all")}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
          filter === "all"
            ? "bg-[#253C7D] text-white shadow-xs"
            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
      >
        All ({totalCount})
      </button>
      {counts.map((m) => (
        <button
          key={m.table}
          onClick={() => setFilter(m.table)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
            filter === m.table
              ? "bg-[#253C7D] text-white shadow-xs"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <i className={m.icon} />
          {m.name} ({m.count})
        </button>
      ))}
    </div>
  );
});
