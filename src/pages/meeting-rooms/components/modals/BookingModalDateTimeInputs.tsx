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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={bookingForm.date}
            onChange={(e) => setBookingForm((prev) => ({ ...prev, date: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/80 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Start Time <span className="text-rose-500">*</span>
          </label>
          <input
            type="time"
            required
            value={bookingForm.start_time}
            onChange={(e) => setBookingForm((prev) => ({ ...prev, start_time: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/80 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            End Time <span className="text-rose-500">*</span>
          </label>
          <input
            type="time"
            required
            value={bookingForm.end_time}
            onChange={(e) => setBookingForm((prev) => ({ ...prev, end_time: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/80 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
          Quick Duration
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.mins}
              type="button"
              onClick={() => applyDuration(opt.mins)}
              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#253C7D] hover:text-white text-[11px] font-bold text-gray-600 transition-colors cursor-pointer"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
});
