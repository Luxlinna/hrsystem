import { memo } from "react";
import type { MeetingRoom } from "../types";
import { formatDateDisplay } from "../roomUtils";

interface MeetingRoomsFilterBarProps {
  selectedDate: string;
  onShiftDate: (days: number) => void;
  onJumpToToday: () => void;
  filterFloor: "all" | "3" | "5";
  setFilterFloor: (floor: "all" | "3" | "5") => void;
  filterRoomId: string;
  setFilterRoomId: (roomId: string) => void;
  rooms: MeetingRoom[];
  statusTab: "all" | "pending" | "my";
  setStatusTab: (tab: "all" | "pending" | "my") => void;
  pendingCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const MeetingRoomsFilterBar = memo(function MeetingRoomsFilterBar({
  selectedDate,
  onShiftDate,
  onJumpToToday,
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
}: MeetingRoomsFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onShiftDate(-1)}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
            title="Previous Day"
          >
            <i className="ri-arrow-left-s-line text-sm" />
          </button>
          <button
            onClick={onJumpToToday}
            className="px-2.5 py-1 text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={() => onShiftDate(1)}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
            title="Next Day"
          >
            <i className="ri-arrow-right-s-line text-sm" />
          </button>
          <span className="font-extrabold text-sm text-gray-900 ml-1">
            {formatDateDisplay(selectedDate)}
          </span>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
          <button
            onClick={() => setStatusTab("all")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              statusTab === "all"
                ? "bg-[#253C7D] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All Bookings
          </button>
          <button
            onClick={() => setStatusTab("pending")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              statusTab === "pending"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>Pending</span>
            {pendingCount > 0 && (
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  statusTab === "pending" ? "bg-amber-800 text-white" : "bg-amber-100 text-amber-800"
                }`}
              >
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusTab("my")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              statusTab === "my"
                ? "bg-[#253C7D] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            My Bookings
          </button>
        </div>
      </div>

      {/* Second Row: Floor Filter & Room Selector & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-gray-100">
        {/* Floor Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Floor:</span>
          {(["all", "3", "5"] as const).map((fl) => (
            <button
              key={fl}
              onClick={() => setFilterFloor(fl)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterFloor === fl
                  ? fl === "5"
                    ? "bg-purple-600 text-white shadow-xs"
                    : fl === "3"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-gray-900 text-white shadow-xs"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              {fl === "all" ? "All Floors" : fl === "5" ? "Floor 5 (VIP)" : "Floor 3"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 justify-end">
          {/* Room Selector */}
          <select
            value={filterRoomId}
            onChange={(e) => setFilterRoomId(e.target.value)}
            className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="all">All Rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} (Floor {r.floor || 3})
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, employee, team..."
              className="w-full pl-7 pr-6 py-1 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-circle-fill text-xs" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
