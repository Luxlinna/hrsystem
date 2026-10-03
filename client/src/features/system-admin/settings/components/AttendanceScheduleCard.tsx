import { memo } from "react";
import { ScheduleFieldItem } from "./ScheduleFieldItem";
import { BiometricScanWindowsSection } from "./BiometricScanWindowsSection";

interface AttendanceScheduleCardProps {
  getVal: (key: string) => string;
  updateValue: (key: string, value: string) => void;
  saveSetting?: (key: string) => Promise<void>;
  saving?: boolean;
  edited?: Record<string, string>;
}

const CORE_SCHEDULE_KEYS = [
  "working_days", "work_start_time", "work_end_time", "break_start_time", "break_end_time",
  "late_grace_minutes", "early_leave_grace_minutes", "saturday_start_time", "saturday_end_time",
  "checkout_reminder_minutes",
];

export const AttendanceScheduleCard = memo(function AttendanceScheduleCard({
  getVal,
  updateValue,
  saveSetting,
  saving = false,
  edited = {},
}: AttendanceScheduleCardProps) {
  return (
    <div className="w-full border border-[#253C7D]/30 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xs transition-all">
      <div className="bg-[#253C7D] dark:bg-[#1d2f60] text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-[#253C7D] dark:text-sky-300 flex items-center justify-center shrink-0 shadow-xs font-bold">
            <i className="ri-calendar-schedule-line text-lg" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold">
              Company-Wide Attendance Schedule Defaults
            </h3>
            <p className="text-[12px] text-white/80 mt-0.5">
              Default working days, shift hours, lunch break, grace periods, and scan windows for the whole organization.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        <div>
          <h4 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <i className="ri-time-line text-[#253C7D] dark:text-sky-400" /> Working Hours &amp; Grace Periods
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CORE_SCHEDULE_KEYS.map((key) => (
              <ScheduleFieldItem
                key={key}
                fieldKey={key}
                value={getVal(key)}
                onChange={(val) => updateValue(key, val)}
                onSave={saveSetting ? () => saveSetting(key) : undefined}
                saving={saving}
                hasEdited={edited[key] !== undefined}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-slate-800 pt-5">
          <BiometricScanWindowsSection />
        </div>
      </div>
    </div>
  );
});
