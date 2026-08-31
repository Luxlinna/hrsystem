import { memo } from "react";
import type { MeetingRoom, Booking } from "../../types";
import { FloorBadge } from "../FloorBadge";
import { getRoomFloor, fmtTime } from "../../roomUtils";

interface RoomCardProps {
  room: MeetingRoom;
  todayBookings: Booking[];
  onOpenBookModal: (room: MeetingRoom) => void;
  onSelectBooking: (b: Booking) => void;
  canManageRooms?: boolean;
  onDeleteRoom?: (roomId: string, roomName: string) => void;
}

export const RoomCard = memo(function RoomCard({
  room,
  todayBookings,
  onOpenBookModal,
  onSelectBooking,
  canManageRooms,
  onDeleteRoom,
}: RoomCardProps) {
  const roomFloor = getRoomFloor(room);
  const isVIP = roomFloor === 5;

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-black text-base text-gray-900">{room.name}</h4>
              <FloorBadge floor={roomFloor} size="sm" isVIP={isVIP} />
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Capacity: <strong className="text-gray-700 font-bold">{room.capacity || "—"} people</strong>
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {canManageRooms && onDeleteRoom && (
              <button
                type="button"
                onClick={() => onDeleteRoom(room.id, room.name)}
                className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Remove room"
              >
                <i className="ri-delete-bin-line text-sm" />
              </button>
            )}
            <button
              onClick={() => onOpenBookModal(room)}
              className="px-3 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              + Book
            </button>
          </div>
        </div>

        {/* Amenities Pills */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {room.amenities.map((a) => (
              <span
                key={a}
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-600"
              >
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Today's Schedule in this Room */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Today's Schedule ({todayBookings.length})
          </span>

          {todayBookings.length === 0 ? (
            <p className="text-xs text-emerald-600 font-bold bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 flex items-center gap-1.5">
              <i className="ri-checkbox-circle-line" /> Available all day today
            </p>
          ) : (
            todayBookings.slice(0, 3).map((b) => (
              <div
                key={b.id}
                onClick={() => onSelectBooking(b)}
                className="p-2.5 rounded-xl bg-gray-50/80 hover:bg-gray-100/90 border border-gray-100 flex items-center justify-between text-xs cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-extrabold text-gray-900 text-[11px] truncate">{b.title}</p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {b.employees?.first_name} {b.employees?.last_name}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-[#253C7D] shrink-0">
                  {fmtTime(b.start_time)} - {fmtTime(b.end_time)}
                </span>
              </div>
            ))
          )}

          {todayBookings.length > 3 && (
            <p className="text-[10px] font-bold text-gray-400 text-right">
              +{todayBookings.length - 3} more reservations
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
