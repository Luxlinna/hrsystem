import React from "react";
import type { WorkingHoursFormState } from "./types";

interface Props {
  formState: WorkingHoursFormState;
  setFormState: React.Dispatch<React.SetStateAction<WorkingHoursFormState>>;
}

const PRESET_TIMES = ["17:30", "18:00", "18:30", "19:00", "20:00"];

export function AutoCheckoutField({ formState, setFormState }: Props) {
  const isEnabled = formState.is_auto_checkout_enabled ?? true;
  const cutoffTime = formState.auto_checkout_time || "18:00";

  const handleToggle = () => {
    setFormState((prev) => ({
      ...prev,
      is_auto_checkout_enabled: !isEnabled,
      auto_checkout_time: prev.auto_checkout_time || "18:00",
    }));
  };

  const handleTimeChange = (time: string) => {
    setFormState((prev) => ({ ...prev, auto_checkout_time: time }));
  };

  return (
    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#253C7D]/10 dark:bg-sky-950/60 flex items-center justify-center text-[#253C7D] dark:text-sky-300">
            <i className="ri-timer-flash-line text-xs" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Automatic Check-Out
            </label>
            <p className="text-[11px] text-slate-400">
              Auto-closes shift if employee forgets to clock out
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          role="switch"
          aria-checked={isEnabled}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
            isEnabled ? "bg-[#253C7D] dark:bg-sky-600" : "bg-slate-300 dark:bg-slate-700"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              isEnabled ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {isEnabled ? (
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Auto Check-Out Cutoff Time
            </span>
            <input
              type="time"
              required={isEnabled}
              value={cutoffTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-1 focus:ring-[#253C7D]"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[11px] text-slate-400">Presets:</span>
            {PRESET_TIMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTimeChange(t)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  cutoffTime.slice(0, 5) === t
                    ? "bg-[#253C7D] text-white font-medium"
                    : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Employees with an open check-in will be automatically clocked out at{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
              {cutoffTime.slice(0, 5)}
            </span>
            , preventing unclosed records overnight.
          </p>
        </div>
      ) : (
        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-2.5 text-[11px] text-amber-700 dark:text-amber-400">
          Auto check-out is disabled. Employees who miss checkout must be manually resolved by HR.
        </div>
      )}
    </div>
  );
}
