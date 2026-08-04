import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  role: string;
  avatar_url: string | null;
}

interface AttendanceRecord {
  id: number;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: "present" | "absent" | "late" | "half_day" | "remote" | "holiday";
  late_minutes: number;
  notes: string | null;
  employees?: Employee;
}

interface NewRecord {
  employee_id: string;
  date: string;
  clock_in: string;
  clock_out: string;
  status: string;
  late_minutes: number;
  notes: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  present:  { label: "Present",   color: "bg-emerald-100 text-emerald-700", icon: "ri-checkbox-circle-line" },
  absent:   { label: "Absent",    color: "bg-red-100 text-red-600",         icon: "ri-close-circle-line" },
  late:     { label: "Late",      color: "bg-amber-100 text-amber-700",     icon: "ri-time-line" },
  half_day: { label: "Half Day",  color: "bg-orange-100 text-orange-700",  icon: "ri-sun-line" },
  remote:   { label: "Remote",    color: "bg-sky-100 text-sky-700",         icon: "ri-home-office-line" },
  holiday:  { label: "Holiday",   color: "bg-purple-100 text-purple-700",  icon: "ri-calendar-event-line" },
};

export default function AttendancePage() {
  const { user } = useAuth();
  const { role, isAdmin, loading: permsLoading } = usePermissions();
  const canViewAll = isAdmin || !!role?.attendance_view_all_employees;
  const canViewOwnBranch = !canViewAll && !!role?.attendance_view_own_branch;
  const canManage = canViewAll || canViewOwnBranch;

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"records" | "summary">("records");

  const [newRecord, setNewRecord] = useState<NewRecord>({
    employee_id: "",
    date: new Date().toISOString().split("T")[0],
    clock_in: "09:00",
    clock_out: "17:30",
    status: "present",
    late_minutes: 0,
    notes: "",
  });

  useEffect(() => {
    if (permsLoading) return;
    fetchData();
  }, [permsLoading, canViewAll, canViewOwnBranch, user?.email]);

  async function fetchData() {
    setLoading(true);

    if (canViewAll) {
      const [recRes, empRes] = await Promise.all([
        supabase
          .from("attendance_records")
          .select("*, employees(id, first_name, last_name, department, role, avatar_url)")
          .order("date", { ascending: false })
          .limit(200),
        supabase.from("employees").select("id, first_name, last_name, department, role, avatar_url").eq("status", "active").order("first_name"),
      ]);
      if (recRes.data) setRecords(recRes.data as AttendanceRecord[]);
      if (empRes.data) setEmployees(empRes.data);
      setLoading(false);
      return;
    }

    if (!user?.email) { setLoading(false); return; }
    const { data: me } = await supabase
      .from("employees")
      .select("id, first_name, last_name, department, role, avatar_url, branch_id")
      .eq("email", user.email)
      .maybeSingle();
    setMyEmployee(me || null);

    if (!me) {
      setEmployees([]);
      setRecords([]);
      setLoading(false);
      return;
    }

    if (canViewOwnBranch && me.branch_id) {
      const { data: team } = await supabase
        .from("employees")
        .select("id, first_name, last_name, department, role, avatar_url")
        .eq("status", "active")
        .eq("branch_id", me.branch_id)
        .order("first_name");
      setEmployees(team || []);

      const ids = (team || []).map((e) => e.id);
      const { data: recData } = ids.length
        ? await supabase
            .from("attendance_records")
            .select("*, employees(id, first_name, last_name, department, role, avatar_url)")
            .in("employee_id", ids)
            .order("date", { ascending: false })
            .limit(200)
        : { data: [] };
      setRecords((recData as AttendanceRecord[]) || []);
      setLoading(false);
      return;
    }

    setEmployees([me]);
    const { data: recData } = await supabase
      .from("attendance_records")
      .select("*, employees(id, first_name, last_name, department, role, avatar_url)")
      .eq("employee_id", me.id)
      .order("date", { ascending: false })
      .limit(200);
    setRecords((recData as AttendanceRecord[]) || []);
    setLoading(false);
  }

  const filtered = records.filter((r) => {
    const empName = r.employees ? `${r.employees.first_name} ${r.employees.last_name}`.toLowerCase() : "";
    if (filterEmployee && !empName.includes(filterEmployee.toLowerCase())) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterDate && r.date !== filterDate) return false;
    return true;
  });

  // Summary stats
  const totalToday = records.filter((r) => r.date === new Date().toISOString().split("T")[0]).length;
  const presentToday = records.filter((r) => r.date === new Date().toISOString().split("T")[0] && (r.status === "present" || r.status === "remote")).length;
  const lateToday = records.filter((r) => r.date === new Date().toISOString().split("T")[0] && r.status === "late").length;
  const absentToday = records.filter((r) => r.date === new Date().toISOString().split("T")[0] && r.status === "absent").length;

  // Per-employee summary
  const employeeSummary = employees.map((emp) => {
    const empRecords = records.filter((r) => r.employee_id === emp.id);
    const present = empRecords.filter((r) => r.status === "present" || r.status === "remote").length;
    const absent = empRecords.filter((r) => r.status === "absent").length;
    const late = empRecords.filter((r) => r.status === "late").length;
    const totalLateMinutes = empRecords.reduce((a, r) => a + (r.late_minutes || 0), 0);
    const lastSeen = empRecords[0]?.date || "—";
    return { ...emp, present, absent, late, totalLateMinutes, lastSeen, total: empRecords.length };
  }).filter((e) => e.total > 0);

  async function handleSave() {
    if (!newRecord.employee_id || !newRecord.date) return;
    setSaving(true);
    await supabase.from("attendance_records").insert({
      employee_id: newRecord.employee_id,
      date: newRecord.date,
      clock_in: newRecord.clock_in || null,
      clock_out: newRecord.clock_out || null,
      status: newRecord.status,
      late_minutes: newRecord.status === "late" ? newRecord.late_minutes : 0,
      notes: newRecord.notes || null,
    });
    setSaving(false);
    setShowModal(false);
    setNewRecord({ employee_id: "", date: new Date().toISOString().split("T")[0], clock_in: "09:00", clock_out: "17:30", status: "present", late_minutes: 0, notes: "" });
    fetchData();
  }

  function formatTime(t: string | null) {
    if (!t) return "—";
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  }

  function calcHours(clockIn: string | null, clockOut: string | null): string {
    if (!clockIn || !clockOut) return "—";
    const [ih, im] = clockIn.split(":").map(Number);
    const [oh, om] = clockOut.split(":").map(Number);
    const mins = (oh * 60 + om) - (ih * 60 + im);
    if (mins <= 0) return "—";
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6] p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Time &amp; Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {canManage ? "Track daily clock-in/out records, late arrivals, and absences" : "Track your own clock-in/out records, late arrivals, and absences"}
          </p>
        </div>
        <button
          onClick={() => {
            if (!canViewAll) setNewRecord((p) => ({ ...p, employee_id: myEmployee?.id || "" }));
            setShowModal(true);
          }}
          disabled={!canViewAll && !myEmployee}
          className="flex items-center gap-2 px-4 py-2 bg-[#253C7D] text-white text-sm font-medium rounded-lg hover:bg-[#1F336A] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <i className="ri-add-line" />
          Log Attendance
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Checked In Today", value: presentToday, icon: "ri-user-follow-line", color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Late Arrivals", value: lateToday, icon: "ri-alarm-warning-line", color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Absent Today", value: absentToday, icon: "ri-user-unfollow-line", color: "text-red-500", bg: "bg-red-50" },
          { label: "Total Records", value: totalToday, icon: "ri-calendar-check-line", color: "text-sky-600", bg: "bg-sky-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-lg flex items-center justify-center`}>
                <i className={`${s.icon} text-lg`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      {canManage && (
        <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit max-w-full overflow-x-auto">
          {(["records", "summary"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${activeTab === t ? "bg-white text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t === "records" ? "Attendance Records" : "Employee Summary"}
            </button>
          ))}
        </div>
      )}

      {activeTab === "records" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            {canManage && (
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search employee..."
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            )}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D] cursor-pointer"
            />
            {(filterEmployee || filterStatus || filterDate) && (
              <button
                onClick={() => { setFilterEmployee(""); setFilterStatus(""); setFilterDate(""); }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg cursor-pointer whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400 text-sm">Loading records...</div>
            ) : (
              <>
                {/* Desktop Table */}
                <table className="w-full hidden md:table">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Employee</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Date</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Clock In</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Clock Out</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Hours</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const cfg = STATUS_CONFIG[r.status];
                      const emp = r.employees;
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedRecord(r)}
                          className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              {emp?.avatar_url ? (
                                <img src={emp.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xs font-semibold">
                                  {emp ? emp.first_name[0] + emp.last_name[0] : "?"}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-800">{emp ? `${emp.first_name} ${emp.last_name}` : "—"}</p>
                                <p className="text-xs text-gray-400">{emp?.department}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-700">
                            {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-700">{formatTime(r.clock_in)}</td>
                          <td className="px-5 py-3 text-sm text-gray-700">{formatTime(r.clock_out)}</td>
                          <td className="px-5 py-3 text-sm text-gray-600">{calcHours(r.clock_in, r.clock_out)}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                              <i className={cfg.icon} />
                              {cfg.label}
                              {r.status === "late" && r.late_minutes > 0 && ` (+${r.late_minutes}m)`}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-400 max-w-[180px] truncate">{r.notes || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-gray-50">
                  {filtered.map((r) => {
                    const cfg = STATUS_CONFIG[r.status];
                    const emp = r.employees;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRecord(r)}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {emp?.avatar_url ? (
                              <img src={emp.avatar_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xs font-semibold shrink-0">
                                {emp ? emp.first_name[0] + emp.last_name[0] : "?"}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{emp?.department}</p>
                            </div>
                          </div>
                          <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                            <i className={cfg.icon} />
                            {cfg.label}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div className="bg-gray-50 rounded-lg px-3 py-2">
                            <p className="text-[10px] text-gray-400 mb-0.5">Date</p>
                            <p className="text-xs font-semibold text-gray-800">
                              {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg px-3 py-2">
                            <p className="text-[10px] text-gray-400 mb-0.5">In / Out</p>
                            <p className="text-xs font-semibold text-gray-800">
                              {formatTime(r.clock_in)} – {formatTime(r.clock_out)}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg px-3 py-2">
                            <p className="text-[10px] text-gray-400 mb-0.5">Hours</p>
                            <p className="text-xs font-semibold text-gray-800">{calcHours(r.clock_in, r.clock_out)}</p>
                          </div>
                        </div>
                        {r.status === "late" && r.late_minutes > 0 && (
                          <p className="text-xs text-amber-600 mt-2">+{r.late_minutes}m late</p>
                        )}
                        {r.notes && (
                          <p className="text-xs text-gray-400 mt-2 truncate">{r.notes}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {!loading && filtered.length === 0 && (
              <div className="p-12 text-center text-gray-400 text-sm">No attendance records match your filters.</div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">{filtered.length} records shown</p>
        </>
      )}

      {activeTab === "summary" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Desktop table */}
          <table className="w-full hidden md:table">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Employee</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Days Logged</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Present</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Late</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Absent</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Total Late Time</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Last Active</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              {employeeSummary.map((emp) => {
                const rate = emp.total > 0 ? Math.round(((emp.present + emp.late) / emp.total) * 100) : 0;
                return (
                  <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {emp.avatar_url ? (
                          <img src={emp.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xs font-semibold">
                            {emp.first_name[0]}{emp.last_name[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-800">{emp.first_name} {emp.last_name}</p>
                          <p className="text-xs text-gray-400">{emp.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">{emp.total}</td>
                    <td className="px-5 py-3"><span className="text-sm font-medium text-emerald-600">{emp.present}</span></td>
                    <td className="px-5 py-3">
                      <span className={`text-sm font-medium ${emp.late > 0 ? "text-amber-600" : "text-gray-400"}`}>{emp.late}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-sm font-medium ${emp.absent > 0 ? "text-red-500" : "text-gray-400"}`}>{emp.absent}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {emp.totalLateMinutes > 0 ? `${Math.floor(emp.totalLateMinutes / 60)}h ${emp.totalLateMinutes % 60}m` : "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(emp.lastSeen + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-24">
                          <div className={`h-1.5 rounded-full ${rate >= 90 ? "bg-emerald-500" : rate >= 75 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-600">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-50">
            {employeeSummary.map((emp) => {
              const rate = emp.total > 0 ? Math.round(((emp.present + emp.late) / emp.total) * 100) : 0;
              return (
                <div key={emp.id} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {emp.avatar_url ? (
                      <img src={emp.avatar_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xs font-semibold shrink-0">
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{emp.first_name} {emp.last_name}</p>
                      <p className="text-xs text-gray-400 truncate">{emp.department}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-gray-900">{rate}%</p>
                      <p className="text-[10px] text-gray-400">attendance</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-gray-100 rounded-full mb-3">
                    <div
                      className={`h-1.5 rounded-full transition-all ${rate >= 90 ? "bg-emerald-500" : rate >= 75 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  {/* Stats chips */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-gray-50 rounded-lg px-2 py-2 text-center">
                      <p className="text-[10px] text-gray-400 mb-0.5">Logged</p>
                      <p className="text-sm font-bold text-gray-800">{emp.total}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg px-2 py-2 text-center">
                      <p className="text-[10px] text-emerald-500 mb-0.5">Present</p>
                      <p className="text-sm font-bold text-emerald-700">{emp.present}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg px-2 py-2 text-center">
                      <p className="text-[10px] text-amber-500 mb-0.5">Late</p>
                      <p className="text-sm font-bold text-amber-700">{emp.late}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg px-2 py-2 text-center">
                      <p className="text-[10px] text-red-400 mb-0.5">Absent</p>
                      <p className="text-sm font-bold text-red-600">{emp.absent}</p>
                    </div>
                  </div>
                  {emp.totalLateMinutes > 0 && (
                    <p className="text-xs text-amber-600 mt-2">
                      Total late: {Math.floor(emp.totalLateMinutes / 60)}h {emp.totalLateMinutes % 60}m
                    </p>
                  )}
                </div>
              );
            })}
            {employeeSummary.length === 0 && (
              <div className="p-10 text-center text-gray-400 text-sm">No data available.</div>
            )}
          </div>
        </div>
      )}

      {/* Detail Side Panel */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSelectedRecord(null)} />
          <div className="relative w-full sm:w-[420px] bg-white h-full overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Attendance Detail</h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  {new Date(selectedRecord.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer">
                <i className="ri-close-line text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {selectedRecord.employees && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  {selectedRecord.employees.avatar_url ? (
                    <img src={selectedRecord.employees.avatar_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
                      {selectedRecord.employees.first_name[0]}{selectedRecord.employees.last_name[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{selectedRecord.employees.first_name} {selectedRecord.employees.last_name}</p>
                    <p className="text-sm text-gray-500">{selectedRecord.employees.role}</p>
                    <p className="text-xs text-gray-400">{selectedRecord.employees.department}</p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_CONFIG[selectedRecord.status].color}`}>
                  <i className={STATUS_CONFIG[selectedRecord.status].icon} />
                  {STATUS_CONFIG[selectedRecord.status].label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Clock In</p>
                  <p className="text-lg font-semibold text-gray-800">{formatTime(selectedRecord.clock_in)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Clock Out</p>
                  <p className="text-lg font-semibold text-gray-800">{formatTime(selectedRecord.clock_out)}</p>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Total Hours Worked</p>
                <p className="text-lg font-semibold text-gray-800">{calcHours(selectedRecord.clock_in, selectedRecord.clock_out)}</p>
              </div>
              {selectedRecord.status === "late" && selectedRecord.late_minutes > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-600 font-medium">Late Arrival</p>
                  <p className="text-sm text-amber-700 mt-0.5">{selectedRecord.late_minutes} minutes past expected start time</p>
                </div>
              )}
              {selectedRecord.notes && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Notes</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Log Attendance Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Log Attendance</h3>
              <p className="text-sm text-gray-400 mt-0.5">Manually record an attendance entry</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Employee *</label>
                {canManage ? (
                  <select
                    value={newRecord.employee_id}
                    onChange={(e) => setNewRecord({ ...newRecord, employee_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    <option value="">Select employee...</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.first_name} {e.last_name} — {e.department}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                    {myEmployee ? `${myEmployee.first_name} ${myEmployee.last_name} — ${myEmployee.department}` : "—"}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Date *</label>
                  <input
                    type="date"
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
                  <select
                    value={newRecord.status}
                    onChange={(e) => setNewRecord({ ...newRecord, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              {newRecord.status !== "absent" && newRecord.status !== "holiday" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Clock In</label>
                    <input
                      type="time"
                      value={newRecord.clock_in}
                      onChange={(e) => setNewRecord({ ...newRecord, clock_in: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Clock Out</label>
                    <input
                      type="time"
                      value={newRecord.clock_out}
                      onChange={(e) => setNewRecord({ ...newRecord, clock_out: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D]"
                    />
                  </div>
                </div>
              )}
              {newRecord.status === "late" && (
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Minutes Late</label>
                  <input
                    type="number"
                    min={1}
                    value={newRecord.late_minutes}
                    onChange={(e) => setNewRecord({ ...newRecord, late_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Notes</label>
                <textarea
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                  rows={3}
                  maxLength={500}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D] resize-none"
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !newRecord.employee_id || !newRecord.date}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#253C7D] rounded-lg hover:bg-[#1F336A] disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {saving ? "Saving..." : "Save Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}