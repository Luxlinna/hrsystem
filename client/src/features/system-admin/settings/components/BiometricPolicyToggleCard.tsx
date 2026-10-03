import { memo } from "react";

interface BiometricPolicyToggleCardProps {
  isFourPunch: boolean;
  toggling: boolean;
  onToggle: (checked: boolean) => void;
  activeTargetName?: string;
}

export const BiometricPolicyToggleCard = memo(function BiometricPolicyToggleCard({
  isFourPunch,
  toggling,
  onToggle,
  activeTargetName = "",
}: BiometricPolicyToggleCardProps) {
  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isFourPunch
          ? "bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-900/60"
          : "bg-slate-50 dark:bg-slate-800/40 border-gray-200/70 dark:border-slate-800"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow-xs ${
              isFourPunch ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
            }`}
          >
            <i className="ri-fingerprint-line" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900 dark:text-slate-100">
                4-Punch Attendance Policy
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isFourPunch
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/70 dark:text-indigo-300"
                    : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
                }`}
              >
                {isFourPunch ? "4-Punch Enabled" : "Standard (2-Punch)"}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
              {isFourPunch
                ? `Employees at ${activeTargetName} follow 4-punch daily attendance (Morning & Afternoon sessions). Scan windows apply for machine and mobile logs.`
                : `Employees at ${activeTargetName} use standard 2-punch attendance (Clock In & Clock Out).`}
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={isFourPunch}
            disabled={toggling}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>
    </div>
  );
});
