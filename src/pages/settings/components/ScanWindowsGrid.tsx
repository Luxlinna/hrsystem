import { memo } from "react";
import { SCAN_WINDOWS_FIELDS } from "../constants/biometricScanFields";

interface ScanWindowsGridProps {
  getWindowTime: (key: string) => string;
  onTimeChange: (key: string, val: string) => void;
  onSaveField: (key: string) => void;
  savingField: string | null;
}

export const ScanWindowsGrid = memo(function ScanWindowsGrid({
  getWindowTime,
  onTimeChange,
  onSaveField,
  savingField,
}: ScanWindowsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
      {SCAN_WINDOWS_FIELDS.map((f) => (
        <div
          key={f.key}
          className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100/80 dark:border-indigo-950/60 shadow-2xs space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-gray-800 dark:text-slate-200">
              {f.label}
            </label>
            <button
              type="button"
              onClick={() => onSaveField(f.key)}
              disabled={savingField === f.key}
              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {savingField === f.key ? "Saving…" : "Save"}
            </button>
          </div>
          <input
            type="time"
            value={getWindowTime(f.key)}
            onChange={(e) => onTimeChange(f.key, e.target.value)}
            className="w-full px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-600"
          />
          <p className="text-[10px] text-gray-400 dark:text-slate-500">{f.hint}</p>
        </div>
      ))}
    </div>
  );
});
