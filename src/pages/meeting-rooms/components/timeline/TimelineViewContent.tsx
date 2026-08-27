import { memo } from "react";
import type { MeetingRoom, Booking } from "../../types";
import { TimelineHeader } from "./TimelineHeader";
import { TimelineRoomRow } from "./TimelineRoomRow";

interface TimelineViewContentProps {
  rooms: MeetingRoom[];
  bookings: Booking[];
  onOpenBookModal: (room?: MeetingRoom, startTime?: string) => void;
  onSelectBooking: (b: Booking) => void;
}

export const TimelineViewContent = memo(function TimelineViewContent({
  rooms,
  bookings,
  onOpenBookModal,
  onSelectBooking,
}: TimelineViewContentProps) {
  if (rooms.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2">
          <i className="ri-door-open-line" />
        </div>
        <p className="font-extrabold text-sm text-gray-800">No Meeting Rooms Found</p>
        <p className="text-xs text-gray-400 mt-1">No meeting rooms match your floor or filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <TimelineHeader />

        <div className="divide-y divide-gray-100">
          {rooms.map((room) => {
            const roomBookings = bookings.filter((b) => b.room_id === room.id);
            return (
              <TimelineRoomRow
                key={room.id}
                room={room}
                bookings={roomBookings}
                onOpenBookModal={(r, start) => onOpenBookModal(r, start)}
                onSelectBooking={onSelectBooking}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});
