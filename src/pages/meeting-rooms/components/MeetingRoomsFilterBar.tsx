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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 shadow-2xs space-y-3 transition-colors">
      {/* Top Row: Date Navigation & Booking Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onShiftDate(-1)}
              className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Previous Day"
            >
              <i className="ri-arrow-left-s-line text-xs" />
            </button>
            <button
              type="button"
              onClick={onJumpToToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded transition-all cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => onShiftDate(1)}
              className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Next Day"
            >
              <i className="ri-arrow-right-s-line text-xs" />
            </button>
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 ml-1">
            {formatDateDisplay(selectedDate)}
          </span>
        </div>

        {/* Status Tabs Segment */}
        <div className="inline-flex items-center bg-slate-100/90 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700 self-start sm:self-auto">
          {(["all", "pending", "my"] as const).map((tab) => {
            const isActive = statusTab === tab;
            const label = tab === "all" ? "All Bookings" : tab === "pending" ? "Pending" : "My Bookings";
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusTab(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? tab === "pending"
                      ? "bg-amber-500 text-white shadow-xs font-bold"
                      : "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-300 shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{label}</span>
                {tab === "pending" && pendingCount > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${isActive ? "bg-amber-700 text-white" : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"}`}>
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Clean Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookings or rooms..."
            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400 font-medium transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <i className="ri-close-circle-fill text-xs" />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400 cursor-pointer"
          >
            <option value="all">All Floors</option>
            {distinctFloors.map((fl) => (
              <option key={fl} value={String(fl)}>Floor {fl}</option>
            ))}
          </select>

          <select
            value={filterRoomId}
            onChange={(e) => setFilterRoomId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400 cursor-pointer max-w-[180px] truncate"
          >
            <option value="all">All Rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name} (F{r.floor || 3})</option>
            ))}
          </select>

          {availableBranches && availableBranches.length > 1 && setBranchFilter && (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-1.5 bg-blue-50 dark:bg-sky-950/60 border border-blue-200 dark:border-sky-800/60 rounded-xl text-xs text-[#253C7D] dark:text-sky-300 font-semibold focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              <option value="all">All Branches ({availableBranches.length})</option>
              {availableBranches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
});
