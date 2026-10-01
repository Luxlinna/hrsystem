import { memo } from "react";
import type { BranchScheduleData } from "./types";

interface Props {
  branch: BranchScheduleData;
}

export const WorkingHoursSessionWindows = memo(function WorkingHoursSessionWindows({ branch }: Props) {
  const is24hIn =
    (!branch.morning_check_in_start || branch.morning_check_in_start.slice(0, 5) === "00:00") &&
    (!branch.morning_check_in_end || branch.morning_check_in_end.slice(0, 5) === "23:59");

  const is24hOut =
    (!branch.afternoon_check_out_start || branch.afternoon_check_out_start.slice(0, 5) === "00:00") &&
    (!branch.afternoon_check_out_end || branch.afternoon_check_out_end.slice(0, 5) === "23:59");

  const windows = [
    {
      session: "Check-In",
      target: branch.work_start_time?.slice(0, 5) || "08:00",
      window: is24hIn
        ? "Anytime (24/7 Continuous)"
        : `${branch.morning_check_in_start?.slice(0, 5) || "06:00"} – ${branch.morning_check_in_end?.slice(0, 5) || "10:00"}`,
      desc: is24hIn
        ? "All check-in punches recorded at any hour"
        : "Daily arrival check-in punch window",
      dotColor: "bg-emerald-500",
      isAllTime: is24hIn,
    },
    {
      session: "Check-Out",
      target: branch.work_end_time?.slice(0, 5) || "17:00",
      window: is24hOut
        ? "Anytime (24/7 Continuous)"
        : `${branch.afternoon_check_out_start?.slice(0, 5) || "16:00"} – ${branch.afternoon_check_out_end?.slice(0, 5) || "22:00"}`,
      desc: is24hOut
        ? "All check-out punches recorded at any hour"
        : "Daily departure check-out punch window",
      dotColor: "bg-indigo-500",
      isAllTime: is24hOut,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Attendance Punch Windows
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Valid time boundaries for automated check-in and check-out pairing
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <th className="py-2.5 px-6 font-medium">Punch Type</th>
              <th className="py-2.5 px-6 font-medium text-center sm:text-left">Allowed Window</th>
              <th className="py-2.5 px-6 font-medium text-right">Standard Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {windows.map((w) => (
              <tr
                key={w.session}
                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="py-3.5 px-6">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${w.dotColor} shrink-0`} />
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {w.session}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {w.desc}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-6 text-center sm:text-left">
                  <span
                    className={`inline-block font-mono text-xs font-medium px-2.5 py-1 rounded-md ${
                      w.isAllTime
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {w.window}
                  </span>
                </td>
                <td className="py-3.5 px-6 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                  {w.target}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
