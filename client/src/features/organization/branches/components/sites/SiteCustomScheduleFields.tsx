import React from "react";
import type { WorkSiteFormState } from "../../types";

interface Props {
  form: WorkSiteFormState;
  setForm: React.Dispatch<React.SetStateAction<WorkSiteFormState>>;
  isReadOnly?: boolean;
}

const SHIFT_PRESETS = [
  { label: "Standard Office", start: "08:00", end: "17:00", bStart: "12:00", bEnd: "13:00", fourPunch: false, auto: "18:00" },
  { label: "Farm / Plantation", start: "07:30", end: "17:00", bStart: "11:30", bEnd: "13:00", fourPunch: true, auto: "18:00" },
  { label: "Factory Shift", start: "07:00", end: "16:00", bStart: "11:30", bEnd: "12:30", fourPunch: false, auto: "17:00" },
  { label: "Retail / Store", start: "09:00", end: "18:00", bStart: "12:30", bEnd: "13:30", fourPunch: false, auto: "19:00" },
];

export function SiteCustomScheduleFields({ form, setForm, isReadOnly = false }: Props) {
  const applyPreset = (preset: typeof SHIFT_PRESETS[0]) => {
    setForm((p) => ({
      ...p,
      working_hours_mode: "custom",
      work_start_time: preset.start,
      work_end_time: preset.end,
      break_start_time: preset.bStart,
      break_end_time: preset.bEnd,
      is_four_punch_enabled: preset.fourPunch,
      auto_checkout_time: preset.auto,
      is_auto_checkout_enabled: true,
    }));
  };

  return (
    <div className="space-y-3.5 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
      {!isReadOnly && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 font-medium">Quick Presets:</span>
          {SHIFT_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-2 py-0.5 rounded text-[11px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              {p.label} ({p.start}–{p.end})
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Daily Punch Mode</label>
          <div className="grid grid-cols-2 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg gap-1">
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => setForm((p) => ({ ...p, is_four_punch_enabled: false }))}
              className={`py-1 text-xs font-semibold rounded cursor-pointer transition-all ${
                !form.is_four_punch_enabled ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs" : "text-slate-600"
              }`}
            >
              2 Punches / Day
            </button>
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => setForm((p) => ({ ...p, is_four_punch_enabled: true }))}
              className={`py-1 text-xs font-semibold rounded cursor-pointer transition-all ${
                form.is_four_punch_enabled ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs" : "text-slate-600"
              }`}
            >
              4 Punches / Day
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Auto Check-Out Cutoff</label>
          <div className="flex items-center gap-2">
            <input
              type="time"
              disabled={isReadOnly || !(form.is_auto_checkout_enabled ?? true)}
              value={form.auto_checkout_time || "18:00"}
              onChange={(e) => setForm((p) => ({ ...p, auto_checkout_time: e.target.value }))}
              className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono"
            />
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => setForm((p) => ({ ...p, is_auto_checkout_enabled: !(p.is_auto_checkout_enabled ?? true) }))}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                form.is_auto_checkout_enabled ?? true
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
              }`}
            >
              {form.is_auto_checkout_enabled ?? true ? "Active" : "Disabled"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Work Start</label>
          <input
            type="time"
            disabled={isReadOnly}
            value={form.work_start_time}
            onChange={(e) => setForm((p) => ({ ...p, work_start_time: e.target.value }))}
            className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Work End</label>
          <input
            type="time"
            disabled={isReadOnly}
            value={form.work_end_time}
            onChange={(e) => setForm((p) => ({ ...p, work_end_time: e.target.value }))}
            className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Lunch Break Start</label>
          <input
            type="time"
            disabled={isReadOnly}
            value={form.break_start_time}
            onChange={(e) => setForm((p) => ({ ...p, break_start_time: e.target.value }))}
            className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Lunch Break End</label>
          <input
            type="time"
            disabled={isReadOnly}
            value={form.break_end_time}
            onChange={(e) => setForm((p) => ({ ...p, break_end_time: e.target.value }))}
            className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono"
          />
        </div>
      </div>
    </div>
  );
}
