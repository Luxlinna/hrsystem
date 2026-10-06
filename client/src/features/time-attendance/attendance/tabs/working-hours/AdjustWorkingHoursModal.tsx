import React, { useState, useEffect } from "react";
import type { BranchScheduleData, WorkingHoursFormState } from "./types";
import { AutoCheckoutField } from "./AutoCheckoutField";

interface Props {
  isOpen: boolean;
  branch: BranchScheduleData;
  formState: WorkingHoursFormState;
  setFormState: React.Dispatch<React.SetStateAction<WorkingHoursFormState>>;
  saving: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export function AdjustWorkingHoursModal({ isOpen, branch, formState, setFormState, saving, onClose, onSave }: Props) {
  const is24h = formState.morning_check_in_start?.slice(0, 5) === "00:00" && formState.morning_check_in_end?.slice(0, 5) === "23:59";
  const [isCustomWindow, setIsCustomWindow] = useState(!is24h);

  useEffect(() => { setIsCustomWindow(!is24h); }, [isOpen, is24h]);

  const toggleWindowMode = (custom: boolean) => {
    setIsCustomWindow(custom);
    setFormState((p) => ({
      ...p,
      morning_check_in_start: custom ? "06:00" : "00:00", morning_check_in_end: custom ? "10:00" : "23:59",
      morning_check_out_start: custom ? "11:30" : "00:00", morning_check_out_end: custom ? "13:30" : "23:59",
      afternoon_check_in_start: custom ? "12:30" : "00:00", afternoon_check_in_end: custom ? "14:30" : "23:59",
      afternoon_check_out_start: custom ? "16:00" : "00:00", afternoon_check_out_end: custom ? "22:00" : "23:59",
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Edit Working Hours</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{branch.name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={onSave} className="p-5 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
          {/* Punch Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Daily Punch Mode</label>
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setFormState((p) => ({ ...p, is_four_punch_enabled: false }))}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${!formState.is_four_punch_enabled ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                2 Punches / Day
              </button>
              <button
                type="button"
                onClick={() => setFormState((p) => ({ ...p, is_four_punch_enabled: true }))}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${formState.is_four_punch_enabled ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                4 Punches / Day
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {!formState.is_four_punch_enabled ? "Morning check-in & evening check-out (lunch is auto-deducted)" : "Morning check-in, lunch out/in, and evening check-out"}
            </p>
          </div>
          {/* Shift & Lunch Hours */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Work Start</label>
              <input type="time" required value={formState.work_start_time} onChange={(e) => setFormState((p) => ({ ...p, work_start_time: e.target.value }))} className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono" />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Work End</label>
              <input type="time" required value={formState.work_end_time} onChange={(e) => setFormState((p) => ({ ...p, work_end_time: e.target.value }))} className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono" />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Lunch Break Start</label>
              <input type="time" required value={formState.break_start_time} onChange={(e) => setFormState((p) => ({ ...p, break_start_time: e.target.value }))} className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono" />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Lunch Break End</label>
              <input type="time" required value={formState.break_end_time} onChange={(e) => setFormState((p) => ({ ...p, break_end_time: e.target.value }))} className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono" />
            </div>
          </div>
          {/* Grace Tolerances */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Late Grace (minutes)</label>
              <input type="number" min="0" max="120" value={formState.late_grace_minutes} onChange={(e) => setFormState((p) => ({ ...p, late_grace_minutes: parseInt(e.target.value, 10) || 0 }))} className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono" />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Early Leave Grace (minutes)</label>
              <input type="number" min="0" max="120" value={formState.early_leave_grace_minutes} onChange={(e) => setFormState((p) => ({ ...p, early_leave_grace_minutes: parseInt(e.target.value, 10) || 0 }))} className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono" />
            </div>
          </div>

          {/* Punch Windows */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Punch Scanning Windows</label>
              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleWindowMode(false)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${!isCustomWindow ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs" : "text-slate-500"}`}
                >
                  Anytime (24/7)
                </button>
                <button
                  type="button"
                  onClick={() => toggleWindowMode(true)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${isCustomWindow ? "bg-[#253C7D] text-white shadow-xs" : "text-slate-500"}`}
                >
                  Custom Windows
                </button>
              </div>
            </div>

            {isCustomWindow && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Check-In Window</label>
                    <div className="flex items-center gap-1 font-mono">
                      <input type="time" value={formState.morning_check_in_start} onChange={(e) => setFormState((p) => ({ ...p, morning_check_in_start: e.target.value }))} className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs" />
                      <span className="text-slate-400">–</span>
                      <input type="time" value={formState.morning_check_in_end} onChange={(e) => setFormState((p) => ({ ...p, morning_check_in_end: e.target.value }))} className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Check-Out Window</label>
                    <div className="flex items-center gap-1 font-mono">
                      <input type="time" value={formState.afternoon_check_out_start} onChange={(e) => setFormState((p) => ({ ...p, afternoon_check_out_start: e.target.value }))} className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs" />
                      <span className="text-slate-400">–</span>
                      <input type="time" value={formState.afternoon_check_out_end} onChange={(e) => setFormState((p) => ({ ...p, afternoon_check_out_end: e.target.value }))} className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs" />
                    </div>
                  </div>
                </div>

                {formState.is_four_punch_enabled && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Lunch Out Window</label>
                      <div className="flex items-center gap-1 font-mono">
                        <input type="time" value={formState.morning_check_out_start} onChange={(e) => setFormState((p) => ({ ...p, morning_check_out_start: e.target.value }))} className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs" />
                        <span className="text-slate-400">–</span>
                        <input type="time" value={formState.morning_check_out_end} onChange={(e) => setFormState((p) => ({ ...p, morning_check_out_end: e.target.value }))} className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Lunch In Window</label>
                      <div className="flex items-center gap-1 font-mono">
                        <input type="time" value={formState.afternoon_check_in_start} onChange={(e) => setFormState((p) => ({ ...p, afternoon_check_in_start: e.target.value }))} className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs" />
                        <span className="text-slate-400">–</span>
                        <input type="time" value={formState.afternoon_check_in_end} onChange={(e) => setFormState((p) => ({ ...p, afternoon_check_in_end: e.target.value }))} className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Auto Check-Out Control */}
          <AutoCheckoutField formState={formState} setFormState={setFormState} />

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" disabled={saving} onClick={onClose} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium cursor-pointer transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60">
              {saving ? "Saving..." : "Save Policy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
