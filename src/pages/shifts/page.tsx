import { useState, useEffect, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

interface Shift {
  id: string;
  name: string;
  branch_id: string;
  department: string;
  start_time: string;
  end_time: string;
  shift_date: string;
  capacity: number;
  color: string;
  notes: string;
  branches?: { name: string; location: string };
  assignmentCount?: number;
}

interface Branch {
  id: string;
  name: string;
  location: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  role: string;
}

interface ShiftAssignment {
  id: string;
  shift_id: string;
  employee_id: string;
  status: string;
  employee?: { first_name: string; last_name: string; role: string; department: string };
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const deptColors: Record<string, string> = {
  Operations: "#253C7D",
  Sales: "#29ABE2",
  IT: "#74C8EC",
  Finance: "#8B5CF6",
  Marketing: "#EC4899",
  "Customer Service": "#E07B39",
  HR: "#EF4444",
  Engineering: "#3B82F6",
  Legal: "#6B7280",
};

function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return dd;
  });
}

// Local (not UTC) YYYY-MM-DD — toISOString() shifts to UTC, which can
// misalign shift cards under the wrong weekday for timezones ahead of UTC.
function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Shifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    name: "", branch_id: "", department: "", start_time: "09:00",
    end_time: "17:00", shift_date: "", capacity: 5, color: "#253C7D", notes: "",
  });
  const [assignEmployeeId, setAssignEmployeeId] = useState("");

  const weekDates = getWeekDates(currentWeek);

  const loadData = async () => {
    const [{ data: s }, { data: a }, { data: b }, { data: e }] = await Promise.all([
      supabase.from("shifts").select("*, branches(name, location)").order("shift_date").order("start_time"),
      supabase.from("shift_assignments").select("*, employee:employees(first_name, last_name, role, department)"),
      supabase.from("branches").select("id, name, location").order("name"),
      supabase.from("employees").select("id, first_name, last_name, department, role").order("first_name"),
    ]);
    const shiftList = (s || []).map((sh) => ({
      ...sh,
      assignmentCount: (a || []).filter((x) => x.shift_id === sh.id).length,
    }));
    setShifts(shiftList);
    setAssignments(a || []);
    setBranches(b || []);
    setEmployees(e || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from("shifts").insert(shiftForm);
    setSubmitting(false);
    if (error) { toast("Error", "Failed to create shift", "error"); return; }
    setShiftForm({ name: "", branch_id: "", department: "", start_time: "09:00", end_time: "17:00", shift_date: "", capacity: 5, color: "#253C7D", notes: "" });
    setShowCreateModal(false);
    loadData();
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShift || !assignEmployeeId) return;
    setSubmitting(true);
    // Re-check capacity against the DB (not just client state) right before
    // inserting — client `assignments` can be stale across concurrent
    // sessions/tabs, which would otherwise let a shift go over capacity.
    const { count } = await supabase
      .from("shift_assignments")
      .select("id", { count: "exact", head: true })
      .eq("shift_id", selectedShift.id);
    if ((count ?? 0) >= selectedShift.capacity) {
      setSubmitting(false);
      toast("Error", "This shift is already at capacity", "error");
      loadData();
      return;
    }
    const { error } = await supabase.from("shift_assignments").insert({ shift_id: selectedShift.id, employee_id: assignEmployeeId, status: "scheduled" });
    setSubmitting(false);
    if (error) { toast("Error", "Failed to assign employee", "error"); return; }
    setAssignEmployeeId("");
    setShowAssignModal(false);
    loadData();
  };

  const removeAssignment = async (assignId: string) => {
    const { error } = await supabase.from("shift_assignments").delete().eq("id", assignId);
    if (error) { toast("Error", "Failed to remove assignment", "error"); return; }
    loadData();
  };

  const getShiftsForDay = (date: Date): Shift[] => {
    const dateStr = formatDate(date);
    return shifts.filter((s) => {
      const matchDate = s.shift_date === dateStr;
      const matchBranch = filterBranch === "all" || s.branch_id === filterBranch;
      const matchDept = filterDept === "all" || s.department === filterDept;
      return matchDate && matchBranch && matchDept;
    });
  };

  const selectedShiftAssignments = assignments.filter((a) => a.shift_id === selectedShift?.id);
  const departments = [...new Set(shifts.map((s) => s.department).filter(Boolean))];

  const totalShiftsThisWeek = weekDates.reduce((sum, d) => sum + getShiftsForDay(d).length, 0);
  const totalAssigned = assignments.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      <div className={`flex-1 min-w-0 transition-all ${selectedShift ? "sm:mr-[380px]" : ""}`}>
        <div className="p-6 lg:p-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Shift Scheduling
              </h1>
              <p className="text-[13px] text-gray-500 mt-1">
                {totalShiftsThisWeek} shifts this week &middot; {totalAssigned} assignments total
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-[#253C7D] text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-add-line" /> Create Shift
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Total Shifts", value: shifts.length, icon: "ri-time-line", color: "text-[#253C7D]" },
              { label: "This Week", value: totalShiftsThisWeek, icon: "ri-calendar-2-line", color: "text-violet-600" },
              { label: "Assigned Staff", value: totalAssigned, icon: "ri-user-follow-line", color: "text-emerald-600" },
              { label: "Branches", value: branches.length, icon: "ri-building-2-line", color: "text-amber-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
                <i className={`${s.icon} ${s.color} text-xl`} />
                <p className="text-xl font-bold text-gray-900 mt-2">{s.value}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Week Navigation + Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => { const d = new Date(currentWeek); d.setDate(d.getDate() - 7); setCurrentWeek(d); }} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer">
                <i className="ri-arrow-left-s-line text-gray-600" />
              </button>
              <span className="text-[13px] font-semibold text-gray-700">
                {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <button onClick={() => { const d = new Date(currentWeek); d.setDate(d.getDate() + 7); setCurrentWeek(d); }} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer">
                <i className="ri-arrow-right-s-line text-gray-600" />
              </button>
              <button onClick={() => setCurrentWeek(new Date())} className="text-[12px] text-[#253C7D] font-medium hover:underline cursor-pointer">Today</button>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="flex-1 sm:flex-none min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer">
                <option value="all">All Branches</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="flex-1 sm:flex-none min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer">
                <option value="all">All Departments</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Weekly Calendar Grid */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-gray-100">
                {weekDates.map((date, i) => {
                  const isToday = formatDate(date) === formatDate(new Date());
                  const dayShifts = getShiftsForDay(date);
                  return (
                    <div key={i} className={`p-3 border-r border-gray-100 last:border-r-0 text-center ${isToday ? "bg-[#253C7D]/5" : ""}`}>
                      <p className={`text-[11px] font-semibold uppercase tracking-wider ${isToday ? "text-[#253C7D]" : "text-gray-500"}`}>{DAYS[i]}</p>
                      <p className={`text-[18px] font-bold mt-0.5 ${isToday ? "text-[#253C7D]" : "text-gray-800"}`}>{date.getDate()}</p>
                      {dayShifts.length > 0 && (
                        <span className="text-[10px] bg-[#253C7D]/10 text-[#253C7D] px-1.5 py-0.5 rounded-full font-medium">{dayShifts.length}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Shift Cells */}
              <div className="grid grid-cols-7 min-h-[320px]">
                {weekDates.map((date, i) => {
                  const dayShifts = getShiftsForDay(date);
                  const isToday = formatDate(date) === formatDate(new Date());
                  return (
                    <div key={i} className={`border-r border-gray-100 last:border-r-0 p-2 space-y-1.5 ${isToday ? "bg-[#253C7D]/3" : ""}`}>
                      {dayShifts.map((sh) => {
                        const aCount = assignments.filter((a) => a.shift_id === sh.id).length;
                        const isFull = aCount >= sh.capacity;
                        return (
                          <div
                            key={sh.id}
                            onClick={() => setSelectedShift(selectedShift?.id === sh.id ? null : sh)}
                            className={`rounded-lg p-2 cursor-pointer transition-all border ${selectedShift?.id === sh.id ? "ring-2 ring-offset-1" : ""}`}
                            style={{
                              backgroundColor: sh.color + "18",
                              borderColor: sh.color + "40",
                              "--tw-ring-color": sh.color,
                            } as CSSProperties}
                          >
                            <p className="text-[11px] font-bold truncate" style={{ color: sh.color }}>{sh.name}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{sh.start_time} – {sh.end_time}</p>
                            <div className="flex items-center justify-between mt-1.5">
                              <p className="text-[9px] text-gray-500 truncate">{sh.department}</p>
                              <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${isFull ? "bg-red-50 text-red-600" : "bg-white/80 text-gray-600"}`}>
                                {aCount}/{sh.capacity}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {dayShifts.length === 0 && (
                        <div className="h-full flex items-center justify-center py-8">
                          <span className="text-[11px] text-gray-200">—</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Department Legend */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(deptColors).slice(0, 6).map(([dept, color]) => (
              <div key={dept} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[11px] text-gray-500">{dept}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shift Detail Panel */}
      {selectedShift && (
        <div className="fixed right-0 top-0 h-full w-full sm:w-[380px] bg-white border-l border-gray-100 overflow-y-auto z-40 flex flex-col">
          <div className="p-5 border-b border-gray-100" style={{ backgroundColor: selectedShift.color + "15" }}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">{selectedShift.name}</h3>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  {new Date(selectedShift.shift_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
              </div>
              <button onClick={() => setSelectedShift(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer">
                <i className="ri-close-line text-gray-500 text-sm" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-white rounded-lg p-2.5">
                <p className="text-[10px] text-gray-400">Time</p>
                <p className="text-[13px] font-bold text-gray-800 mt-0.5">{selectedShift.start_time} – {selectedShift.end_time}</p>
              </div>
              <div className="bg-white rounded-lg p-2.5">
                <p className="text-[10px] text-gray-400">Capacity</p>
                <p className="text-[13px] font-bold mt-0.5" style={{ color: selectedShiftAssignments.length >= selectedShift.capacity ? "#EF4444" : selectedShift.color }}>
                  {selectedShiftAssignments.length} / {selectedShift.capacity}
                </p>
              </div>
              <div className="bg-white rounded-lg p-2.5">
                <p className="text-[10px] text-gray-400">Department</p>
                <p className="text-[12px] font-semibold text-gray-800 mt-0.5">{selectedShift.department || "—"}</p>
              </div>
              <div className="bg-white rounded-lg p-2.5">
                <p className="text-[10px] text-gray-400">Branch</p>
                <p className="text-[12px] font-semibold text-gray-800 mt-0.5 truncate">{selectedShift.branches?.name || "—"}</p>
              </div>
            </div>
            {selectedShift.notes && (
              <div className="mt-3 bg-white rounded-lg p-2.5">
                <p className="text-[10px] text-gray-400 mb-1">Notes</p>
                <p className="text-[12px] text-gray-600">{selectedShift.notes}</p>
              </div>
            )}
          </div>

          <div className="p-5 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                Assigned Employees ({selectedShiftAssignments.length})
              </h4>
              <button
                onClick={() => setShowAssignModal(true)}
                disabled={selectedShiftAssignments.length >= selectedShift.capacity}
                className="text-[12px] text-[#253C7D] font-semibold hover:underline disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                + Assign
              </button>
            </div>

            {selectedShiftAssignments.length === 0 ? (
              <div className="text-center py-10">
                <i className="ri-user-add-line text-3xl text-gray-200" />
                <p className="text-[13px] text-gray-400 mt-2">No employees assigned yet</p>
                <button onClick={() => setShowAssignModal(true)} className="mt-3 text-[12px] text-[#253C7D] font-medium hover:underline cursor-pointer">
                  Assign first employee
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedShiftAssignments.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] text-xs font-bold shrink-0">
                      {a.employee?.first_name?.[0]}{a.employee?.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{a.employee?.first_name} {a.employee?.last_name}</p>
                      <p className="text-[11px] text-gray-500">{a.employee?.role}</p>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium capitalize">{a.status}</span>
                    <button onClick={() => removeAssignment(a.id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                      <i className="ri-close-line text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Shift Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-[15px] font-bold text-gray-900">Create New Shift</h2>
              <button onClick={() => setShowCreateModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer">
                <i className="ri-close-line text-gray-500 text-sm" />
              </button>
            </div>
            <form onSubmit={handleCreateShift} className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Shift Name *</label>
                <input required type="text" value={shiftForm.name} onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })} placeholder="e.g., Morning Shift A" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Branch</label>
                  <select value={shiftForm.branch_id} onChange={(e) => setShiftForm({ ...shiftForm, branch_id: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] cursor-pointer">
                    <option value="">No branch</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Department</label>
                  <input type="text" value={shiftForm.department} onChange={(e) => setShiftForm({ ...shiftForm, department: e.target.value })} placeholder="e.g., Operations" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Date *</label>
                <input required type="date" value={shiftForm.shift_date} onChange={(e) => setShiftForm({ ...shiftForm, shift_date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Start Time *</label>
                  <input required type="time" value={shiftForm.start_time} onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">End Time *</label>
                  <input required type="time" value={shiftForm.end_time} onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Capacity</label>
                  <input type="number" min={1} max={100} value={shiftForm.capacity} onChange={(e) => setShiftForm({ ...shiftForm, capacity: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Color</label>
                  <input type="color" value={shiftForm.color} onChange={(e) => setShiftForm({ ...shiftForm, color: e.target.value })} className="w-full h-[42px] px-2 py-1 border border-gray-200 rounded-lg cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Notes</label>
                <textarea value={shiftForm.notes} onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })} rows={2} placeholder="Optional shift notes..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-[#253C7D] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1F336A] disabled:opacity-60 cursor-pointer">
                  {submitting ? "Creating..." : "Create Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Employee Modal */}
      {showAssignModal && selectedShift && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-[15px] font-bold text-gray-900">Assign Employee</h2>
              <button onClick={() => setShowAssignModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer">
                <i className="ri-close-line text-gray-500 text-sm" />
              </button>
            </div>
            <form onSubmit={handleAssign} className="p-5 space-y-4">
              <p className="text-[12px] text-gray-500">Assigning to: <span className="font-semibold text-gray-800">{selectedShift.name}</span></p>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Select Employee *</label>
                <select
                  required
                  value={assignEmployeeId}
                  onChange={(e) => setAssignEmployeeId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  <option value="">Choose employee...</option>
                  {employees
                    .filter((e) => !selectedShiftAssignments.some((a) => a.employee_id === e.id))
                    .map((e) => (
                      <option key={e.id} value={e.id}>{e.first_name} {e.last_name} – {e.department}</option>
                    ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-[#253C7D] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1F336A] disabled:opacity-60 cursor-pointer">
                  {submitting ? "Assigning..." : "Assign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}