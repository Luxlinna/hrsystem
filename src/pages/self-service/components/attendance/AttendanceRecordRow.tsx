import { memo } from "react";

interface RecordItem {
  id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  late_minutes: number;
  notes: string | null;
}

interface Props {
  record: RecordItem;
}

const STATUS_META: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  ontime: { label: "On Time", bg: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60", text: "text-emerald-700 dark:text-emerald-300", icon: "ri-checkbox-circle-line" },
  present: { label: "On Time", bg: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60", text: "text-emerald-700 dark:text-emerald-300", icon: "ri-checkbox-circle-line" },
  late: { label: "Late", bg: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60", text: "text-amber-700 dark:text-amber-300", icon: "ri-time-line" },
  absent: { label: "Absent", bg: "bg-red-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/60", text: "text-red-700 dark:text-rose-300", icon: "ri-close-circle-line" },
  half_day: { label: "Half Day", bg: "bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800/60", text: "text-sky-700 dark:text-sky-300", icon: "ri-sun-line" },
  wfh: { label: "WFH", bg: "bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800/60", text: "text-violet-700 dark:text-violet-300", icon: "ri-home-office-line" },
  remote: { label: "Remote", bg: "bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800/60", text: "text-sky-700 dark:text-sky-300", icon: "ri-home-office-line" },
};

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatTime(t: string | null) {
  if (!t) return "--:--";
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

function calcHours(clockIn: string | null, clockOut: string | null): string {
  if (!clockIn || !clockOut) return "--";
  const [ih, im] = clockIn.split(":").map(Number);
  const [oh, om] = clockOut.split(":").map(Number);
  const diff = (oh * 60 + om) - (ih * 60 + im);
  if (diff <= 0) return "--";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export const AttendanceRecordRow = memo(function AttendanceRecordRow({ record: r }: Props) {
  const isOutsideWork = r.notes?.toLowerCase().includes("outside work");
  const isOntime = (r.status === "ontime" || r.status === "present") && !isOutsideWork && (r.late_minutes || 0) === 0;
  const meta = isOutsideWork
    ? { label: "Outside Working", bg: "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700", text: "text-slate-800 dark:text-slate-200", icon: "ri-map-pin-user-line" }
    : STATUS_META[r.status] || { label: r.status, bg: "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700", text: "text-slate-700 dark:text-slate-300", icon: "ri-circle-line" };
  const d = new Date(r.date + "T00:00:00");
  const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
  const dayNum = d.getDate();
  const monthName = MONTHS_SHORT[d.getMonth()];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {/* Date Badge */}
        <div className="shrink-0 text-center w-11 py-1.5 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <p className="text-[9.5px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-tight leading-none">{dayName}</p>
          <p className="text-[17px] font-extrabold text-slate-900 dark:text-white leading-tight mt-0.5">{dayNum}</p>
          <p className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 leading-none">{monthName}</p>
        </div>

        {/* Times & Status */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* IN Time Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300/80 dark:border-emerald-700/80 shadow-2xs">
              <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">IN</span>
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-100">{formatTime(r.clock_in)}</span>
            </div>

            {/* OUT Time Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 shadow-2xs">
              <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">OUT</span>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{formatTime(r.clock_out)}</span>
            </div>

            {/* Duration Badge */}
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 text-sky-800 dark:text-sky-300">
              <i className="ri-timer-line text-sky-600 dark:text-sky-400 text-xs" />
              <span className="text-xs font-bold">{calcHours(r.clock_in, r.clock_out)}</span>
            </div>
          </div>

          {r.late_minutes > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-300 font-bold mt-1.5 flex items-center gap-1.5">
              <i className="ri-alarm-warning-line text-sm text-amber-500 dark:text-amber-400" />
              <span>{r.late_minutes}m late arrival</span>
            </p>
          )}
          {r.notes && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 italic">{r.notes}</p>
          )}
        </div>
      </div>

      {!isOntime && (
        <div className="self-end sm:self-auto shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border shadow-xs ${meta.bg} ${meta.text}`}>
            <i className={`${meta.icon} text-xs`} />
            <span className="capitalize">{meta.label}</span>
          </span>
        </div>
      )}
    </div>
  );
});
