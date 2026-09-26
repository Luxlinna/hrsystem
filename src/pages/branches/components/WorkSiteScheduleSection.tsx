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
    <div className="border-t border-gray-100 dark:border-slate-800 pt-5 space-y-4">
      {/* 4-Punch Mode Card */}
      <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm shadow-xs shrink-0">
            <i className="ri-fingerprint-line" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-900 dark:text-slate-100 block">
              4-Punch Attendance Mode
            </span>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-tight">
              Requires 4 scans per day: Morning In, Lunch Out, Lunch In, Evening Out.
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={form.is_four_punch_enabled}
            onChange={(e) => setForm({ ...form, is_four_punch_enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {/* Lunch Break Times if 4-Punch is active */}
      {form.is_four_punch_enabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-indigo-50/30 dark:bg-indigo-950/20 p-3.5 rounded-xl border border-indigo-100/70 dark:border-indigo-900/30">
          <div>
            <label className="block text-[11px] text-indigo-950 dark:text-indigo-300 mb-1 font-bold">
              Lunch Break Out (Morning End)
            </label>
            <input
              type="time"
              value={form.break_start_time}
              onChange={(e) => setForm({ ...form, break_start_time: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-600"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Scans before this are early departure (e.g. 11:30 AM)</p>
          </div>
          <div>
            <label className="block text-[11px] text-indigo-950 dark:text-indigo-300 mb-1 font-bold">
              Lunch Break In (Afternoon Return)
            </label>
            <input
              type="time"
              value={form.break_end_time}
              onChange={(e) => setForm({ ...form, break_end_time: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-600"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Scans after this are late return (e.g. 01:00 PM)</p>
          </div>
        </div>
      )}

      {/* Standard Shift Hours */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] text-gray-700 dark:text-slate-300 mb-1 font-bold">Work Start Time (Morning Check-In)</label>
          <input
            type="time"
            value={form.work_start_time}
            onChange={(e) => setForm({ ...form, work_start_time: e.target.value })}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#253C7D]"
          />
          <p className="text-[10px] text-gray-400 mt-0.5">Shift start time — check-ins after this count as late</p>
        </div>
        <div>
          <label className="block text-[11px] text-gray-700 dark:text-slate-300 mb-1 font-bold">Work End Time (Evening Check-Out)</label>
          <input
            type="time"
            value={form.work_end_time}
            onChange={(e) => setForm({ ...form, work_end_time: e.target.value })}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#253C7D]"
          />
          <p className="text-[10px] text-gray-400 mt-0.5">Shift end time — check-outs before this count as early</p>
        </div>
      </div>

      {/* Grace Periods */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/40 dark:bg-sky-950/20 p-3 rounded-xl border border-blue-100 dark:border-slate-800">
        <div>
          <label className="block text-[11px] text-[#253C7D] dark:text-sky-300 mb-1 font-bold">Late Arrival Grace (Minutes)</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="120"
              value={form.late_grace_minutes}
              onChange={(e) => setForm({ ...form, late_grace_minutes: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-800 dark:text-slate-200 focus:outline-none focus:border-[#253C7D]"
              placeholder="15"
            />
            <span className="absolute right-3 top-2 text-[10px] text-gray-400">mins grace</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">Tolerance window before being marked late</p>
        </div>
        <div>
          <label className="block text-[11px] text-[#253C7D] dark:text-sky-300 mb-1 font-bold">Early Departure Grace (Minutes)</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="120"
              value={form.early_leave_grace_minutes}
              onChange={(e) => setForm({ ...form, early_leave_grace_minutes: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-800 dark:text-slate-200 focus:outline-none focus:border-[#253C7D]"
              placeholder="15"
            />
            <span className="absolute right-3 top-2 text-[10px] text-gray-400">mins grace</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">Tolerance window before shift end</p>
        </div>
      </div>
    </div>
  );
});
