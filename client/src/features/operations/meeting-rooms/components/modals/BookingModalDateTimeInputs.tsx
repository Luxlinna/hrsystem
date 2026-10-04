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
    <div className="space-y-2">
      {/* Date Input - fits date length */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
          Date <span className="text-rose-500">*</span>
        </label>
        <div className="relative inline-flex items-center">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <i className="ri-calendar-line text-xs text-[#253C7D] dark:text-sky-400" />
          </div>
          <input
            type="date"
            required
            value={bookingForm.date}
            onChange={(e) => setBookingForm((prev) => ({ ...prev, date: e.target.value }))}
            className="w-[145px] sm:w-[155px] pl-7 pr-2.5 py-1 h-8.5 bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] dark:focus:border-sky-400 cursor-pointer shadow-2xs transition-all"
          />
        </div>
      </div>

      {/* Start Time & End Time in One Line fitting their text */}
      <div className="flex items-center gap-2.5">
        {/* Start Time */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Start Time <span className="text-rose-500">*</span>
          </label>
          <div className="relative inline-flex items-center">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <i className="ri-time-line text-[11px]" />
            </div>
            <input
              type="time"
              required
              value={bookingForm.start_time}
              onChange={(e) => setBookingForm((prev) => ({ ...prev, start_time: e.target.value }))}
              className="w-[115px] sm:w-[125px] pl-6 pr-2 py-1 h-8.5 bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] dark:focus:border-sky-400 cursor-pointer shadow-2xs text-center transition-all"
            />
          </div>
        </div>

        {/* End Time */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            End Time <span className="text-rose-500">*</span>
          </label>
          <div className="relative inline-flex items-center">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <i className="ri-time-line text-[11px]" />
            </div>
            <input
              type="time"
              required
              value={bookingForm.end_time}
              onChange={(e) => setBookingForm((prev) => ({ ...prev, end_time: e.target.value }))}
              className="w-[115px] sm:w-[125px] pl-6 pr-2 py-1 h-8.5 bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] dark:focus:border-sky-400 cursor-pointer shadow-2xs text-center transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
});
