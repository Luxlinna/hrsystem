import { memo } from "react";
import { MODULES } from "../constants";
import type { CrossBuScopeFilter } from "../types";

interface AuditFiltersProps {
  search: string;
  setSearch: (search: string) => void;
  moduleFilter: string;
  setModuleFilter: (module: string) => void;
  actionFilter: string;
  setActionFilter: (action: string) => void;
  buFilter: string;
  setBuFilter: (bu: string) => void;
  availableBusinessUnits: string[];
  scopeFilter: CrossBuScopeFilter;
  setScopeFilter: (scope: CrossBuScopeFilter) => void;
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
  buFilter,
  setBuFilter,
  availableBusinessUnits,
  scopeFilter,
  setScopeFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  onClearAll,
}: AuditFiltersProps) {
  const isFiltered =
    moduleFilter !== "all" ||
    actionFilter !== "all" ||
    buFilter !== "all" ||
    scopeFilter !== "all" ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    Boolean(search);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5 flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text"
          placeholder="Search logs, actor, BU, reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30"
        />
      </div>

      {/* BU (Business Unit) Selector */}
      <select
        value={buFilter}
        onChange={(e) => setBuFilter(e.target.value)}
        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none cursor-pointer max-w-[210px] text-ellipsis"
      >
        <option value="all">🏢 All Business Units (BU)</option>
        {availableBusinessUnits.map((bu) => (
          <option key={bu} value={bu}>
            {bu}
          </option>
        ))}
      </select>

      {/* Cross-BU Scope Selector */}
      <select
        value={scopeFilter}
        onChange={(e) => setScopeFilter(e.target.value as CrossBuScopeFilter)}
        className={`px-3 py-2 border rounded-lg text-sm focus:outline-none cursor-pointer font-medium ${
          scopeFilter === "cross_bu"
            ? "bg-amber-50 border-amber-300 text-amber-900"
            : scopeFilter === "local"
            ? "bg-blue-50 border-blue-200 text-blue-900"
            : "bg-gray-50 border-gray-200 text-gray-700"
        }`}
      >
        <option value="all">🌐 All Scopes</option>
        <option value="local">📍 Local BU Actions</option>
        <option value="cross_bu">⚡ Across-Site BU Actions</option>
      </select>

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
