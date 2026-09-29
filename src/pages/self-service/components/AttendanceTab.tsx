import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toYMD } from "@/lib/date";
import { CreateTimeLogForm } from "@/pages/attendance/components/CreateTimeLogForm";
import type { Employee } from "../types";

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
  employee?: Employee;
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

export default function AttendanceTab({ employeeId, employee }: Props) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTimeLogForm, setShowTimeLogForm] = useState(false);
  const [workLocations, setWorkLocations] = useState<any[]>([]);
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const fetchRecords = useCallback(() => {
    if (!employeeId) return;
    setLoading(true);
    const [year, month] = filterMonth.split("-");
    const startDate = `${year}-${month}-01`;
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

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    supabase
      .from("work_locations")
      .select("id, branch_id, name, description, is_default, work_start_time, work_end_time, break_start_time, break_end_time, is_four_punch_enabled")
      .is("deleted_at", null)
      .order("is_default", { ascending: false })
      .order("name")
      .then(({ data }) => {
        if (data) setWorkLocations(data);
      });
  }, []);

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

  if (showTimeLogForm) {
    const formattedEmp = employee
      ? [
          {
            id: employee.id,
            first_name: employee.first_name,
            last_name: employee.last_name,
            department: employee.department,
            role: employee.role,
            avatar_url: employee.avatar_url,
            branch_id: employee.branch_id,
          },
        ]
      : [];

    return (
      <CreateTimeLogForm
        onBack={() => setShowTimeLogForm(false)}
        employees={formattedEmp as any}
        workLocations={workLocations}
        initialEmployeeId={employeeId}
        isEmployeeFixed={true}
        onSaved={() => {
          fetchRecords();
        }}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Month filter & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <i className="ri-calendar-line text-blue-600 text-base" />
          <span className="text-sm font-bold text-slate-900">Attendance Log</span>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs font-medium"
          >
            {monthOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowTimeLogForm(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-98 shrink-0"
          >
            <i className="ri-add-line text-sm" />
            <span>Time Log</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {[
          { label: "On Time", value: stats.ontime, icon: "ri-checkbox-circle-line", color: "text-emerald-700", bg: "bg-emerald-50/70 border-emerald-200/70" },
          { label: "Late", value: stats.late, icon: "ri-time-line", color: "text-amber-700", bg: "bg-amber-50/70 border-amber-200/70" },
          { label: "Absent", value: stats.absent, icon: "ri-close-circle-line", color: "text-rose-700", bg: "bg-rose-50/70 border-rose-200/70" },
          { label: "Total Hours", value: totalHoursFormatted, icon: "ri-timer-line", color: "text-blue-700", bg: "bg-blue-50/70 border-blue-200/70" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border rounded-xl p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 shadow-2xs`}>
            <div className={`w-8 h-8 flex items-center justify-center rounded-lg bg-white/80 shadow-2xs shrink-0 ${s.color}`}>
              <i className={`${s.icon} text-base`} />
            </div>
            <div className="min-w-0">
              <p className={`text-base sm:text-lg font-bold leading-tight ${s.color} truncate`}>{s.value}</p>
              <p className="text-[10.5px] font-medium text-slate-600 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Records List */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-slate-50/60 rounded-xl text-slate-400 border border-dashed border-slate-200">
          <i className="ri-fingerprint-line text-3xl mb-2 text-slate-300" />
          <p className="text-xs font-medium text-slate-500">No attendance records found for this period</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => {
            const isOutsideWork = r.notes?.toLowerCase().includes("outside work");
            const meta = isOutsideWork
              ? { label: "Outside Working", bg: "bg-teal-50/80 border-teal-200", text: "text-teal-700", icon: "ri-map-pin-user-line" }
              : STATUS_META[r.status] || { label: r.status, bg: "bg-slate-50 border-slate-200", text: "text-slate-600", icon: "ri-circle-line" };
            const d = new Date(r.date + "T00:00:00");
            const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
            const dayNum = d.getDate();
            const monthName = MONTHS_SHORT[d.getMonth()];

            return (
              <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 bg-white border border-slate-200/80 rounded-xl p-3 sm:px-4 sm:py-3.5 hover:border-slate-300 transition-colors shadow-2xs">
                {/* Date & Punch details */}
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                  {/* Date badge */}
                  <div className="shrink-0 text-center w-10 sm:w-11 py-1 bg-slate-50 rounded-lg border border-slate-200/70">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{dayName}</p>
                    <p className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{dayNum}</p>
                    <p className="text-[9px] font-medium text-slate-400">{monthName}</p>
                  </div>

                  {/* Punch times */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">In</span>
                        <span className="font-semibold text-slate-900">{formatTime(r.clock_in)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Out</span>
                        <span className="font-medium text-slate-700">{formatTime(r.clock_out)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 font-medium">
                        <i className="ri-timer-line text-slate-400 text-xs" />
                        <span>{calcHours(r.clock_in, r.clock_out)}</span>
                      </div>
                    </div>

                    {r.late_minutes > 0 && (
                      <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
                        <i className="ri-alarm-warning-line text-xs" />
                        {r.late_minutes}m late arrival
                      </p>
                    )}
                    {r.notes && (
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{r.notes}</p>
                    )}
                  </div>
                </div>

                {/* Status pill */}
                <div className="self-end sm:self-auto shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${meta.bg} ${meta.text}`}>
                    <i className={`${meta.icon} text-[11px]`} />
                    <span className="capitalize">{meta.label}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}