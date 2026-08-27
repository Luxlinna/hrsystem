import { memo } from "react";
import { MODULES } from "../constants";

interface AuditFiltersProps {
  search: string;
  setSearch: (search: string) => void;
  moduleFilter: string;
  setModuleFilter: (module: string) => void;
  actionFilter: string;
  setActionFilter: (action: string) => void;
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  onClearAll: () => void;
}

export const AuditFilters = memo(function AuditFilters({
  search,
  setSearch,
  moduleFilter,
  setModuleFilter,
  actionFilter,
  setActionFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  onClearAll,
}: AuditFiltersProps) {
  const isFiltered = moduleFilter !== "all" || actionFilter !== "all" || dateFrom || dateTo || search;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5 flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30"
        />
      </div>

      <select
        value={moduleFilter}
        onChange={(e) => setModuleFilter(e.target.value)}
        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none cursor-pointer"
      >
        {MODULES.map((m) => (
          <option key={m} value={m}>
            {m === "all" ? "All Modules" : m.charAt(0).toUpperCase() + m.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={actionFilter}
        onChange={(e) => setActionFilter(e.target.value)}
        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none cursor-pointer"
      >
        {["all", "created", "updated", "approved", "rejected", "deleted", "processed"].map((a) => (
          <option key={a} value={a}>
            {a === "all" ? "All Actions" : a.charAt(0).toUpperCase() + a.slice(1)}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none cursor-pointer"
      />

      <input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none cursor-pointer"
      />

      {isFiltered && (
        <button
          onClick={onClearAll}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          Clear all
        </button>
      )}
    </div>
  );
});
