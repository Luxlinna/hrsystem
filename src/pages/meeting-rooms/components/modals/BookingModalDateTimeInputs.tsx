import { memo } from "react";
import type { BookingFormData } from "../../types";
import { DURATION_OPTIONS } from "../../constants";
import { addMinutesToTime } from "../../roomUtils";

interface BookingModalDateTimeInputsProps {
  bookingForm: BookingFormData;
  setBookingForm: React.Dispatch<React.SetStateAction<BookingFormData>>;
}

export const BookingModalDateTimeInputs = memo(function BookingModalDateTimeInputs({
  bookingForm,
  setBookingForm,
}: BookingModalDateTimeInputsProps) {
  const applyDuration = (mins: number) => {
    const newEnd = addMinutesToTime(bookingForm.start_time, mins);
    setBookingForm((prev) => ({ ...prev, end_time: newEnd }));
  };

  return (
    <div className="space-y-1.5">
      {/* Row 1: Date Input with 100% width so it's always clean and readable */}
      <div>
        <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
          Date <span className="text-rose-500">*</span>
        </label>
        <input
          type="date"
          required
          value={bookingForm.date}
          onChange={(e) => setBookingForm((prev) => ({ ...prev, date: e.target.value }))}
          className="w-full px-2 py-0.5 h-7 bg-slate-50/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-800 dark:text-slate-100 focus:bg-white focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400 cursor-pointer shadow-2xs"
        />
      </div>

      {/* Row 2: Start Time & End Time in 2 Equal 50% Columns */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
            Start Time <span className="text-rose-500">*</span>
          </label>
          <input
            type="time"
            required
            value={bookingForm.start_time}
            onChange={(e) => setBookingForm((prev) => ({ ...prev, start_time: e.target.value }))}
            className="w-full px-2 py-0.5 h-7 bg-slate-50/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-800 dark:text-slate-100 focus:bg-white focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400 cursor-pointer shadow-2xs text-center"
          />
        </div>

        <div>
          <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
            End Time <span className="text-rose-500">*</span>
          </label>
          <input
            type="time"
            required
            value={bookingForm.end_time}
            onChange={(e) => setBookingForm((prev) => ({ ...prev, end_time: e.target.value }))}
            className="w-full px-2 py-0.5 h-7 bg-slate-50/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-800 dark:text-slate-100 focus:bg-white focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400 cursor-pointer shadow-2xs text-center"
          />
        </div>
      </div>

      {/* Row 3: Quick Duration Chips */}
      <div className="flex items-center gap-1 flex-wrap pt-0.5">
        <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">
          Duration:
        </span>
        {DURATION_OPTIONS.map((opt) => (
          <button
            key={opt.mins}
            type="button"
            onClick={() => applyDuration(opt.mins)}
            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-[#253C7D] hover:text-white dark:hover:bg-sky-500 dark:hover:text-slate-950 text-[9.5px] font-bold text-slate-600 dark:text-slate-300 transition-all cursor-pointer active:scale-95"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
});
