import { memo } from "react";
import { PRESET_COLORS } from "../../constants";
import type { ShiftForm } from "../../types";
import { calculateHours } from "../../utils";

interface ShiftTimingCapacityFieldsProps {
  shiftForm: ShiftForm;
  setShiftForm: React.Dispatch<React.SetStateAction<ShiftForm>>;
}

export const ShiftTimingCapacityFields = memo(function ShiftTimingCapacityFields({
  shiftForm,
  setShiftForm,
}: ShiftTimingCapacityFieldsProps) {
  const duration = calculateHours(shiftForm.start_time, shiftForm.end_time);
  const totalWorkingHours = Math.round(duration * (Number(shiftForm.capacity) || 1) * 10) / 10;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Shift Date *</label>
          <input
            required
            type="date"
            value={shiftForm.shift_date}
            onChange={(e) => setShiftForm({ ...shiftForm, shift_date: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#253C7D]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Time *</label>
          <input
            required
            type="time"
            value={shiftForm.start_time}
            onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#253C7D]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Time *</label>
          <input
            required
            type="time"
            value={shiftForm.end_time}
            onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#253C7D]"
          />
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <i className="ri-time-line text-[#253C7D]" />
          <span>Duration: <strong className="text-slate-900">{duration} hrs</strong></span>
        </div>
        <div className="text-slate-500">
          Total Workload: <strong className="text-[#253C7D]">{totalWorkingHours} staff hrs</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Staff Capacity (Max Assigned)</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShiftForm({ ...shiftForm, capacity: Math.max(1, (shiftForm.capacity || 1) - 1) })}
              className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold cursor-pointer transition-colors"
            >
              <i className="ri-subtract-line text-sm" />
            </button>
            <input
              type="number"
              min={1}
              max={100}
              value={shiftForm.capacity}
              onChange={(e) => setShiftForm({ ...shiftForm, capacity: Math.max(1, parseInt(e.target.value) || 1) })}
              className="flex-1 text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#253C7D]"
            />
            <button
              type="button"
              onClick={() => setShiftForm({ ...shiftForm, capacity: (shiftForm.capacity || 1) + 1 })}
              className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold cursor-pointer transition-colors"
            >
              <i className="ri-add-line text-sm" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Shift Color Tag</label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                type="button"
                key={c.value}
                onClick={() => setShiftForm({ ...shiftForm, color: c.value })}
                title={c.name}
                className={`w-7 h-7 rounded-full cursor-pointer transition-all ${
                  shiftForm.color === c.value ? "scale-115 ring-2 ring-offset-2 ring-slate-800 shadow-sm" : "opacity-80 hover:opacity-100 hover:scale-105"
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
});
