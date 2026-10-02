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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3.5 transition-colors">
      {/* 1. Date Navigation Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center bg-slate-100/90 dark:bg-slate-800/90 rounded-xl p-1 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
          <button
            type="button"
            onClick={() => onShiftDate(-1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
            title="Previous Day"
          >
            <i className="ri-arrow-left-s-line text-sm" />
          </button>
          <button
            type="button"
            onClick={onJumpToToday}
            className="px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => onShiftDate(1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
            title="Next Day"
          >
            <i className="ri-arrow-right-s-line text-sm" />
          </button>
        </div>

        <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {formatDateDisplay(selectedDate)}
        </span>
      </div>

      {/* 2. Status Segmented Tabs */}
      <div className="grid grid-cols-3 bg-slate-100/90 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/80 w-full">
        {(["all", "pending", "my"] as const).map((tab) => {
          const isActive = statusTab === tab;
          const label = tab === "all" ? "All Bookings" : tab === "pending" ? "Pending" : "My Bookings";
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusTab(tab)}
              className={`py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
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

      <div className="border-t border-slate-100 dark:border-slate-800/80" />

      {/* 3. Search Bar */}
      <div className="relative w-full">
        <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search bookings or rooms..."
          className="w-full pl-9 pr-8 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/90 rounded-2xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400 font-medium transition-colors shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <i className="ri-close-circle-fill text-sm" />
          </button>
        )}
      </div>

      {/* 4. Dropdowns Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="relative">
          <select
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
            className="w-full appearance-none pl-3.5 pr-8 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/90 rounded-2xl text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400 cursor-pointer shadow-2xs truncate"
          >
            <option value="all">All Floors</option>
            {distinctFloors.map((fl) => (
              <option key={fl} value={String(fl)}>Floor {fl}</option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filterRoomId}
            onChange={(e) => setFilterRoomId(e.target.value)}
            className="w-full appearance-none pl-3.5 pr-8 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/90 rounded-2xl text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400 cursor-pointer shadow-2xs truncate"
          >
            <option value="all">All Rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name} (F{r.floor || 3})</option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
        </div>

        {availableBranches && availableBranches.length > 1 && setBranchFilter && (
          <div className="col-span-2 relative">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2.5 bg-blue-50 dark:bg-sky-950/60 border border-blue-200 dark:border-sky-800/60 rounded-2xl text-xs text-[#253C7D] dark:text-sky-300 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-2xs"
            >
              <option value="all">All Branches ({availableBranches.length})</option>
              {availableBranches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
});
