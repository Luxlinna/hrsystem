import { memo } from "react";
import { FILTER_OPTIONS, SOURCE_LABELS } from "../constants";

interface NotificationsFilterBarProps {
  search: string;
  setSearch: (search: string) => void;
  filter: string;
  setFilter: (filter: string) => void;
  sourceFilter: string;
  setSourceFilter: (source: string) => void;
  sources: string[];
  unreadCount?: number;
}

export const NotificationsFilterBar = memo(function NotificationsFilterBar({
  search,
  setSearch,
  filter,
  setFilter,
  sourceFilter,
  setSourceFilter,
  sources,
  unreadCount = 0,
}: NotificationsFilterBarProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-2 sm:p-2.5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 mb-4 sm:mb-5">
      {/* Search Input */}
      <div className="relative flex-1 min-w-0 md:max-w-xs">
        <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notifications..."
          className="w-full pl-7 pr-6 py-1.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#253C7D] transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <i className="ri-close-line text-xs" />
          </button>
        )}
      </div>

      {/* Filter Options & Source Dropdown */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1 shrink-0">
          {FILTER_OPTIONS.map((f) => {
            const count = f.key === "unread" ? unreadCount : 0;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  filter === f.key
                    ? "bg-[#253C7D] text-white shadow-2xs"
                    : "bg-slate-50/80 hover:bg-slate-100 text-slate-600 border border-slate-200/80"
                }`}
              >
                <span>{f.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      filter === f.key
                        ? "bg-white/20 text-white"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {sources.length > 0 && (
          <div className="relative shrink-0">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="appearance-none pl-2.5 pr-6 py-1 bg-slate-50/80 border border-slate-200/80 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              <option value="">All Sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABELS[s] || s}
                </option>
              ))}
            </select>
            <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
});
