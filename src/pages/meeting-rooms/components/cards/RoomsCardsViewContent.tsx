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
}

export const RoomsCardsViewContent = memo(function RoomsCardsViewContent({
  rooms,
  bookings,
  onOpenBookModal,
  onSelectBooking,
  canManageRooms,
  onDeleteRoom,
}: RoomsCardsViewContentProps) {
  const todayStr = toYMD(new Date());

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
