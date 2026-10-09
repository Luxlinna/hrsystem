import { memo } from "react";
import type { MeetingRoom, Booking } from "../../types";
import { FloorBadge } from "../FloorBadge";
import { getRoomFloor, getRoomImage, fmtTime } from "../../roomUtils";

interface RoomCardProps {
  room: MeetingRoom;
  todayBookings: Booking[];
  onOpenBookModal: (room: MeetingRoom) => void;
  onSelectBooking: (b: Booking) => void;
  canManageRooms?: boolean;
  onDeleteRoom?: (roomId: string, roomName: string) => void;
  onEditRoom?: (room: MeetingRoom) => void;
  onSelectRoomDetails?: (room: MeetingRoom) => void;
}

export const RoomCard = memo(function RoomCard({
  room,
  todayBookings,
  onOpenBookModal,
  onSelectBooking,
  canManageRooms,
  onDeleteRoom,
  onEditRoom,
  onSelectRoomDetails,
}: RoomCardProps) {
  const roomFloor = getRoomFloor(room);
  const isVIP = roomFloor === 5;
  const roomImage = getRoomImage(room);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Room Photo Banner */}
        <div
          onClick={() => onSelectRoomDetails?.(room)}
          className="relative w-full h-36 rounded-2xl overflow-hidden mb-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-inner cursor-pointer"
        >
          <img src={roomImage} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute top-2.5 right-2.5">
            <FloorBadge floor={roomFloor} size="sm" isVIP={isVIP} />
          </div>
          {room.branch_name && (
            <div className="absolute bottom-2.5 left-2.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/60 text-white backdrop-blur-md border border-white/10 shadow-sm">
                <i className="ri-building-line text-xs" />
                {room.branch_name}
              </span>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h4
              onClick={() => onSelectRoomDetails?.(room)}
              className="font-bold text-base text-slate-900 dark:text-slate-100 mb-0.5 hover:text-[#253C7D] dark:hover:text-sky-300 transition-colors cursor-pointer"
            >
              {room.name}
            </h4>
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>
                Capacity: <strong className="text-slate-700 dark:text-slate-200 font-bold">{room.capacity || "—"} people</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {canManageRooms && onEditRoom && (
              <button
                type="button"
                onClick={() => onEditRoom(room)}
                className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-xl transition-colors cursor-pointer"
                title="Edit room specifications"
              >
                <i className="ri-edit-line text-sm" />
              </button>
            )}
            {canManageRooms && onDeleteRoom && (
              <button
                type="button"
                onClick={() => onDeleteRoom(room.id, room.name)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                title="Remove room"
              >
                <i className="ri-delete-bin-line text-sm" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenBookModal(room)}
              className="px-3 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
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
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
              >
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Today's Schedule in this Room */}
        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
            Today's Schedule ({todayBookings.length})
          </span>

          {todayBookings.length === 0 ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/70 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-1.5">
              <i className="ri-checkbox-circle-line" /> Available all day today
            </p>
          ) : (
            todayBookings.slice(0, 3).map((b) => (
              <div
                key={b.id}
                onClick={() => onSelectBooking(b)}
                className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-[11px] truncate">{b.title}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {b.employees?.last_name} {b.employees?.first_name}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-[#253C7D] dark:text-sky-300 shrink-0">
                  {fmtTime(b.start_time)} - {fmtTime(b.end_time)}
                </span>
              </div>
            ))
          )}

          {todayBookings.length > 3 && (
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-right">
              +{todayBookings.length - 3} more reservations
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
