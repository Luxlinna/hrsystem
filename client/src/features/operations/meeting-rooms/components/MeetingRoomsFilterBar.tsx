import { memo } from "react";
import type { MeetingRoom } from "../types";
import { formatDateDisplay } from "../roomUtils";

interface MeetingRoomsFilterBarProps {
  selectedDate: string;
  onShiftDate: (days: number) => void;
  onJumpToToday: () => void;
  branchFilter?: string;
  setBranchFilter?: (branchId: string) => void;
  availableBranches?: { id: string; name: string }[];
  filterFloor: string;
  setFilterFloor: (floor: string) => void;
  filterRoomId: string;
  setFilterRoomId: (roomId: string) => void;
  rooms: MeetingRoom[];
  statusTab: "all" | "pending" | "my";
  setStatusTab: (tab: "all" | "pending" | "my") => void;
  pendingCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  availableFloors?: number[];
}

export const MeetingRoomsFilterBar = memo(function MeetingRoomsFilterBar({
  selectedDate,
  onShiftDate,
  onJumpToToday,
  branchFilter = "all",
  setBranchFilter,
  availableBranches = [],
  filterFloor,
  setFilterFloor,
  filterRoomId,
  setFilterRoomId,
  rooms,
  statusTab,
  setStatusTab,
  pendingCount,
  searchQuery,
  setSearchQuery,
  availableFloors,
}: MeetingRoomsFilterBarProps) {
  const distinctFloors = availableFloors && availableFloors.length > 0 ? availableFloors : [3, 5];
  const hasActiveFilters = filterFloor !== "all" || filterRoomId !== "all" || Boolean(searchQuery);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 shadow-2xs space-y-3 transition-colors">
      {/* Top Row: Date Navigation on Left & Status Tabs on Right */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Date Stepper Group */}
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center bg-slate-100/90 dark:bg-slate-800/90 rounded-xl p-1 border border-slate-200/70 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => onShiftDate(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer active:scale-95"
              title="Previous Day"
            >
              <i className="ri-arrow-left-s-line text-sm" />
            </button>
            <button
              type="button"
              onClick={onJumpToToday}
              className="px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer active:scale-95"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => onShiftDate(1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer active:scale-95"
              title="Next Day"
            >
              <i className="ri-arrow-right-s-line text-sm" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 rounded-xl">
            <i className="ri-calendar-line text-xs text-[#253C7D] dark:text-sky-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {formatDateDisplay(selectedDate)}
            </span>
          </div>
        </div>

        {/* Status Segmented Tabs */}
        <div className="inline-flex items-center bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/80 self-start md:self-auto">
          {(["all", "pending", "my"] as const).map((tab) => {
            const isActive = statusTab === tab;
            const label =
              tab === "all" ? "All Bookings" : tab === "pending" ? "Pending" : "My Bookings";
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusTab(tab)}
                className={`py-1.5 px-3.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none active:scale-95 ${
                  isActive
                    ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-300 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{label}</span>
                {tab === "pending" && pendingCount > 0 && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Search & Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px]">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookings, rooms, or hosts..."
            className="w-full pl-8 pr-8 py-2 h-9 bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/15 focus:border-[#253C7D] dark:focus:border-sky-400 font-medium transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <i className="ri-close-circle-fill text-xs" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Floor Select */}
          <div className="relative min-w-[125px]">
            <select
              value={filterFloor}
              onChange={(e) => setFilterFloor(e.target.value)}
              className="w-full appearance-none pl-3 pr-7 py-2 h-9 bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D]/15 focus:border-[#253C7D] dark:focus:border-sky-400 cursor-pointer shadow-2xs truncate"
            >
              <option value="all">All Floors</option>
              {distinctFloors.map((fl) => (
                <option key={fl} value={String(fl)}>
                  Floor {fl}
                </option>
              ))}
            </select>
            <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
          </div>

          {/* Room Select */}
          <div className="relative min-w-[140px]">
            <select
              value={filterRoomId}
              onChange={(e) => setFilterRoomId(e.target.value)}
              className="w-full appearance-none pl-3 pr-7 py-2 h-9 bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D]/15 focus:border-[#253C7D] dark:focus:border-sky-400 cursor-pointer shadow-2xs truncate"
            >
              <option value="all">All Rooms</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (F{r.floor || 3})
                </option>
              ))}
            </select>
            <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
          </div>

          {/* Multi-Branch Select */}
          {availableBranches && availableBranches.length > 1 && setBranchFilter && (
            <div className="relative min-w-[140px]">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full appearance-none pl-3 pr-7 py-2 h-9 bg-blue-50/80 dark:bg-sky-950/60 border border-blue-200 dark:border-sky-800/60 rounded-xl text-xs text-[#253C7D] dark:text-sky-300 font-semibold focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-2xs"
              >
                <option value="all">All Branches ({availableBranches.length})</option>
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
            </div>
          )}

          {/* Reset Filters Quick Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setFilterFloor("all");
                setFilterRoomId("all");
                setSearchQuery("");
              }}
              className="h-9 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0"
              title="Reset Filters"
            >
              <i className="ri-refresh-line text-xs" />
              <span className="hidden lg:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
