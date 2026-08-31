import { memo } from "react";
import type { MeetingRoom, Booking } from "../../types";
import { RoomCard } from "./RoomCard";
import { toYMD } from "../../roomUtils";

interface RoomsCardsViewContentProps {
  rooms: MeetingRoom[];
  bookings: Booking[];
  onOpenBookModal: (room: MeetingRoom) => void;
  onSelectBooking: (b: Booking) => void;
  canManageRooms?: boolean;
  onDeleteRoom?: (roomId: string, roomName: string) => void;
  onResetFilters?: () => void;
  onCreateRoom?: () => void;
  totalRoomsCount?: number;
}

export const RoomsCardsViewContent = memo(function RoomsCardsViewContent({
  rooms,
  bookings,
  onOpenBookModal,
  onSelectBooking,
  canManageRooms,
  onDeleteRoom,
  onResetFilters,
  onCreateRoom,
  totalRoomsCount = 0,
}: RoomsCardsViewContentProps) {
  const todayStr = toYMD(new Date());

  if (rooms.length === 0) {
    const isFilteredOut = totalRoomsCount > 0;
    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2">
          <i className="ri-door-open-line" />
        </div>
        <p className="font-extrabold text-sm text-gray-800">No Meeting Rooms Found</p>
        <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
          {isFilteredOut
            ? "No meeting rooms match your current floor filter."
            : "No meeting rooms have been set up for this branch yet."}
        </p>

        <div className="flex items-center justify-center gap-2.5 mt-4">
          {isFilteredOut && onResetFilters && (
            <button
              onClick={onResetFilters}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}

          {canManageRooms && onCreateRoom && (
            <button
              onClick={onCreateRoom}
              className="px-4 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-add-circle-line text-sm" />
              <span>Create New Room</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map((room) => {
        const todayBookings = bookings.filter((b) => b.room_id === room.id && b.date === todayStr);

        return (
          <RoomCard
            key={room.id}
            room={room}
            todayBookings={todayBookings}
            onOpenBookModal={onOpenBookModal}
            onSelectBooking={onSelectBooking}
            canManageRooms={canManageRooms}
            onDeleteRoom={onDeleteRoom}
          />
        );
      })}
    </div>
  );
});
