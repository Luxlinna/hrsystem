import { memo } from "react";
import type { UnityApp } from "../types";
import AppCard from "./AppCard";
import { categoryColors } from "../constants";

interface UnityAppDirectoryProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  categories: string[];
  filteredApps: UnityApp[];
  getAccessCount: (appId: number) => number;
  getUsageCount: (appId: number) => number;
  getTodayMinutes: (appId: number) => number;
  onSelectApp: (app: UnityApp) => void;
}

export const UnityAppDirectory = memo(function UnityAppDirectory({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  categories,
  filteredApps,
  getAccessCount,
  getUsageCount,
  getTodayMinutes,
  onSelectApp,
}: UnityAppDirectoryProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search apps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#253C7D] text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "active", "maintenance"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-[12px] font-semibold capitalize transition-colors whitespace-nowrap ${
                statusFilter === s ? "bg-[#253C7D] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "all" ? "All Status" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap ${
              categoryFilter === cat
                ? "bg-[#253C7D] text-white"
                : `${categoryColors[cat] || "bg-gray-50 text-gray-600"} hover:opacity-80`
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredApps.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            accessCount={getAccessCount(app.id)}
            usageCount={getUsageCount(app.id)}
            todayMinutes={getTodayMinutes(app.id)}
            onClick={() => onSelectApp(app)}
            onGrantAccess={() => onSelectApp(app)}
          />
        ))}
        {filteredApps.length === 0 && (
          <div className="col-span-4 py-16 text-center">
            <i className="ri-apps-line text-4xl text-gray-300 block mb-2" />
            <p className="text-[14px] text-gray-400">No apps found matching your filters</p>
          </div>
        )}
      </div>
    </>
  );
});
