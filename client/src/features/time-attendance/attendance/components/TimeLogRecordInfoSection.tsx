import { memo } from "react";
import type { AttendanceRecord } from "../types";

interface Props {
  record: AttendanceRecord;
  deviceName: string;
  site: string;
  formattedLogDate: string;
  punchInTime: string;
  punchOutTime: string | null;
}

export const TimeLogRecordInfoSection = memo(function TimeLogRecordInfoSection({
  record: r,
  deviceName,
  site,
  formattedLogDate,
  punchInTime,
  punchOutTime,
}: Props) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-[#253C7D] dark:text-sky-400 uppercase tracking-wider">
        TIME LOG INFO
      </h3>

      <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
        <div className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
          <div className="py-2.5 flex items-center">
            <span className="w-36 text-gray-500 dark:text-slate-400 font-medium">Device Name</span>
            <span className="font-semibold text-gray-800 dark:text-slate-200">{deviceName}</span>
          </div>

          <div className="py-2.5 flex items-center">
            <span className="w-36 text-gray-500 dark:text-slate-400 font-medium">Log Type</span>
            <span className="font-semibold text-gray-800 dark:text-slate-200">
              Standalone Terminal
            </span>
          </div>

          <div className="py-2.5 flex items-center">
            <span className="w-36 text-gray-500 dark:text-slate-400 font-medium">Log Site</span>
            <span className="font-semibold text-gray-800 dark:text-slate-200">{site}</span>
          </div>

          <div className="py-2.5 flex items-center">
            <span className="w-36 text-gray-500 dark:text-slate-400 font-medium">Date</span>
            <span className="font-semibold text-gray-800 dark:text-slate-200">
              {formattedLogDate}
            </span>
          </div>

          <div className="py-2.5 flex items-center">
            <span className="w-36 text-gray-500 dark:text-slate-400 font-medium">Time Log</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-800 dark:text-slate-200">{punchInTime}</span>
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-[10px] rounded font-semibold">
                  Time In
                </span>
              </div>

              {punchOutTime && (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-800 dark:text-slate-200">
                    {punchOutTime}
                  </span>
                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-[10px] rounded font-semibold">
                    Time Out
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="py-2.5 flex items-center">
            <span className="w-36 text-gray-500 dark:text-slate-400 font-medium">Remark</span>
            <span className="font-medium text-gray-600 dark:text-slate-300">
              {r.notes || "—"}
            </span>
          </div>

          <div className="py-2.5 flex items-center">
            <span className="w-36 text-gray-500 dark:text-slate-400 font-medium">Status</span>
            <span className="px-2 py-0.5 rounded bg-emerald-400 text-white font-bold text-[10px] shadow-2xs uppercase">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
