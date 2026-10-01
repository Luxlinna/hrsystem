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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Total Rooms */}
      <div
        onClick={() => onFilterFloor("all")}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs hover:border-[#253C7D]/30 dark:hover:border-sky-500/30 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Rooms</span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <i className="ri-door-open-line text-sm" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{totalRoomsCount}</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Available facilities</p>
      </div>

      {/* 2. Floors Breakdown */}
      <div
        onClick={() => onFilterFloor("all")}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Floors</span>
          <div className="flex items-center gap-1 flex-wrap">
            {distinctFloors.map((fl) => {
              const count = floorCounts ? floorCounts.get(fl) || 0 : fl === 3 ? floor3Count : fl === 5 ? floor5Count : 0;
              return (
                <button
                  key={fl}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterFloor(String(fl));
                  }}
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 cursor-pointer"
                >
                  F{fl}: {count}
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
          {totalRoomsCount > 0 ? `${distinctFloors.length} Floors` : "0 Floors"}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Filter by floor level</p>
      </div>

      {/* 3. Today's Reservations */}
      <div
        onClick={() => {
          onJumpToToday?.();
          onSelectStatusTab("all");
        }}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs hover:border-emerald-300/40 dark:hover:border-emerald-500/30 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Today's Bookings</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <i className="ri-calendar-check-line text-sm" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{todayBookingsCount}</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Scheduled meetings</p>
      </div>

      {/* 4. Pending Approvals */}
      <div
        onClick={() => onSelectStatusTab("pending")}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs hover:border-amber-300/40 dark:hover:border-amber-500/30 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Pending Reviews</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <i className="ri-time-line text-sm" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{pendingCount}</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Awaiting confirmation</p>
      </div>
    </div>
  );
});
