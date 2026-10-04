import { memo } from "react";
import type { MeetingRoom, BookingFormData } from "../../types";

interface BookingModalTitleAttendeesProps {
  modalRoom: MeetingRoom;
  bookingForm: BookingFormData;
  setBookingForm: React.Dispatch<React.SetStateAction<BookingFormData>>;
}

export const BookingModalTitleAttendees = memo(function BookingModalTitleAttendees({
  modalRoom,
  bookingForm,
  setBookingForm,
}: BookingModalTitleAttendeesProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3">
      {/* Meeting Title */}
      <div className="sm:col-span-8 space-y-1">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
          Meeting Title <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <i className="ri-file-text-line text-sm text-[#253C7D] dark:text-sky-400" />
          </div>
          <input
            type="text"
            required
            value={bookingForm.title}
            onChange={(e) => setBookingForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Enter meeting title..."
            className="w-full pl-9 pr-3 py-2 h-10 sm:h-9 bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-base sm:text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] dark:focus:border-sky-400 shadow-2xs transition-all"
          />
        </div>
      </div>

      {/* Attendees */}
      <div className="sm:col-span-4 space-y-1">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
          Attendees
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <i className="ri-user-line text-xs" />
          </div>
          <input
            type="number"
            min={1}
            max={modalRoom.capacity || 100}
            value={bookingForm.attendees_count}
            onChange={(e) =>
              setBookingForm((prev) => ({
                ...prev,
                attendees_count: Math.max(1, Number(e.target.value) || 1),
              }))
            }
            className="w-full pl-7 pr-6 py-2 h-10 sm:h-9 bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-base sm:text-xs font-semibold text-slate-900 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] dark:focus:border-sky-400 shadow-2xs text-center transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
            <i className="ri-arrow-down-s-line text-xs" />
          </div>
        </div>
      </div>
    </div>
  );
});
