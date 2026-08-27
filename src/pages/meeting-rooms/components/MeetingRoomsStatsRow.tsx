import { memo } from "react";

interface MeetingRoomsStatsRowProps {
  totalRoomsCount: number;
  floor3Count: number;
  floor5Count: number;
  todayBookingsCount: number;
  pendingCount: number;
  onFilterFloor: (floor: "all" | "3" | "5") => void;
  onSelectStatusTab: (tab: "all" | "pending" | "my") => void;
}

export const MeetingRoomsStatsRow = memo(function MeetingRoomsStatsRow({
  totalRoomsCount,
  floor3Count,
  floor5Count,
  todayBookingsCount,
  pendingCount,
  onFilterFloor,
  onSelectStatusTab,
}: MeetingRoomsStatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
      {/* Active Meeting Rooms */}
      <div
        onClick={() => onFilterFloor("all")}
        className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Rooms</span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
            <i className="ri-door-open-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 mt-2">{totalRoomsCount}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Floor 3 & 5 Workspaces</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
      </div>

      {/* Floor 3 vs Floor 5 Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Floors</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-sky-50 text-sky-700 rounded border border-sky-200">
              F3: {floor3Count}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-purple-50 text-purple-700 rounded border border-purple-200">
              F5: {floor5Count}
            </span>
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 mt-2">2 Floors</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Floor 3 (Team) & Floor 5 (VIP)</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600" />
      </div>

      {/* Today's Reservations */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Today's Bookings</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i className="ri-calendar-event-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-700 mt-2">{todayBookingsCount}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Scheduled slots today</p>
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
