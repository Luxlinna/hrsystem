import { memo } from "react";
import { MONTH_NAMES } from "../constants";
import type { ViewMode, QuickFilter, DensityMode } from "../types";

interface ShiftToolbarProps {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  density: DensityMode;
  setDensity: (d: DensityMode) => void;
  currentDate: Date;
  weekDates: Date[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterBranch: string;
  setFilterBranch: (v: string) => void;
  filterDept: string;
  setFilterDept: (v: string) => void;
  branches: { id: string; name: string }[];
  departments: string[];
  quickFilter: QuickFilter;
  setQuickFilter: (f: QuickFilter) => void;
  totalShiftsCount: number;
  totalOpenShiftsCount: number;
  totalFilledShiftsCount: number;
  navigatePrev: () => void;
  navigateNext: () => void;
  navigateToday: () => void;
  clearFilters: () => void;
}

const VIEW_OPTIONS: { id: ViewMode; label: string; icon: string }[] = [
  { id: "week", label: "Week", icon: "ri-calendar-view" },
  { id: "day", label: "Day", icon: "ri-time-line" },
  { id: "list", label: "List", icon: "ri-list-check" },
  { id: "month", label: "Month", icon: "ri-calendar-2-line" },
];

export const ShiftToolbar = memo(function ShiftToolbar(props: ShiftToolbarProps) {
  const {
    viewMode, setViewMode, density, setDensity, currentDate, weekDates, searchQuery,
    setSearchQuery, filterBranch, setFilterBranch, filterDept, setFilterDept,
    branches, departments, quickFilter, setQuickFilter, totalShiftsCount,
    totalOpenShiftsCount, totalFilledShiftsCount, navigatePrev, navigateNext,
    navigateToday, clearFilters,
  } = props;

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 mb-5 shadow-2xs space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-0.5 bg-gray-100/90 rounded-lg border border-gray-200/60">
            {VIEW_OPTIONS.map((v) => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-md transition-all cursor-pointer ${
                  viewMode === v.id ? "bg-white text-[#253C7D] font-bold shadow-2xs" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className={`${v.icon} text-xs`} />
                <span>{v.label}</span>
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center p-0.5 bg-gray-100/90 rounded-lg border border-gray-200/60">
            <button
              onClick={() => setDensity("comfortable")}
              className={`px-2 py-1 text-[11px] font-semibold rounded ${density === "comfortable" ? "bg-white text-[#253C7D] shadow-2xs font-bold" : "text-gray-500"}`}
            >
              Normal
            </button>
            <button
              onClick={() => setDensity("compact")}
              className={`px-2 py-1 text-[11px] font-semibold rounded ${density === "compact" ? "bg-white text-[#253C7D] shadow-2xs font-bold" : "text-gray-500"}`}
            >
              Compact
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={navigatePrev} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 cursor-pointer shadow-2xs">
              <i className="ri-arrow-left-s-line text-base" />
            </button>
            <span className="text-[13px] font-bold text-gray-800 min-w-[130px] text-center px-1">
              {viewMode === "month" && `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
              {viewMode === "day" && currentDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              {(viewMode === "week" || viewMode === "list") &&
                `${weekDates[0]?.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDates[6]?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
            </span>
            <button onClick={navigateNext} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 cursor-pointer shadow-2xs">
              <i className="ri-arrow-right-s-line text-base" />
            </button>
            <button onClick={navigateToday} className="px-2 py-1 text-[11px] font-bold text-[#253C7D] hover:bg-[#253C7D]/10 rounded-md transition-colors cursor-pointer">
              Today
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-52">
            <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shift or staff..."
              className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#253C7D] transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <i className="ri-close-circle-fill text-xs" />
              </button>
            )}
          </div>
          <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer">
            <option value="all">All Branches ({branches.length})</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer">
            <option value="all">All Departments ({departments.length})</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Filter By:</span>
          <button onClick={() => setQuickFilter("all")} className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${quickFilter === "all" ? "bg-[#253C7D] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            All ({totalShiftsCount})
          </button>
          <button onClick={() => setQuickFilter("open")} className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${quickFilter === "open" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-800 hover:bg-amber-100"}`}>
            <i className="ri-user-add-line text-xs" /><span>Needs Staff ({totalOpenShiftsCount})</span>
          </button>
          <button onClick={() => setQuickFilter("filled")} className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${quickFilter === "filled" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}>
            <i className="ri-check-line text-xs" /><span>Fully Staffed ({totalFilledShiftsCount})</span>
          </button>
        </div>
        {(searchQuery || filterBranch !== "all" || filterDept !== "all" || quickFilter !== "all") && (
          <button onClick={clearFilters} className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer flex items-center gap-1">
            <i className="ri-filter-off-line" /> Clear Filters
          </button>
        )}
      </div>
    </div>
  );
});
