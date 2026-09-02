import React from "react";

export interface WorkLog {
  id: string;
  log_date: string;
  start_time: string | null;
  end_time: string | null;
  activity: string;
  notes: string | null;
}

const fmtTime = (t: string | null) =>
  t ? new Date(`2000-01-01T${t}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--";

const hoursBetween = (start: string | null, end: string | null) => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  return mins > 0 ? mins / 60 : 0;
};

interface DailyReportEntryRowProps {
  log: WorkLog;
  onEdit: (log: WorkLog) => void;
}

export function DailyReportEntryRow({ log, onEdit }: DailyReportEntryRowProps) {
  const dur = hoursBetween(log.start_time, log.end_time);
  return (
    <div
      key={log.id}
      onClick={() => onEdit(log)}
      className="grid grid-cols-[110px_1fr] sm:grid-cols-[110px_1.2fr_1fr] gap-3 px-4 py-3 border-t border-gray-100 items-start hover:bg-gray-50/70 cursor-pointer group"
    >
      <div>
        <p className="text-[12px] font-semibold text-gray-800">
          {fmtTime(log.start_time)} – {fmtTime(log.end_time)}
        </p>
        {dur > 0 && <p className="text-[11px] text-gray-400">{Math.round(dur * 10) / 10}h</p>}
      </div>
      <div>
        <p className="text-[13px] text-gray-900 font-medium">{log.activity}</p>
        <p className="text-[12px] text-gray-500 sm:hidden mt-1">{log.notes || "—"}</p>
      </div>
      <p className="text-[12px] text-gray-500 hidden sm:block truncate">{log.notes || "—"}</p>
    </div>
  );
}
