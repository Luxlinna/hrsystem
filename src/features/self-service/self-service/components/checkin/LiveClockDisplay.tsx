import { memo } from "react";

interface Props {
  currentTime: Date;
  timezone: string;
}

export const LiveClockDisplay = memo(function LiveClockDisplay({
  currentTime,
  timezone,
}: Props) {
  const safeTime = (() => {
    try {
      return currentTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: timezone || "Asia/Phnom_Penh",
      });
    } catch {
      return currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
  })();

  const safeDate = (() => {
    try {
      return currentTime.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: timezone || "Asia/Phnom_Penh",
      });
    } catch {
      return currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    }
  })();

  return (
    <div className="flex items-center justify-between lg:block lg:pr-6 lg:border-r lg:border-slate-200 dark:lg:border-slate-800 shrink-0">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Digital Clock</span>
        </div>
        <p className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums text-slate-900 dark:text-slate-100">
          {safeTime}
        </p>
      </div>
      <div className="text-right lg:text-left mt-1">
        <p className="text-slate-600 dark:text-slate-300 text-xs font-semibold">
          {safeDate}
        </p>
        <span className="text-slate-400 dark:text-slate-500 text-[10.5px] font-mono block mt-0.5">
          {timezone?.replace("_", " ") || "Phnom Penh (UTC+7)"}
        </span>
      </div>
    </div>
  );
});

