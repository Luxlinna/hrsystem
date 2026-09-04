import { memo } from "react";
import type { WorkSiteFormState } from "../types";

interface WorkSiteScheduleSectionProps {
  form: WorkSiteFormState;
  setForm: React.Dispatch<React.SetStateAction<WorkSiteFormState>>;
}

export const WorkSiteScheduleSection = memo(function WorkSiteScheduleSection({
  form,
  setForm,
}: WorkSiteScheduleSectionProps) {
  return (
    <div className="border-t border-gray-100 pt-5 space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-[12px] font-semibold text-gray-700">Work Schedule (optional)</label>
        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#253C7D]">
          <input
            type="checkbox"
            checked={form.is_four_punch_enabled}
            onChange={(e) => setForm({ ...form, is_four_punch_enabled: e.target.checked })}
            className="rounded text-[#253C7D] focus:ring-0 cursor-pointer"
          />
          4-Punch Mode (Morning + Afternoon)
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] text-gray-600 mb-1 font-semibold">Start Time (Check-In)</label>
          <input
            type="time"
            value={form.work_start_time}
            onChange={(e) => setForm({ ...form, work_start_time: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]"
          />
          <p className="text-[11px] text-gray-400 mt-1">Start time — check-ins after this count as late</p>
        </div>
        <div>
          <label className="block text-[11px] text-gray-600 mb-1 font-semibold">End Time (Check-Out)</label>
          <input
            type="time"
            value={form.work_end_time}
            onChange={(e) => setForm({ ...form, work_end_time: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]"
          />
          <p className="text-[11px] text-gray-400 mt-1">End time — check-outs before this count as early</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/40 p-3 rounded-xl border border-blue-100">
        <div>
          <label className="block text-[11px] text-[#253C7D] mb-1 font-bold">Late Arrival Grace (Minutes)</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="120"
              value={form.late_grace_minutes}
              onChange={(e) => setForm({ ...form, late_grace_minutes: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#253C7D]"
              placeholder="15"
            />
            <span className="absolute right-3 top-2 text-[10px] text-gray-400">mins grace</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Chance given to employee arriving late before marked late</p>
        </div>
        <div>
          <label className="block text-[11px] text-[#253C7D] mb-1 font-bold">Early Departure Grace (Minutes)</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="120"
              value={form.early_leave_grace_minutes}
              onChange={(e) => setForm({ ...form, early_leave_grace_minutes: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#253C7D]"
              placeholder="15"
            />
            <span className="absolute right-3 top-2 text-[10px] text-gray-400">mins grace</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Tolerance window before shift end without early violation</p>
        </div>
      </div>

      {form.is_four_punch_enabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
          <div>
            <label className="block text-[11px] text-gray-600 mb-1 font-semibold">Lunch Break Out</label>
            <input
              type="time"
              value={form.break_start_time}
              onChange={(e) => setForm({ ...form, break_start_time: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#253C7D]"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Morning checkout (e.g. 11:30 AM)</p>
          </div>
          <div>
            <label className="block text-[11px] text-gray-600 mb-1 font-semibold">Lunch Break In</label>
            <input
              type="time"
              value={form.break_end_time}
              onChange={(e) => setForm({ ...form, break_end_time: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#253C7D]"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Afternoon checkin (e.g. 01:00 PM)</p>
          </div>
        </div>
      )}
    </div>
  );
});
