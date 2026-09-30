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
    ? { label: "Outside Working", bg: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700", text: "text-slate-700 dark:text-slate-200", icon: "ri-map-pin-user-line" }
    : STATUS_META[r.status] || { label: r.status, bg: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700", text: "text-slate-600 dark:text-slate-300", icon: "ri-circle-line" };
  const d = new Date(r.date + "T00:00:00");
  const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
  const dayNum = d.getDate();
  const monthName = MONTHS_SHORT[d.getMonth()];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:px-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="shrink-0 text-center w-9 sm:w-10 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/70 dark:border-slate-700">
          <p className="text-[8.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight leading-none">{dayName}</p>
          <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight mt-0.5">{dayNum}</p>
          <p className="text-[8.5px] font-medium text-slate-400 dark:text-slate-500 leading-none">{monthName}</p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 sm:gap-3.5 flex-wrap text-xs">
            <div className="flex items-center gap-1">
              <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase">In</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatTime(r.clock_in)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase">Out</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{formatTime(r.clock_out)}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
              <i className="ri-timer-line text-slate-400 dark:text-slate-500 text-xs" />
              <span>{calcHours(r.clock_in, r.clock_out)}</span>
            </div>
          </div>

          {r.late_minutes > 0 && (
            <p className="text-[10.5px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 flex items-center gap-1">
              <i className="ri-alarm-warning-line text-xs" />
              {r.late_minutes}m late arrival
            </p>
          )}
          {r.notes && (
            <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1 italic">{r.notes}</p>
          )}
        </div>
      </div>

      {!isOntime && (
        <div className="self-end sm:self-auto shrink-0">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.bg} ${meta.text}`}>
            <i className={`${meta.icon} text-[10px]`} />
            <span className="capitalize">{meta.label}</span>
          </span>
        </div>
      )}
    </div>
  );
});
