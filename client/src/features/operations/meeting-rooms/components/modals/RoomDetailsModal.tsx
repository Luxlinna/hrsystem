import { memo, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import type { MeetingRoom, Booking } from "../../types";
import { FloorBadge } from "../FloorBadge";
import { getRoomFloor, getRoomImage, fmtTime } from "../../roomUtils";

interface RoomDetailsModalProps {
  room: MeetingRoom | null;
  bookings: Booking[];
  onClose: () => void;
  onBookRoom: (room: MeetingRoom) => void;
  canManageRooms?: boolean;
  onEditRoom?: (room: MeetingRoom) => void;
}

export const RoomDetailsModal = memo(function RoomDetailsModal({
  room, bookings, onClose, onBookRoom, canManageRooms, onEditRoom,
}: RoomDetailsModalProps) {
  useEffect(() => {
    if (!room) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [room]);

  const floor = getRoomFloor(room);
  const isVIP = floor === 5 || Boolean(room?.name.toLowerCase().includes("vip"));
  const roomImg = getRoomImage(room);
  const roomBookings = room ? bookings.filter((b) => b.room_id === room.id) : [];
  const hasBookings = roomBookings.length > 0;

  const amenities = useMemo(() => {
    if (!room) return [];
    if (room.amenities && room.amenities.length > 0) return room.amenities;
    if (isVIP) return ["Projector", "TV Screen", "Wi-Fi", "Video Conf", "Whiteboard"];
    if (room.name.toLowerCase().includes("train")) return ["Projector", "Sound System", "Wi-Fi", "Mic"];
    return ["Projector", "TV Screen", "Wi-Fi"];
  }, [room, isVIP]);

  if (!room) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 w-screen h-screen">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative w-full sm:max-w-md h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] bg-white dark:bg-slate-900 rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-slate-200/80 dark:border-slate-800 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 overflow-y-auto space-y-4 pb-8 sm:pb-6">
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#253C7D] transition-colors cursor-pointer">
            <i className="ri-arrow-left-s-line text-lg" />
            <span>Room Details</span>
          </button>
          
          <div className="flex items-center gap-1.5">
            {canManageRooms && onEditRoom && (
              <button
                type="button"
                onClick={() => { onClose(); onEditRoom(room); }}
                className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800 text-[#253C7D] dark:text-sky-300 text-xs font-bold flex items-center gap-1 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors cursor-pointer"
              >
                <i className="ri-edit-line text-xs" />
                <span>Edit</span>
              </button>
            )}
            <button type="button" onClick={onClose} className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer">
              <i className="ri-close-line text-sm" />
            </button>
          </div>
        </div>

        <div className="px-4 space-y-4">
          <div className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
            <img src={roomImg} alt={room.name} className="w-full h-full object-cover" />
            {room.branch_name && (
              <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/70 backdrop-blur-xs text-white text-[10.5px] font-bold flex items-center gap-1">
                <i className="ri-building-line text-xs" /> {room.branch_name}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">{room.name}</h3>
              <FloorBadge floor={floor} size="sm" isVIP={isVIP} />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 font-semibold"><i className="ri-user-3-line text-slate-400" /> Max {room.capacity || "—"} ppl</span>
              <span>&middot;</span>
              <span className="inline-flex items-center gap-1 font-semibold"><i className="ri-map-pin-2-line text-emerald-500" /> Floor {floor}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Amenities & Equipment</p>
            <div className="grid grid-cols-3 gap-2">
              {amenities.map((item) => (
                <div key={item} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex flex-col items-center justify-center gap-1 text-center shadow-2xs">
                  <i className={`text-base text-[#253C7D] dark:text-sky-400 ${
                    item.toLowerCase().includes("wifi") ? "ri-wifi-line" :
                    item.toLowerCase().includes("tv") ? "ri-tv-line" :
                    item.toLowerCase().includes("proj") ? "ri-projector-line" :
                    item.toLowerCase().includes("mic") ? "ri-mic-line" : "ri-checkbox-circle-line"
                  }`} />
                  <span className="text-[10.5px] font-semibold text-slate-700 dark:text-slate-200 truncate w-full">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Today's Schedule ({roomBookings.length})</span>
              {!hasBookings ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Available All Day
                </span>
              ) : (
                <span className="text-amber-600 font-bold text-[11px]">{roomBookings.length} Booked</span>
              )}
            </div>

            {hasBookings ? (
              <div className="space-y-1.5">
                {roomBookings.map((b) => (
                  <div key={b.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{b.title}</p>
                      <p className="text-[10px] text-slate-400">{fmtTime(b.start_time)} - {fmtTime(b.end_time)}</p>
                    </div>
                    <span className="text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">{b.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div onClick={() => { onClose(); onBookRoom(room); }} className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs cursor-pointer hover:border-[#253C7D] transition-colors">
                <span className="text-slate-400">No reservations for this date</span>
                <span className="text-[#253C7D] dark:text-sky-400 font-bold text-[11px]">Reserve now &gt;</span>
              </div>
            )}
          </div>

          <div className="pt-2 space-y-2">
            <button type="button" onClick={() => { onClose(); onBookRoom(room); }} className="w-full py-3 px-4 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer active:scale-98">
              Book Now
            </button>
            <button type="button" onClick={onClose} className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer">
              Back to Rooms
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
});
