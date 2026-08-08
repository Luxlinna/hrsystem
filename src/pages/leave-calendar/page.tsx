import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Local (not UTC) YYYY-MM-DD — toISOString() shifts to UTC, which can land
// on the wrong calendar day for timezones ahead of UTC (e.g. ICT).
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  reason: string | null;
  created_at: string;
  employees?: {
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    avatar_url: string | null;
  } | null;
}

const LEAVE_TYPE_META: Record<string, { color: string; bg: string; label: string }> = {
  annual: { color: "text-green-700", bg: "bg-green-100", label: "Annual" },
  sick: { color: "text-red-700", bg: "bg-red-100", label: "Sick" },
  maternity: { color: "text-pink-700", bg: "bg-pink-100", label: "Maternity" },
  paternity: { color: "text-indigo-700", bg: "bg-indigo-100", label: "Paternity" },
  unpaid: { color: "text-gray-700", bg: "bg-gray-200", label: "Unpaid" },
  bereavement: { color: "text-slate-700", bg: "bg-slate-100", label: "Bereave." },
  study: { color: "text-amber-700", bg: "bg-amber-100", label: "Study" },
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DEPARTMENTS = ["All Departments","Engineering","Sales","Operations","Marketing","Finance","IT","Legal","Executive"];

export default function LeaveCalendar() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("approved");
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<"calendar" | "list">("list");

  const loadData = async () => {
    const { data } = await supabase
      .from("leave_requests")
      .select("*, employees(first_name, last_name, role, department, avatar_url)")
      .order("start_date", { ascending: true });
    setLeaves(data || []);
  };

  useEffect(() => { loadData(); }, []);

  const filteredLeaves = leaves.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (deptFilter !== "All Departments" && l.employees?.department !== deptFilter) return false;
    if (typeFilter !== "all" && l.leave_type !== typeFilter) return false;
    return true;
  });

  // Same Department/Type filters as filteredLeaves, but deliberately ignores
  // the Approved/Pending/All toggle — the "Pending Approval" stat should
  // always reflect pending requests regardless of which status you're
  // viewing on the calendar, while still narrowing by dept/type like the
  // other three stat cards do.
  const deptTypeFilteredLeaves = leaves.filter((l) => {
    if (deptFilter !== "All Departments" && l.employees?.department !== deptFilter) return false;
    if (typeFilter !== "all" && l.leave_type !== typeFilter) return false;
    return true;
  });

  const getDateStr = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const getDayLeaves = (d: number) => {
    if (!d) return [];
    const dateStr = getDateStr(d);
    return filteredLeaves.filter((l) => dateStr >= l.start_date && dateStr <= l.end_date);
  };

  const getDayLeavesForMonth = (d: number) => getDayLeaves(d);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calCells: number[] = [...Array(firstDay).fill(0), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (calCells.length % 7 !== 0) calCells.push(0);

  const today = new Date();
  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else { setMonth(m => m - 1); } setSelectedDay(null); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else { setMonth(m => m + 1); } setSelectedDay(null); };

  const selectedDayLeaves = selectedDay ? getDayLeaves(selectedDay) : [];

  // Upcoming leaves (next 30 days)
  const upcomingLeaves = filteredLeaves.filter((l) => {
    const start = new Date(l.start_date);
    const now = new Date();
    const diff = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  }).slice(0, 8);

  // Stats
  const stats = {
    onLeaveToday: filteredLeaves.filter((l) => {
      const td = toYMD(new Date());
      return td >= l.start_date && td <= l.end_date;
    }).length,
    approvedThisMonth: filteredLeaves.filter((l) => {
      return l.status === "approved" && l.start_date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`);
    }).length,
    totalDays: filteredLeaves.filter((l) => l.status === "approved").reduce((s, l) => s + (l.days || 0), 0),
    pending: deptTypeFilteredLeaves.filter((l) => l.status === "pending").length,
  };

  const getInitials = (l: LeaveRequest) => l.employees ? `${l.employees.first_name[0]}${l.employees.last_name[0]}` : "?";
  const getFullName = (l: LeaveRequest) => l.employees ? `${l.employees.first_name} ${l.employees.last_name}` : "Unknown";

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Leave Calendar</h1>
          <p className="text-[13px] text-gray-500 mt-1">Team availability overview and leave scheduling by department</p>
        </div>
        {/* Mobile view toggle */}
        <div className="flex sm:hidden items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setMobileView("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${mobileView === "list" ? "bg-white text-gray-900" : "text-gray-500"}`}
          >
            <i className="ri-list-check" />
            List
          </button>
          <button
            onClick={() => setMobileView("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${mobileView === "calendar" ? "bg-white text-gray-900" : "text-gray-500"}`}
          >
            <i className="ri-calendar-2-line" />
            Calendar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "On Leave Today", value: stats.onLeaveToday, icon: "ri-user-unfollow-line", color: "bg-red-50 text-red-700" },
          { label: "Approved This Month", value: stats.approvedThisMonth, icon: "ri-calendar-check-line", color: "bg-green-50 text-green-700" },
          { label: "Total Days Approved", value: stats.totalDays, icon: "ri-time-line", color: "bg-[#253C7D]/10 text-[#253C7D]" },
          { label: "Pending Approval", value: stats.pending, icon: "ri-time-line", color: "bg-amber-50 text-amber-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-3 md:p-4 flex items-center gap-3 ${s.color}`}>
            <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shrink-0">
              <i className={`${s.icon} text-lg md:text-xl`} />
            </div>
            <div>
              <p className="text-lg md:text-xl font-bold">{s.value}</p>
              <p className="text-[10px] md:text-[11px] font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-white focus:outline-none focus:border-[#253C7D] text-gray-700">
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-white focus:outline-none focus:border-[#253C7D] text-gray-700">
          <option value="all">All Types</option>
          {Object.entries(LEAVE_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div className="flex gap-1.5">
          {["approved","pending","all"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-lg text-[12px] font-medium capitalize transition-colors cursor-pointer ${statusFilter === s ? "bg-[#253C7D] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s}</button>
          ))}
        </div>
        {/* Legend — hidden on mobile */}
        <div className="hidden md:flex flex-wrap gap-2 ml-auto">
          {Object.entries(LEAVE_TYPE_META).slice(0, 5).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${v.bg}`} />
              <span className="text-[11px] text-gray-500">{v.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MOBILE LIST VIEW ── */}
      <div className={`sm:hidden ${mobileView === "list" ? "block" : "hidden"}`}>
        {/* Month nav for list view */}
        <div className="flex items-center justify-between mb-4 bg-gray-50 rounded-xl px-4 py-3">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer">
            <i className="ri-arrow-left-s-line text-lg" />
          </button>
          <h3 className="text-sm font-bold text-gray-900">{MONTHS[month]} {year}</h3>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer">
            <i className="ri-arrow-right-s-line text-lg" />
          </button>
        </div>

        {/* Grouped by day */}
        {(() => {
          // Collect all dates in the month that have leaves
          const dateMap: Record<string, LeaveRequest[]> = {};
          filteredLeaves.forEach((l) => {
            const start = new Date(l.start_date + "T00:00:00");
            const end = new Date(l.end_date + "T00:00:00");
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              if (d.getFullYear() === year && d.getMonth() === month) {
                const key = toYMD(d);
                if (!dateMap[key]) dateMap[key] = [];
                if (!dateMap[key].find((x) => x.id === l.id)) dateMap[key].push(l);
              }
            }
          });
          const sortedDates = Object.keys(dateMap).sort();
          if (sortedDates.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 bg-gray-50 rounded-xl">
                <i className="ri-calendar-event-line text-3xl mb-2" />
                <p className="text-sm">No leaves for {MONTHS[month]}</p>
              </div>
            );
          }
          return (
            <div className="space-y-3">
              {sortedDates.map((dateStr) => {
                const dayLeaves = dateMap[dateStr];
                const d = new Date(dateStr + "T00:00:00");
                const dayNum = d.getDate();
                const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                const isTd = dateStr === toYMD(new Date());
                return (
                  <div key={dateStr} className="flex gap-3">
                    {/* Date column */}
                    <div className={`w-12 shrink-0 flex flex-col items-center justify-start pt-2`}>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">{dayName}</span>
                      <span className={`text-xl font-bold leading-tight ${isTd ? "text-[#253C7D]" : "text-gray-800"}`}>{dayNum}</span>
                      {isTd && <span className="w-1 h-1 rounded-full bg-[#253C7D] mt-0.5" />}
                    </div>
                    {/* Leave cards */}
                    <div className="flex-1 space-y-2">
                      {dayLeaves.map((l) => {
                        const meta = LEAVE_TYPE_META[l.leave_type] || { bg: "bg-gray-100", color: "text-gray-600", label: l.leave_type };
                        return (
                          <div key={l.id} className={`flex items-center gap-3 p-3 rounded-xl ${meta.bg}`}>
                            <div className={`w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center text-[11px] font-bold shrink-0 ${meta.color}`}>
                              {getInitials(l)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[13px] font-semibold truncate ${meta.color}`}>{getFullName(l)}</p>
                              <p className={`text-[11px] truncate opacity-70 ${meta.color}`}>{l.employees?.department} · {meta.label}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-[10px] font-medium ${meta.color} opacity-70`}>{l.days}d</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* ── DESKTOP + MOBILE CALENDAR VIEW ── */}
      <div className={`${mobileView === "calendar" ? "block" : "hidden sm:block"}`}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="xl:col-span-2">
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              {/* Calendar nav */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer">
                  <i className="ri-arrow-left-s-line text-lg" />
                </button>
                <h3 className="text-[15px] font-bold text-gray-900">{MONTHS[month]} {year}</h3>
                <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer">
                  <i className="ri-arrow-right-s-line text-lg" />
                </button>
              </div>
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-gray-100">
                {DAYS.map((d) => (
                  <div key={d} className="py-3 text-center text-[11px] font-semibold text-gray-400 uppercase">{d}</div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 divide-x divide-gray-50">
                {calCells.map((d, i) => {
                  const dayLeaves = d ? getDayLeavesForMonth(d) : [];
                  const isTd = isToday(d);
                  const isSelected = d === selectedDay;
                  const isWeekend = [0, 6].includes(i % 7);
                  return (
                    <div
                      key={i}
                      onClick={() => d && setSelectedDay(d === selectedDay ? null : d)}
                      className={`min-h-[80px] lg:min-h-[90px] p-1.5 lg:p-2 border-b border-gray-50 transition-colors relative ${d ? "cursor-pointer" : ""} ${isWeekend && d ? "bg-gray-50/30" : ""} ${isSelected ? "bg-[#253C7D]/5" : d ? "hover:bg-gray-50/50" : ""}`}
                    >
                      {d > 0 && (
                        <>
                          <span className={`text-[12px] lg:text-[13px] font-semibold inline-flex items-center justify-center w-6 h-6 lg:w-7 lg:h-7 rounded-full transition-colors ${isTd ? "bg-[#253C7D] text-white" : isSelected ? "bg-[#253C7D]/10 text-[#253C7D]" : "text-gray-700 hover:bg-gray-100"}`}>
                            {d}
                          </span>
                          {dayLeaves.length > 0 && (
                            <div className="mt-0.5 lg:mt-1 space-y-0.5">
                              {dayLeaves.slice(0, 2).map((l, li) => {
                                const meta = LEAVE_TYPE_META[l.leave_type] || { bg: "bg-gray-100", color: "text-gray-700", label: l.leave_type };
                                return (
                                  <div key={li} className={`flex items-center gap-1 px-1 py-0.5 rounded text-[9px] lg:text-[10px] font-medium truncate ${meta.bg} ${meta.color}`}>
                                    {getInitials(l)}
                                  </div>
                                );
                              })}
                              {dayLeaves.length > 2 && (
                                <div className="text-[9px] lg:text-[10px] text-gray-400 px-1">+{dayLeaves.length - 2}</div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected day detail */}
            {selectedDay && (
              <div className="mt-4 border border-gray-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[14px] font-bold text-gray-900">
                    {MONTHS[month]} {selectedDay}, {year}
                    <span className="ml-2 text-[12px] font-normal text-gray-400">{selectedDayLeaves.length} on leave</span>
                  </h4>
                  <button onClick={() => setSelectedDay(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"><i className="ri-close-line" /></button>
                </div>
                {selectedDayLeaves.length === 0 ? (
                  <p className="text-[13px] text-gray-400 py-4 text-center">No {statusFilter !== "all" ? statusFilter : ""} leaves on this day</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedDayLeaves.map((l) => {
                      const meta = LEAVE_TYPE_META[l.leave_type] || { bg: "bg-gray-100", color: "text-gray-600", label: l.leave_type };
                      return (
                        <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                          <div className="w-9 h-9 rounded-lg bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] text-[12px] font-bold shrink-0">
                            {getInitials(l)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-gray-900 truncate">{getFullName(l)}</p>
                            <p className="text-[11px] text-gray-500 truncate">{l.employees?.department} · {l.employees?.role}</p>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${meta.bg} ${meta.color}`}>{meta.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            {/* Team availability today */}
            <div className="border border-gray-100 rounded-xl p-5">
              <h3 className="text-[14px] font-bold text-gray-900 mb-4">Today&apos;s Availability</h3>
              {(() => {
                const td = toYMD(new Date());
                const onLeaveToday = filteredLeaves.filter((l) => td >= l.start_date && td <= l.end_date);
                const depts = [...new Set(onLeaveToday.map((l) => l.employees?.department || "Unknown"))];
                if (onLeaveToday.length === 0) {
                  return <p className="text-[12px] text-gray-400 text-center py-4">Everyone is in today!</p>;
                }
                return (
                  <div className="space-y-3">
                    {depts.map((dept) => {
                      const deptLeaves = onLeaveToday.filter((l) => l.employees?.department === dept);
                      return (
                        <div key={dept}>
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{dept}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {deptLeaves.map((l) => {
                              const meta = LEAVE_TYPE_META[l.leave_type] || { bg: "bg-gray-100", color: "text-gray-600", label: l.leave_type };
                              return (
                                <div key={l.id} title={`${getFullName(l)} — ${meta.label}`} className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium ${meta.bg} ${meta.color}`}>
                                  <span>{getInitials(l)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Upcoming leaves */}
            <div className="border border-gray-100 rounded-xl p-5">
              <h3 className="text-[14px] font-bold text-gray-900 mb-4">Upcoming Leaves (30d)</h3>
              {upcomingLeaves.length === 0 ? (
                <p className="text-[12px] text-gray-400 text-center py-4">No upcoming leaves</p>
              ) : (
                <div className="space-y-3">
                  {upcomingLeaves.map((l) => {
                    const meta = LEAVE_TYPE_META[l.leave_type] || { bg: "bg-gray-100", color: "text-gray-600", label: l.leave_type };
                    const daysUntil = Math.ceil((new Date(l.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={l.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] text-[11px] font-bold shrink-0">
                          {getInitials(l)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-gray-900 truncate">{getFullName(l)}</p>
                          <p className="text-[11px] text-gray-500">{l.start_date} → {l.end_date} ({l.days}d)</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>{meta.label}</span>
                          <p className="text-[10px] text-gray-400 mt-0.5">{daysUntil === 0 ? "Today" : `In ${daysUntil}d`}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Department summary */}
            <div className="border border-gray-100 rounded-xl p-5">
              <h3 className="text-[14px] font-bold text-gray-900 mb-4">By Department</h3>
              {(() => {
                const deptCounts: Record<string, number> = {};
                filteredLeaves.filter((l) => l.status === "approved").forEach((l) => {
                  const dept = l.employees?.department || "Unknown";
                  deptCounts[dept] = (deptCounts[dept] || 0) + (l.days || 0);
                });
                const maxDays = Math.max(...Object.values(deptCounts), 1);
                return (
                  <div className="space-y-3">
                    {Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).map(([dept, days]) => (
                      <div key={dept}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-medium text-gray-700">{dept}</span>
                          <span className="text-[11px] font-semibold text-[#253C7D]">{days}d</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#253C7D] rounded-full transition-all" style={{ width: `${(days / maxDays) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    {Object.keys(deptCounts).length === 0 && <p className="text-[12px] text-gray-400 text-center py-2">No data</p>}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}