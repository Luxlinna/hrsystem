import { memo } from "react";

interface MeetingRoomsStatsRowProps {
  totalRoomsCount: number;
  floor3Count: number;
  floor5Count: number;
  todayBookingsCount: number;
  pendingCount: number;
  onFilterFloor: (floor: string) => void;
  onSelectStatusTab: (tab: "all" | "pending" | "my") => void;
  onJumpToToday?: () => void;
  availableFloors?: number[];
  floorCounts?: Map<number, number>;
}

export const MeetingRoomsStatsRow = memo(function MeetingRoomsStatsRow({
  totalRoomsCount,
  floor3Count,
  floor5Count,
  todayBookingsCount,
  pendingCount,
  onFilterFloor,
  onSelectStatusTab,
  onJumpToToday,
  availableFloors,
  floorCounts,
}: MeetingRoomsStatsRowProps) {
  const distinctFloors = availableFloors && availableFloors.length > 0 ? availableFloors : [3, 5];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
      {/* Active Meeting Rooms */}
      <div
        onClick={() => onFilterFloor("all")}
        className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:shadow-xs hover:border-[#253C7D]/30 transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-[#253C7D] transition-colors">Total Rooms</span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
            <i className="ri-door-open-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 mt-2">{totalRoomsCount}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Active Workspace Rooms</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
      </div>

      {/* Dynamic Floor Breakdown */}
      <div
        onClick={() => onFilterFloor("all")}
        className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:shadow-xs hover:border-purple-200 transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-purple-700 transition-colors">Floors</span>
          <div className="flex items-center gap-1 flex-wrap">
            {distinctFloors.map((fl) => {
              const count = floorCounts ? floorCounts.get(fl) || 0 : fl === 3 ? floor3Count : fl === 5 ? floor5Count : 0;
              const isVip = fl === 5;
              return (
                <button
                  key={fl}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterFloor(String(fl));
                  }}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border cursor-pointer ${
                    isVip
                      ? "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                      : "bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
                  }`}
                >
                  F{fl}: {count}
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 mt-2">{totalRoomsCount > 0 ? `${distinctFloors.length} Floors` : "0 Floors"}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Click to view all floors</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600" />
      </div>

      {/* Today's Reservations */}
      <div
        onClick={() => {
          onJumpToToday?.();
          onSelectStatusTab("all");
        }}
        className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:shadow-xs hover:border-emerald-200 transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-emerald-700 transition-colors">Today's Bookings</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i className="ri-calendar-event-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-700 mt-2">{todayBookingsCount}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Click to jump to today</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
      </div>

      {/* Pending Approvals */}
      <div
        onClick={() => onSelectStatusTab("pending")}
        className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Decisions</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <i className="ri-hourglass-2-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-amber-700 mt-2">{pendingCount}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Awaiting Admin/HR review</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
      </div>
    </div>
  );
});
