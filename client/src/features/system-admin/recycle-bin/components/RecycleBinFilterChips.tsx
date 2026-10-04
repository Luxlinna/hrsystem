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
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
      <button
        type="button"
        onClick={() => setFilter("all")}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
          filter === "all"
            ? "bg-[#253C7D] text-white shadow-2xs"
            : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
        }`}
      >
        <span>All</span>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
            filter === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          {totalCount}
        </span>
      </button>

      {counts.map((m) => {
        const isSelected = filter === m.table;
        return (
          <button
            key={m.table}
            type="button"
            onClick={() => setFilter(m.table)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              isSelected
                ? "bg-[#253C7D] text-white shadow-2xs"
                : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
            }`}
          >
            <i className={`${m.icon} text-xs`} />
            <span>{m.name}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {m.count}
            </span>
          </button>
        );
      })}
    </div>
  );
});
