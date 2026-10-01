import React, { useState, useEffect } from "react";
import type { BranchScheduleData, WorkingHoursFormState } from "./types";

interface Props {
  isOpen: boolean;
  branch: BranchScheduleData;
  formState: WorkingHoursFormState;
  setFormState: React.Dispatch<React.SetStateAction<WorkingHoursFormState>>;
  saving: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export function AdjustWorkingHoursModal({
  isOpen,
  branch,
  formState,
  setFormState,
  saving,
  onClose,
  onSave,
}: Props) {
  const is24h =
    formState.morning_check_in_start?.slice(0, 5) === "00:00" &&
    formState.morning_check_in_end?.slice(0, 5) === "23:59" &&
    formState.afternoon_check_out_start?.slice(0, 5) === "00:00" &&
    formState.afternoon_check_out_end?.slice(0, 5) === "23:59";

  const [recordMode, setRecordMode] = useState<"all" | "window">(is24h ? "all" : "window");

  useEffect(() => { setRecordMode(is24h ? "all" : "window"); }, [isOpen, is24h]);

  const handleModeChange = (mode: "all" | "window") => {
    setRecordMode(mode);
    if (mode === "all") {
      setFormState((p) => ({
        ...p,
        morning_check_in_start: "00:00",
        morning_check_in_end: "23:59",
        afternoon_check_out_start: "00:00",
        afternoon_check_out_end: "23:59",
      }));
    } else {
      setFormState((p) => ({
        ...p,
        morning_check_in_start: p.morning_check_in_start === "00:00" ? "06:00" : p.morning_check_in_start,
        morning_check_in_end: p.morning_check_end === "23:59" ? "10:00" : p.morning_check_in_end,
        afternoon_check_out_start: p.afternoon_check_out_start === "00:00" ? "16:00" : p.afternoon_check_out_start,
        afternoon_check_out_end: p.afternoon_check_out_end === "23:59" ? "22:00" : p.afternoon_check_out_end,
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Edit Working Hours &amp; Windows — {branch.name}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Configure schedule, grace margins, and punch recording mode</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1">
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSave} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {/* 1. Working Hours */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">1. Standard Working Hours</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                <input type="time" required value={formState.work_start_time} onChange={(e) => setFormState((p) => ({ ...p, work_start_time: e.target.value }))} className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]" />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                <input type="time" required value={formState.work_end_time} onChange={(e) => setFormState((p) => ({ ...p, work_end_time: e.target.value }))} className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]" />
              </div>
            </div>
          </div>

          {/* 2. Grace Tolerances */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">2. Grace Tolerance Margins</div>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Late Grace (mins)</label>
                <input type="number" min="0" max="120" value={formState.late_grace_minutes} onChange={(e) => setFormState((p) => ({ ...p, late_grace_minutes: parseInt(e.target.value, 10) || 0 }))} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100 font-mono" />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Early Leave Grace (mins)</label>
                <input type="number" min="0" max="120" value={formState.early_leave_grace_minutes} onChange={(e) => setFormState((p) => ({ ...p, early_leave_grace_minutes: parseInt(e.target.value, 10) || 0 }))} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100 font-mono" />
              </div>
            </div>
          </div>

          {/* 3. Punch Recording Policy */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">3. Punch Recording Mode</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button type="button" onClick={() => handleModeChange("all")} className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${recordMode === "all" ? "border-[#253C7D] bg-[#253C7D]/5 dark:bg-sky-500/10 text-slate-900 dark:text-slate-100 font-semibold" : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400"}`}>
                <div className="flex items-center gap-1.5 mb-0.5"><i className="ri-record-circle-line text-emerald-600 text-xs" /><span className="text-xs">Record All Punches</span></div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Record punches anytime 24/7</div>
              </button>
              <button type="button" onClick={() => handleModeChange("window")} className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${recordMode === "window" ? "border-[#253C7D] bg-[#253C7D]/5 dark:bg-sky-500/10 text-slate-900 dark:text-slate-100 font-semibold" : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400"}`}>
                <div className="flex items-center gap-1.5 mb-0.5"><i className="ri-time-line text-indigo-600 text-xs" /><span className="text-xs">Custom Windows</span></div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Restrict check-in/out to specific hours</div>
              </button>
            </div>

            {recordMode === "window" && (
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span>Check-In Window (Arrival)</span></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-[11px] text-slate-500 mb-0.5">Window Open</label><input type="time" value={formState.morning_check_in_start} onChange={(e) => setFormState((p) => ({ ...p, morning_check_in_start: e.target.value }))} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100 font-mono" /></div>
                    <div><label className="block text-[11px] text-slate-500 mb-0.5">Window Close</label><input type="time" value={formState.morning_check_in_end} onChange={(e) => setFormState((p) => ({ ...p, morning_check_in_end: e.target.value }))} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100 font-mono" /></div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" /><span>Check-Out Window (Departure)</span></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-[11px] text-slate-500 mb-0.5">Window Open</label><input type="time" value={formState.afternoon_check_out_start} onChange={(e) => setFormState((p) => ({ ...p, afternoon_check_out_start: e.target.value }))} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100 font-mono" /></div>
                    <div><label className="block text-[11px] text-slate-500 mb-0.5">Window Close</label><input type="time" value={formState.afternoon_check_out_end} onChange={(e) => setFormState((p) => ({ ...p, afternoon_check_out_end: e.target.value }))} className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100 font-mono" /></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" disabled={saving} onClick={onClose} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium cursor-pointer transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-lg font-medium shadow-xs transition-colors cursor-pointer disabled:opacity-60">{saving ? "Saving..." : "Save Policy & Windows"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
