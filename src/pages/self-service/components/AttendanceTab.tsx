import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toYMD } from "@/lib/date";

interface AttendanceRecord {
  id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  late_minutes: number;
  notes: string | null;
}

interface Props {
  employeeId: string;
}

const STATUS_META: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  ontime: { label: "On Time", bg: "bg-emerald-50", text: "text-emerald-700", icon: "ri-checkbox-circle-line" },
  present: { label: "On Time", bg: "bg-emerald-50", text: "text-emerald-700", icon: "ri-checkbox-circle-line" },
  late: { label: "Late", bg: "bg-amber-50", text: "text-amber-700", icon: "ri-time-line" },
  absent: { label: "Absent", bg: "bg-red-50", text: "text-red-700", icon: "ri-close-circle-line" },
  half_day: { label: "Half Day", bg: "bg-sky-50", text: "text-sky-700", icon: "ri-sun-line" },
  wfh: { label: "WFH", bg: "bg-violet-50", text: "text-violet-700", icon: "ri-home-office-line" },
  remote: { label: "Remote", bg: "bg-sky-50", text: "text-sky-700", icon: "ri-home-office-line" },
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

export default function AttendanceTab({ employeeId }: Props) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    const [year, month] = filterMonth.split("-");
    const startDate = `${year}-${month}-01`;
    // Local (not UTC) end-of-month — toISOString() shifts to UTC, which rolls
    // the date back a day in timezones ahead of UTC (e.g. ICT) and silently
    // drops the last day of the month from the query.
    const endDate = toYMD(new Date(parseInt(year), parseInt(month), 0));

    supabase
      .from("attendance_records")
      .select("id, date, clock_in, clock_out, status, late_minutes, notes")
      .eq("employee_id", employeeId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false })
      .then(({ data }) => {
        setRecords(data || []);
        setLoading(false);
      });
  }, [employeeId, filterMonth]);

  const stats = {
    ontime: records.filter((r) => r.status === "ontime" || r.status === "present").length,
    late: records.filter((r) => r.status === "late").length,
    absent: records.filter((r) => r.status === "absent").length,
    totalHours: records.reduce((sum, r) => {
      if (!r.clock_in || !r.clock_out) return sum;
      const [ih, im] = r.clock_in.split(":").map(Number);
      const [oh, om] = r.clock_out.split(":").map(Number);
      const diff = (oh * 60 + om) - (ih * 60 + im);
      return sum + (diff > 0 ? diff : 0);
    }, 0),
  };

  const totalHoursFormatted = stats.totalHours > 0
    ? `${Math.floor(stats.totalHours / 60)}h ${stats.totalHours % 60}m`
    : "0h";

  // Generate last 12 months for filter
  const monthOptions: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthOptions.push({ value: val, label: `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}` });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-7 h-7 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Month filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <i className="ri-calendar-line text-[#253C7D]" />
          <span className="text-sm font-semibold text-gray-800">My Attendance History</span>
        </div>
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer"
        >
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "On Time", value: stats.ontime, icon: "ri-checkbox-circle-line", color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Late", value: stats.late, icon: "ri-time-line", color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Absent", value: stats.absent, icon: "ri-close-circle-line", color: "text-red-500", bg: "bg-red-50" },
          { label: "Total Hours", value: totalHoursFormatted, icon: "ri-timer-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
            <div className={`w-8 h-8 flex items-center justify-center shrink-0`}>
              <i className={`${s.icon} text-xl ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-600">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Records */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-xl text-gray-400">
          <i className="ri-fingerprint-line text-3xl mb-2" />
          <p className="text-sm">No attendance records for this period</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => {
            const meta = STATUS_META[r.status] || { label: r.status, bg: "bg-gray-100", text: "text-gray-600", icon: "ri-circle-line" };
            const d = new Date(r.date + "T00:00:00");
            const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
            const dayNum = d.getDate();
            const monthName = MONTHS_SHORT[d.getMonth()];

            return (
              <div key={r.id} className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl px-4 py-3.5">
                {/* Date badge */}
                <div className="shrink-0 text-center w-10">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">{dayName}</p>
                  <p className="text-[18px] font-bold text-gray-900 leading-tight">{dayNum}</p>
                  <p className="text-[10px] text-gray-400">{monthName}</p>
                </div>

                <div className="w-px h-10 bg-gray-100 shrink-0" />

                {/* Clock times */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <i className="ri-login-circle-line text-emerald-500 text-sm" />
                      <span className="text-sm font-semibold text-gray-800">{formatTime(r.clock_in)}</span>
                      <span className="text-[11px] text-gray-400">in</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <i className="ri-logout-circle-r-line text-gray-400 text-sm" />
                      <span className="text-sm font-medium text-gray-700">{formatTime(r.clock_out)}</span>
                      <span className="text-[11px] text-gray-400">out</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#253C7D]">
                      <i className="ri-timer-line text-xs" />
                      <span className="text-xs font-semibold">{calcHours(r.clock_in, r.clock_out)}</span>
                    </div>
                  </div>
                  {r.late_minutes > 0 && (
                    <p className="text-[11px] text-amber-500 mt-0.5 flex items-center gap-1">
                      <i className="ri-alarm-warning-line" />
                      {r.late_minutes}m late
                    </p>
                  )}
                  {r.notes && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{r.notes}</p>
                  )}
                </div>

                {/* Status */}
                <div className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.bg} ${meta.text}`}>
                  <i className={meta.icon} />
                  <span>{meta.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}