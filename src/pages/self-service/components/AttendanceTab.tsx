import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toYMD } from "@/lib/date";
import { CreateTimeLogForm } from "@/pages/attendance/components/CreateTimeLogForm";
import type { Employee } from "../types";
import { AttendanceRecordRow } from "./attendance/AttendanceRecordRow";
import { AttendanceStatsSummary } from "./attendance/AttendanceStatsSummary";

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

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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
    const formattedEmp = employee ? [{ ...employee }] : [];
    return (
      <CreateTimeLogForm
        onBack={() => setShowTimeLogForm(false)}
        employees={formattedEmp as any}
        workLocations={workLocations}
        initialEmployeeId={employeeId}
        isEmployeeFixed={true}
        onSaved={fetchRecords}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Month filter & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div className="flex items-center gap-1.5">
          <i className="ri-calendar-check-line text-slate-500 text-sm" />
          <span className="text-sm font-bold text-slate-900 tracking-tight">Attendance Log</span>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full appearance-none pl-3 pr-7 py-1.5 border border-slate-200/90 rounded-lg text-xs bg-white text-slate-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-2xs"
            >
              {monthOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
          </div>
          <button
            type="button"
            onClick={() => setShowTimeLogForm(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-lg text-xs font-semibold shadow-2xs cursor-pointer active:scale-98 shrink-0"
          >
            <i className="ri-add-line text-xs" />
            <span>Time Log</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Grid */}
      <AttendanceStatsSummary
        ontimeCount={stats.ontime}
        lateCount={stats.late}
        absentCount={stats.absent}
        totalHoursFormatted={totalHoursFormatted}
      />

      {/* Records List */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl text-slate-400 border border-slate-200/80 p-6 text-center shadow-2xs">
          <i className="ri-fingerprint-line text-2xl mb-1.5 text-slate-300" />
          <p className="text-xs font-semibold text-slate-600">No attendance records found</p>
          <p className="text-[11px] text-slate-400 mt-0.5">No clock-in/out records for {filterMonth}.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-slate-50/80 px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Daily Attendance Records
            </span>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/60 px-1.5 py-0.2 rounded-full">
              {records.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {records.map((r) => (
              <AttendanceRecordRow key={r.id} record={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}