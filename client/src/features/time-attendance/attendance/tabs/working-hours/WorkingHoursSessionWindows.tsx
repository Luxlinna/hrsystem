import { memo } from "react";
import type { BranchScheduleData } from "./types";

interface Props {
  branch: BranchScheduleData;
}

export const WorkingHoursSessionWindows = memo(function WorkingHoursSessionWindows({ branch }: Props) {
  const is4Punch = branch.is_four_punch_enabled ?? true;

  const is24hIn =
    (!branch.morning_check_in_start || branch.morning_check_in_start.slice(0, 5) === "00:00") &&
    (!branch.morning_check_in_end || branch.morning_check_in_end.slice(0, 5) === "23:59");

  const is24hOut =
    (!branch.afternoon_check_out_start || branch.afternoon_check_out_start.slice(0, 5) === "00:00") &&
    (!branch.afternoon_check_out_end || branch.afternoon_check_out_end.slice(0, 5) === "23:59");

  const windows = is4Punch
    ? [
        {
          session: "Morning Check-In (Arrival)",
          target: branch.work_start_time?.slice(0, 5) || "08:00",
          window: is24hIn
            ? "Anytime (24/7 Continuous)"
            : `${branch.morning_check_in_start?.slice(0, 5) || "06:00"} – ${branch.morning_check_in_end?.slice(0, 5) || "10:00"}`,
          desc: is24hIn
            ? "All check-in punches recorded at any hour"
            : "Morning arrival check-in punch window (1st scan)",
          dotColor: "bg-emerald-500",
          isAllTime: is24hIn,
        },
        {
          session: "Lunch Out (Break Start)",
          target: branch.break_start_time?.slice(0, 5) || "12:00",
          window: is24hIn
            ? "Anytime (24/7 Continuous)"
            : `${branch.morning_check_out_start?.slice(0, 5) || "11:30"} – ${branch.morning_check_out_end?.slice(0, 5) || "13:30"}`,
          desc: "Midday departure scan to begin lunch break (2nd scan)",
          dotColor: "bg-amber-500",
          isAllTime: is24hIn,
        },
        {
          session: "Lunch In (Break Return)",
          target: branch.break_end_time?.slice(0, 5) || "13:00",
          window: is24hIn
            ? "Anytime (24/7 Continuous)"
            : `${branch.afternoon_check_in_start?.slice(0, 5) || "12:30"} – ${branch.afternoon_check_in_end?.slice(0, 5) || "14:30"}`,
          desc: "Afternoon scan returning from lunch break (3rd scan)",
          dotColor: "bg-sky-500",
          isAllTime: is24hIn,
        },
        {
          session: "Evening Check-Out (Departure)",
          target: branch.work_end_time?.slice(0, 5) || "17:00",
          window: is24hOut
            ? "Anytime (24/7 Continuous)"
            : `${branch.afternoon_check_out_start?.slice(0, 5) || "16:00"} – ${branch.afternoon_check_out_end?.slice(0, 5) || "22:00"}`,
          desc: is24hOut
            ? "All check-out punches recorded at any hour"
            : "Evening departure check-out punch window (4th scan)",
          dotColor: "bg-indigo-500",
          isAllTime: is24hOut,
        },
      ]
    : [
        {
          session: "Morning Check-In (Arrival)",
          target: branch.work_start_time?.slice(0, 5) || "08:00",
          window: is24hIn
            ? "Anytime (24/7 Continuous)"
            : `${branch.morning_check_in_start?.slice(0, 5) || "06:00"} – ${branch.morning_check_in_end?.slice(0, 5) || "10:00"}`,
          desc: is24hIn
            ? "Daily arrival scan recorded anytime"
            : "Morning arrival check-in punch window (1st scan of the day)",
          dotColor: "bg-emerald-500",
          isAllTime: is24hIn,
        },
        {
          session: "Lunch Break (Automatic Deduction)",
          target: `${branch.break_start_time?.slice(0, 5) || "12:00"} – ${branch.break_end_time?.slice(0, 5) || "13:00"}`,
          window: "Auto Deducted (No Scan Needed)",
          desc: "Midday break hour is automatically deducted from daily total without biometric punching",
          dotColor: "bg-amber-400",
          isAllTime: true,
        },
        {
          session: "Evening Check-Out (Departure)",
          target: branch.work_end_time?.slice(0, 5) || "17:00",
          window: is24hOut
            ? "Anytime (24/7 Continuous)"
            : `${branch.afternoon_check_out_start?.slice(0, 5) || "16:00"} – ${branch.afternoon_check_out_end?.slice(0, 5) || "22:00"}`,
          desc: is24hOut
            ? "Daily departure scan recorded anytime"
            : "Evening departure check-out punch window (2nd scan of the day)",
          dotColor: "bg-indigo-500",
          isAllTime: is24hOut,
        },
      ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Attendance Punch Windows
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Valid time boundaries for automated check-in and check-out pairing
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
            is4Punch
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-sky-300 border-blue-200 dark:border-blue-800"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${is4Punch ? "bg-emerald-500" : "bg-blue-500"}`} />
          {is4Punch ? "4-Punch Policy Active" : "2-Punch Policy Active"}
        </span>
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
