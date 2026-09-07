import { memo } from "react";

interface BranchOption {
  id: string;
  name: string;
  is_site?: boolean;
  branch_id?: string;
}

interface UsersFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterBranch: string;
  setFilterBranch: (branchId: string) => void;
  isSuperAdmin: boolean;
  branches: BranchOption[];
  branchCounts: Record<string, number>;
  scopedTotal: number;
}

export const UsersFilterBar = memo(function UsersFilterBar({
  searchQuery,
  setSearchQuery,
  filterBranch,
  setFilterBranch,
  isSuperAdmin,
  branches,
  branchCounts,
  scopedTotal,
}: UsersFilterBarProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Box */}
        <div className="relative flex-1 w-full">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 text-sm" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search user by name, email, role, or branch..."
            className="w-full pl-9 pr-8 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 dark:focus:ring-sky-500/20 focus:border-[#253C7D] dark:focus:border-sky-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-0.5"
            >
              <i className="ri-close-line text-sm" />
            </button>
          )}
        </div>

        {/* Branch Filter Selector (for Super Admin) */}
        {isSuperAdmin && branches.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 whitespace-nowrap hidden md:inline">
              <i className="ri-building-line mr-1 text-[#253C7D] dark:text-sky-400" /> Branch:
            </span>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-700 dark:text-slate-200 bg-gray-50/50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 dark:focus:ring-sky-500/20 focus:border-[#253C7D] dark:focus:border-sky-500 transition-all cursor-pointer"
            >
              <option value="all">🏢 All ({scopedTotal})</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.is_site ? `↳ ${b.name} (Site)` : `📍 ${b.name}`} ({branchCounts[b.id] || 0})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Quick Branch Filter Pills */}
      {isSuperAdmin && branches.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterBranch("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filterBranch === "all"
                ? "bg-[#253C7D] text-white shadow-2xs font-semibold"
                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200/80 dark:hover:bg-slate-700"
            }`}
          >
            <span>All</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filterBranch === "all"
                  ? "bg-white/20 text-white"
                  : "bg-gray-200/80 dark:bg-slate-700 text-gray-500 dark:text-slate-300"
              }`}
            >
              {scopedTotal}
            </span>
          </button>
          {branches.map((b) => {
            const count = branchCounts[b.id] || 0;
            const isSelected = filterBranch === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setFilterBranch(b.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#253C7D] text-white shadow-2xs font-semibold"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200/80 dark:hover:bg-slate-700"
                }`}
              >
                <span>{b.is_site ? `↳ ${b.name}` : b.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-gray-200/80 dark:bg-slate-700 text-gray-500 dark:text-slate-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
