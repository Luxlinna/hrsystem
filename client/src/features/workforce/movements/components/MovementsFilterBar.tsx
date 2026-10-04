import React from "react";
import type { MovementType } from "../types";
import { MOVEMENT_TYPES } from "../constants";

interface BranchOption {
  id: string;
  name: string;
}

interface MovementsFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedType: MovementType | "all";
  onTypeChange: (val: MovementType | "all") => void;
  selectedBranch: string;
  onBranchChange: (val: string) => void;
  branches: BranchOption[];
  totalFiltered: number;
}

export const MovementsFilterBar: React.FC<MovementsFilterBarProps> = ({
  search,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedBranch,
  onBranchChange,
  branches,
  totalFiltered,
}) => {
  const hasActiveFilters = search.trim() !== "" || selectedType !== "all" || selectedBranch !== "";

  const handleClearFilters = () => {
    onSearchChange("");
    onTypeChange("all");
    onBranchChange("");
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3.5 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        {/* Search employee name or ID */}
        <div className="relative flex-1">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search employee name, staff ID, or position..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              <i className="ri-close-circle-fill" />
            </button>
          )}
        </div>

        {/* Movement Type Filter */}
        <div className="w-full md:w-56">
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value as MovementType | "all")}
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D]"
          >
            <option value="all">All Movement Types</option>
            {Object.entries(MOVEMENT_TYPES).map(([k, cfg]) => (
              <option key={k} value={k}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>

        {/* Branch / BU Filter */}
        <div className="w-full md:w-52">
          <select
            value={selectedBranch}
            onChange={(e) => onBranchChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D]"
          >
            <option value="">All Branches / Sites</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 flex items-center justify-center gap-1 shrink-0 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <i className="ri-refresh-line text-sm" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Movement type quick pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          onClick={() => onTypeChange("all")}
          className={`px-2.5 py-1 rounded-full font-semibold shrink-0 transition-colors ${
            selectedType === "all"
              ? "bg-[#253C7D] text-white"
              : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
          }`}
        >
          All
        </button>
        {Object.entries(MOVEMENT_TYPES).map(([k, cfg]) => {
          const active = selectedType === k;
          return (
            <button
              key={k}
              onClick={() => onTypeChange(k as MovementType)}
              className={`px-2.5 py-1 rounded-full font-semibold shrink-0 flex items-center gap-1 border transition-all ${
                active
                  ? `${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder} ring-2 ring-indigo-400/30`
                  : "border-transparent bg-gray-50 dark:bg-slate-700/60 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
              }`}
            >
              <i className={cfg.icon} />
              <span>{cfg.shortLabel}</span>
            </button>
          );
        })}
        <div className="ml-auto text-[11px] text-gray-400 shrink-0 pl-2">
          Found <span className="font-bold text-gray-700 dark:text-gray-200">{totalFiltered}</span> records
        </div>
      </div>
    </div>
  );
};
