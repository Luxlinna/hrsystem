import { memo } from "react";
import type { Shift } from "../../types";
import { formatDate } from "../../utils";

interface CopyWeekModalProps {
  show: boolean;
  onClose: () => void;
  weekShifts: Shift[];
  weekDates: Date[];
  copyIncludeStaff: boolean;
  setCopyIncludeStaff: (v: boolean) => void;
  submitting: boolean;
  onCopyWeekSchedule: () => Promise<void>;
}

export const CopyWeekModal = memo(function CopyWeekModal({
  show,
  onClose,
  weekShifts,
  weekDates,
  copyIncludeStaff,
  setCopyIncludeStaff,
  submitting,
  onCopyWeekSchedule,
}: CopyWeekModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#253C7D] flex items-center justify-center font-bold">
              <i className="ri-file-copy-2-line text-lg" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Copy Week Schedule</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs text-slate-600">
          <p>
            Duplicate all <span className="font-bold text-slate-900">{weekShifts.length} shifts</span> from the current week to the following week.
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Current Week:</span>
              <span className="font-bold text-slate-800">{formatDate(weekDates[0])} – {formatDate(weekDates[6])}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Next Week:</span>
              <span className="font-bold text-[#253C7D]">
                {(() => {
                  const nextMon = new Date(weekDates[0]);
                  nextMon.setDate(nextMon.getDate() + 7);
                  const nextSun = new Date(weekDates[6]);
                  nextSun.setDate(nextSun.getDate() + 7);
                  return `${formatDate(nextMon)} – ${formatDate(nextSun)}`;
                })()}
              </span>
            </div>
          </div>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={copyIncludeStaff}
              onChange={(e) => setCopyIncludeStaff(e.target.checked)}
              className="rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D]"
            />
            <div>
              <span className="font-bold text-slate-800 block">Include Employee Assignments</span>
              <span className="text-[11px] text-slate-400">Keep workers assigned on duplicate shifts</span>
            </div>
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onCopyWeekSchedule}
              disabled={submitting || weekShifts.length === 0}
              className="flex-1 py-2.5 bg-[#253C7D] text-white text-xs font-bold rounded-xl hover:bg-[#1E293B] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {submitting ? "Cloning..." : `Clone ${weekShifts.length} Shifts`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
