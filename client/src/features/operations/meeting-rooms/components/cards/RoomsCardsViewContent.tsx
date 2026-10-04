import { memo } from "react";
import type { MeetingRoom, Booking } from "../../types";
import { RoomCard } from "./RoomCard";
import { MobileRoomScheduleList } from "../timeline/MobileRoomScheduleList";

interface RoomsCardsViewContentProps {
  rooms: MeetingRoom[];
  bookings: Booking[];
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  onOpenBookModal: (room: MeetingRoom) => void;
  onSelectBooking: (b: Booking) => void;
  canManageRooms?: boolean;
  onDeleteRoom?: (roomId: string, roomName: string) => void;
  onEditRoom?: (room: MeetingRoom) => void;
  onSelectRoomDetails?: (room: MeetingRoom) => void;
  onCreateRoom?: () => void;
  onResetFilters?: () => void;
  totalRoomsCount?: number;
}

export const RoomsCardsViewContent = memo(function RoomsCardsViewContent({
  rooms,
  bookings,
  searchQuery = "",
  setSearchQuery,
  onOpenBookModal,
  onSelectBooking,
  canManageRooms,
  onDeleteRoom,
  onEditRoom,
  onSelectRoomDetails,
  onCreateRoom,
  onResetFilters,
  totalRoomsCount = 0,
}: RoomsCardsViewContentProps) {
  if (rooms.length === 0) {
    const isFilteredOut = totalRoomsCount > 0;
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 text-center shadow-2xs">
        <div className="w-14 h-14 bg-sky-50 dark:bg-sky-950/50 text-[#253C7D] dark:text-sky-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-2xs">
          <i className="ri-door-open-line" />
        </div>
        <h3 className="font-bold text-base text-slate-900 dark:text-white">No Meeting Rooms Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          {isFilteredOut
            ? "No rooms match your current filter criteria. Try resetting your search or floor filters."
            : "No meeting rooms registered yet. Create your first conference room to get started."}
        </p>

        <div className="flex items-center justify-center gap-3 mt-5">
          {isFilteredOut && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}

          {canManageRooms && onCreateRoom && (
            <button
              type="button"
              onClick={onCreateRoom}
              className="px-4 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
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
    <div>
      {/* Mobile View: Clean compact room list matching native mobile layout */}
      <div className="block sm:hidden">
        <MobileRoomScheduleList
          rooms={rooms}
          bookings={bookings}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenBookModal={(r) => onOpenBookModal(r)}
          onSelectBooking={onSelectBooking}
          onSelectRoomDetails={onSelectRoomDetails}
        />
      </div>

      {/* Desktop / Tablet Grid View */}
      <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-in fade-in duration-200">
        {rooms.map((room) => {
          const roomBookings = bookings.filter((b) => b.room_id === room.id);
          return (
            <RoomCard
              key={room.id}
              room={room}
              todayBookings={roomBookings}
              onOpenBookModal={onOpenBookModal}
              onSelectBooking={onSelectBooking}
              canManageRooms={canManageRooms}
              onDeleteRoom={onDeleteRoom}
              onEditRoom={onEditRoom}
              onSelectRoomDetails={onSelectRoomDetails}
            />
          );
        })}
      </div>
    </div>
  );
});
