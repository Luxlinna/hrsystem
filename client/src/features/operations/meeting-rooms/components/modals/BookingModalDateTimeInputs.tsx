import { memo } from "react";
import type { BookingFormData } from "../../types";

interface BookingModalDateTimeInputsProps {
  bookingForm: BookingFormData;
  setBookingForm: React.Dispatch<React.SetStateAction<BookingFormData>>;
}

export const BookingModalDateTimeInputs = memo(function BookingModalDateTimeInputs({
  bookingForm,
  setBookingForm,
}: BookingModalDateTimeInputsProps) {
  return (
    <div className="space-y-2.5">
      {/* Date Input */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
          Date <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <i className="ri-calendar-line text-sm text-[#253C7D] dark:text-sky-400" />
          </div>
          <input
            type="date"
            required
            value={bookingForm.date}
            onChange={(e) => setBookingForm((prev) => ({ ...prev, date: e.target.value }))}
            className="w-full pl-9 pr-3 py-2 h-10 sm:h-9 bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-base md:text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] dark:focus:border-sky-400 cursor-pointer shadow-2xs transition-all"
          />
        </div>
      </div>

      {/* Start Time & End Time */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
            Start Time <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <i className="ri-time-line text-xs" />
            </div>
            <input
              type="time"
              required
              value={bookingForm.start_time}
              onChange={(e) => setBookingForm((prev) => ({ ...prev, start_time: e.target.value }))}
              className="w-full pl-8 pr-2 py-2 h-10 sm:h-9 bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-base md:text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] dark:focus:border-sky-400 cursor-pointer shadow-2xs text-center transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
            End Time <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <i className="ri-time-line text-xs" />
            </div>
            <input
              type="time"
              required
              value={bookingForm.end_time}
              onChange={(e) => setBookingForm((prev) => ({ ...prev, end_time: e.target.value }))}
              className="w-full pl-8 pr-2 py-2 h-10 sm:h-9 bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-base md:text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] dark:focus:border-sky-400 cursor-pointer shadow-2xs text-center transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
});
