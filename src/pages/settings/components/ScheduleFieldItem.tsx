import { memo } from "react";
import { keyLabels } from "../constants";

interface Props {
  fieldKey: string;
  value: string;
  onChange: (val: string) => void;
  onSave?: () => void;
  saving?: boolean;
  hasEdited?: boolean;
  customBg?: string;
}

const HELPER_TEXTS: Record<string, string> = {
  work_start_time: "Shift start time. Scans before this are on-time, after are marked late.",
  morning_check_in_start: "Earliest biometric check-in accepted (e.g. 06:00 AM).",
  morning_check_in_end: "Latest check-in accepted (e.g. 09:00 AM). Scans after this are NOT recorded.",
  break_start_time: "Morning shift end / lunch start (e.g. 11:30 AM). Scans before this are early checkout.",
  morning_check_out_start: "Earliest morning checkout accepted (e.g. 10:00 AM).",
  morning_check_out_end: "Latest morning checkout accepted (e.g. 12:00 PM). Scans after this are NOT recorded.",
  break_end_time: "Afternoon shift start (e.g. 01:00 PM). Scans before this are on-time, after are marked late.",
  afternoon_check_in_start: "Earliest afternoon check-in accepted (e.g. 12:00 PM).",
  afternoon_check_in_end: "Latest afternoon check-in accepted (e.g. 02:00 PM). Scans after this are NOT recorded.",
  work_end_time: "Afternoon shift end time (e.g. 05:00 PM).",
  afternoon_check_out_start: "Earliest afternoon checkout accepted (e.g. 04:00 PM).",
  afternoon_check_out_end: "Latest afternoon checkout accepted (e.g. 06:00 PM). Scans after this are NOT recorded.",
};

export const ScheduleFieldItem = memo(function ScheduleFieldItem({
  fieldKey,
  value,
  onChange,
  onSave,
  saving,
  hasEdited,
  customBg,
}: Props) {
  const helperText = HELPER_TEXTS[fieldKey];
  const inputType =
    fieldKey.includes("time") || fieldKey.includes("start") || fieldKey.includes("end")
      ? "time"
      : fieldKey === "working_days"
      ? "text"
      : "number";

  return (
    <div
      className={`min-w-0 p-3.5 rounded-xl border ${
        customBg || "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800/60"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <label className="text-[12px] font-bold text-gray-800 dark:text-slate-200">
          {keyLabels[fieldKey] || fieldKey}
        </label>
      </div>
      {helperText && (
        <p className="text-[10px] text-gray-400 dark:text-slate-400 mb-1.5 leading-snug">{helperText}</p>
      )}
      <div className="flex gap-2 mt-1">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 px-3.5 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]"
        />
        {hasEdited && onSave && (
          <button
            onClick={onSave}
            disabled={saving}
            className="px-3 py-1.5 bg-[#253C7D] dark:bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 shrink-0 cursor-pointer"
          >
            Save
          </button>
        )}
      </div>
    </div>
  );
});
