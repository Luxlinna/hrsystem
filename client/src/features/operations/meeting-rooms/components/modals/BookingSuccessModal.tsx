import { memo } from "react";
import type { MeetingRoom, BookingFormData } from "../../types";
import { getRoomFloor, getRoomImage, formatDateDisplay, fmtTime } from "../../roomUtils";

interface BookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: MeetingRoom | null;
  bookingForm: BookingFormData;
  onViewMyBookings: () => void;
}

export const BookingSuccessModal = memo(function BookingSuccessModal({
  isOpen,
  onClose,
  room,
  bookingForm,
  onViewMyBookings,
}: BookingSuccessModalProps) {
  if (!isOpen || !room) return null;

  const floor = getRoomFloor(room);
  const roomImg = getRoomImage(room);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-in zoom-in-95 duration-200 text-center space-y-4">
        
        {/* Animated Checkmark Badge */}
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-4 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl shadow-md animate-bounce">
          <i className="ri-check-line font-bold" />
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Booking Confirmed!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your meeting room has been successfully reserved.
          </p>
        </div>

        {/* Reservation Card */}
        <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-left space-y-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <img src={roomImg} alt={room.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200/60 shrink-0" />
            <div className="min-w-0">
              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{room.name}</h4>
              <p className="text-[10.5px] text-slate-400">Floor {floor} &middot; Max {room.capacity || "—"} ppl</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <i className="ri-calendar-line text-[#253C7D] dark:text-sky-400" />
              <span>{formatDateDisplay(bookingForm.date)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <i className="ri-time-line text-[#253C7D] dark:text-sky-400" />
              <span>{fmtTime(bookingForm.start_time)} - {fmtTime(bookingForm.end_time)}</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
              <i className="ri-bookmark-line text-emerald-500" />
              <span className="truncate">{bookingForm.title}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onViewMyBookings}
            className="w-full py-3 bg-[#253C7D] hover:bg-[#1E3064] dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer active:scale-98"
          >
            View My Bookings
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    </div>
  );
});
