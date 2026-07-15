import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  role: string;
  avatar_url: string | null;
}

interface DisciplinaryRecord {
  id: number;
  employee_id: string;
  type: string;
  title: string;
  description: string | null;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "escalated" | "closed";
  incident_date: string | null;
  follow_up_date: string | null;
  resolved_at: string | null;
  created_by: string;
  witnesses: string | null;
  action_taken: string | null;
  pip_start_date: string | null;
  pip_end_date: string | null;
  pip_goals: string | null;
  created_at: string;
  employees?: Employee;
}

interface NewRecord {
  employee_id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  incident_date: string;
  follow_up_date: string;
  created_by: string;
  witnesses: string;
  action_taken: string;
  pip_start_date: string;
  pip_end_date: string;
  pip_goals: string;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  verbal_warning:   { label: "Verbal Warning",   color: "bg-amber-100 text-amber-700",    icon: "ri-discuss-line" },
  written_warning:  { label: "Written Warning",  color: "bg-orange-100 text-orange-700",  icon: "ri-file-warning-line" },
  final_warning:    { label: "Final Warning",    color: "bg-red-100 text-red-600",        icon: "ri-error-warning-line" },
  pip:              { label: "PIP",              color: "bg-violet-100 text-violet-700",  icon: "ri-focus-3-line" },
  incident:         { label: "Incident",         color: "bg-rose-100 text-rose-600",      icon: "ri-alert-line" },
  suspension:       { label: "Suspension",       color: "bg-red-200 text-red-700",        icon: "ri-pause-circle-line" },
  termination:      { label: "Termination",      color: "bg-gray-200 text-gray-700",      icon: "ri-user-unfollow-line" },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:      { label: "Low",      color: "bg-sky-100 text-sky-600" },
  medium:   { label: "Medium",   color: "bg-amber-100 text-amber-700" },
  high:     { label: "High",     color: "bg-red-100 text-red-600" },
  critical: { label: "Critical", color: "bg-red-200 text-red-700" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open:        { label: "Open",        color: "bg-sky-100 text-sky-700" },
  in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-700" },
  resolved:    { label: "Resolved",    color: "bg-emerald-100 text-emerald-700" },
  escalated:   { label: "Escalated",   color: "bg-red-100 text-red-600" },
  closed:      { label: "Closed",      color: "bg-gray-100 text-gray-500" },
};

export default function DisciplinaryPage() {
  const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<DisciplinaryRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pip" | "open">("all");

  const [newRecord, setNewRecord] = useState<NewRecord>({
    employee_id: "", type: "verbal_warning", title: "", description: "", severity: "medium",
    status: "open", incident_date: new Date().toISOString().split("T")[0], follow_up_date: "",
    created_by: "Sarah Mitchell", witnesses: "", action_taken: "", pip_start_date: "", pip_end_date: "", pip_goals: "",
  });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [rRes, eRes] = await Promise.all([
      supabase
        .from("disciplinary_records")
        .select("*, employees(id, first_name, last_name, department, role, avatar_url)")
        .order("created_at", { ascending: false }),
      supabase.from("employees").select("id, first_name, last_name, department, role, avatar_url").eq("status", "active").order("first_name"),
    ]);
    if (rRes.data) setRecords(rRes.data as DisciplinaryRecord[]);
    if (eRes.data) setEmployees(eRes.data);
    setLoading(false);
  }

  const tabFiltered = records.filter((r) => {
    if (activeTab === "pip") return r.type === "pip";
    if (activeTab === "open") return r.status === "open" || r.status === "in_progress";
    return true;
  });

  const filtered = tabFiltered.filter((r) => {
    if (filterType && r.type !== filterType) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterSeverity && r.severity !== filterSeverity) return false;
    if (searchQuery) {
      const emp = r.employees;
      const name = emp ? `${emp.first_name} ${emp.last_name}`.toLowerCase() : "";
      if (!name.includes(searchQuery.toLowerCase()) && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  const openCount = records.filter((r) => r.status === "open" || r.status === "in_progress").length;
  const pipCount = records.filter((r) => r.type === "pip").length;
  const criticalCount = records.filter((r) => r.severity === "critical" || r.severity === "high").length;
  const resolvedCount = records.filter((r) => r.status === "resolved" || r.status === "closed").length;

  async function handleSave() {
    if (!newRecord.employee_id || !newRecord.title.trim()) return;
    setSaving(true);
    await supabase.from("disciplinary_records").insert({
      employee_id: newRecord.employee_id,
      type: newRecord.type,
      title: newRecord.title.trim(),
      description: newRecord.description || null,
      severity: newRecord.severity,
      status: newRecord.status,
      incident_date: newRecord.incident_date || null,
      follow_up_date: newRecord.follow_up_date || null,
      created_by: newRecord.created_by,
      witnesses: newRecord.witnesses || null,
      action_taken: newRecord.action_taken || null,
      pip_start_date: newRecord.type === "pip" && newRecord.pip_start_date ? newRecord.pip_start_date : null,
      pip_end_date: newRecord.type === "pip" && newRecord.pip_end_date ? newRecord.pip_end_date : null,
      pip_goals: newRecord.type === "pip" && newRecord.pip_goals ? newRecord.pip_goals : null,
    });
    setSaving(false);
    setShowModal(false);
    setNewRecord({ employee_id: "", type: "verbal_warning", title: "", description: "", severity: "medium", status: "open", incident_date: new Date().toISOString().split("T")[0], follow_up_date: "", created_by: "Sarah Mitchell", witnesses: "", action_taken: "", pip_start_date: "", pip_end_date: "", pip_goals: "" });
    fetchData();
  }

  async function updateStatus(id: number, status: string) {
    await supabase.from("disciplinary_records").update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null }).eq("id", id);
    if (selectedRecord && selectedRecord.id === id) {
      setSelectedRecord({ ...selectedRecord, status: status as DisciplinaryRecord["status"] });
    }
    fetchData();
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6] p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Disciplinary &amp; Incidents
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Log warnings, incidents, and performance improvement plans with follow-up tracking</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0D7377] text-white text-sm font-medium rounded-lg hover:bg-[#0a5f62] transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-add-line" />
          Log Incident
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Open Cases", value: openCount, icon: "ri-folder-open-line", color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Active PIPs", value: pipCount, icon: "ri-focus-3-line", color: "text-violet-600", bg: "bg-violet-50" },
          { label: "High / Critical", value: criticalCount, icon: "ri-error-warning-line", color: "text-red-500", bg: "bg-red-50" },
          { label: "Resolved", value: resolvedCount, icon: "ri-checkbox-circle-line", color: "text-emerald-600", bg: "bg-emerald-50" },
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
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {([["all", "All Cases"], ["open", "Open & Active"], ["pip", "PIPs"]] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${activeTab === t ? "bg-white text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            {label}
            {t === "open" && openCount > 0 && <span className="ml-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{openCount}</span>}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search employee or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377]"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377] cursor-pointer"
        >
          <option value="">All Types</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377] cursor-pointer"
        >
          <option value="">All Severities</option>
          {Object.entries(SEVERITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377] cursor-pointer"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Records List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading records...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No records found.</div>
        ) : filtered.map((r) => {
          const typeCfg = TYPE_CONFIG[r.type];
          const sevCfg = SEVERITY_CONFIG[r.severity];
          const statusCfg = STATUS_CONFIG[r.status];
          const emp = r.employees;
          const overdue = r.follow_up_date && r.status !== "resolved" && r.status !== "closed" && new Date(r.follow_up_date) < new Date();
          return (
            <div
              key={r.id}
              onClick={() => setSelectedRecord(r)}
              className={`bg-white rounded-xl border p-5 cursor-pointer hover:border-gray-300 transition-colors ${r.severity === "critical" ? "border-red-200" : "border-gray-100"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {emp?.avatar_url ? (
                    <img src={emp.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#0D7377]/10 text-[#0D7377] flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                      {emp ? emp.first_name[0] + emp.last_name[0] : "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                      {overdue && <span className="text-xs text-red-500 font-medium">⚠ Follow-up overdue</span>}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{emp ? `${emp.first_name} ${emp.last_name}` : "—"} · {emp?.department} · {emp?.role}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{r.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeCfg.color}`}>
                      <i className={`${typeCfg.icon} mr-1`} />{typeCfg.label}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sevCfg.color}`}>{sevCfg.label}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.color}`}>{statusCfg.label}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {r.incident_date ? new Date(r.incident_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </p>
                  <p className="text-xs text-gray-400">By {r.created_by}</p>
                </div>
              </div>
              {r.type === "pip" && r.pip_start_date && r.pip_end_date && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">PIP Period:</span>
                    <span className="text-xs font-medium text-gray-700">
                      {new Date(r.pip_start_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} →{" "}
                      {new Date(r.pip_end_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    {new Date(r.pip_end_date + "T00:00:00") < new Date() && r.status === "in_progress" && (
                      <span className="text-xs text-red-500 font-medium">PIP period ended</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail Side Panel */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSelectedRecord(null)} />
          <div className="relative w-[480px] bg-white h-full overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${TYPE_CONFIG[selectedRecord.type].color}`}>
                  <i className={TYPE_CONFIG[selectedRecord.type].icon} />
                  {TYPE_CONFIG[selectedRecord.type].label}
                </span>
                <h3 className="text-base font-semibold text-gray-900">{selectedRecord.title}</h3>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer shrink-0">
                <i className="ri-close-line text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {selectedRecord.employees && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  {selectedRecord.employees.avatar_url ? (
                    <img src={selectedRecord.employees.avatar_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#0D7377]/10 text-[#0D7377] flex items-center justify-center font-bold text-sm">
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${SEVERITY_CONFIG[selectedRecord.severity].color}`}>
                  {SEVERITY_CONFIG[selectedRecord.severity].label} Severity
                </span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CONFIG[selectedRecord.status].color}`}>
                  {STATUS_CONFIG[selectedRecord.status].label}
                </span>
              </div>
              {selectedRecord.description && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Description</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{selectedRecord.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-0.5">Incident Date</p>
                  <p className="text-sm font-medium text-gray-800">
                    {selectedRecord.incident_date ? new Date(selectedRecord.incident_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${selectedRecord.follow_up_date && selectedRecord.status !== "resolved" && new Date(selectedRecord.follow_up_date) < new Date() ? "bg-red-50" : "bg-gray-50"}`}>
                  <p className="text-xs text-gray-400 mb-0.5">Follow-up Date</p>
                  <p className={`text-sm font-medium ${selectedRecord.follow_up_date && selectedRecord.status !== "resolved" && new Date(selectedRecord.follow_up_date) < new Date() ? "text-red-600" : "text-gray-800"}`}>
                    {selectedRecord.follow_up_date ? new Date(selectedRecord.follow_up_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "None set"}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-0.5">Logged By</p>
                  <p className="text-sm font-medium text-gray-800">{selectedRecord.created_by}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-0.5">Filed</p>
                  <p className="text-sm font-medium text-gray-800">{new Date(selectedRecord.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
              </div>
              {selectedRecord.witnesses && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Witnesses</p>
                  <p className="text-sm text-gray-700">{selectedRecord.witnesses}</p>
                </div>
              )}
              {selectedRecord.action_taken && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Action Taken</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{selectedRecord.action_taken}</p>
                </div>
              )}
              {selectedRecord.type === "pip" && (
                <div className="border border-violet-200 rounded-xl p-4 bg-violet-50">
                  <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-3">Performance Improvement Plan</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-violet-500 mb-0.5">Start Date</p>
                      <p className="text-sm font-medium text-violet-800">{selectedRecord.pip_start_date ? new Date(selectedRecord.pip_start_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-violet-500 mb-0.5">End Date</p>
                      <p className="text-sm font-medium text-violet-800">{selectedRecord.pip_end_date ? new Date(selectedRecord.pip_end_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</p>
                    </div>
                  </div>
                  {selectedRecord.pip_goals && (
                    <div>
                      <p className="text-xs text-violet-500 mb-1">Goals</p>
                      <p className="text-sm text-violet-800 leading-relaxed">{selectedRecord.pip_goals}</p>
                    </div>
                  )}
                </div>
              )}
              {/* Status update actions */}
              {selectedRecord.status !== "resolved" && selectedRecord.status !== "closed" && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Update Status</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedRecord.status !== "in_progress" && (
                      <button
                        onClick={() => updateStatus(selectedRecord.id, "in_progress")}
                        className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 cursor-pointer whitespace-nowrap"
                      >
                        Mark In Progress
                      </button>
                    )}
                    {selectedRecord.status !== "escalated" && (
                      <button
                        onClick={() => updateStatus(selectedRecord.id, "escalated")}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer whitespace-nowrap"
                      >
                        Escalate
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(selectedRecord.id, "resolved")}
                      className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 cursor-pointer whitespace-nowrap"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => updateStatus(selectedRecord.id, "closed")}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer whitespace-nowrap"
                    >
                      Close Case
                    </button>
                  </div>
                </div>
              )}
              {(selectedRecord.status === "resolved" || selectedRecord.status === "closed") && selectedRecord.resolved_at && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <i className="ri-checkbox-circle-line text-emerald-600" />
                  <p className="text-sm text-emerald-700">
                    {selectedRecord.status === "resolved" ? "Resolved" : "Closed"} on {new Date(selectedRecord.resolved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Record Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-[580px] max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Log Disciplinary Record</h3>
              <p className="text-sm text-gray-400 mt-0.5">Document a warning, incident, or performance plan</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Employee *</label>
                <select
                  value={newRecord.employee_id}
                  onChange={(e) => setNewRecord({ ...newRecord, employee_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377] cursor-pointer"
                >
                  <option value="">Select employee...</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name} — {e.department}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
                  <select
                    value={newRecord.type}
                    onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377] cursor-pointer"
                  >
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Severity</label>
                  <select
                    value={newRecord.severity}
                    onChange={(e) => setNewRecord({ ...newRecord, severity: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377] cursor-pointer"
                  >
                    {Object.entries(SEVERITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Title *</label>
                <input
                  type="text"
                  value={newRecord.title}
                  onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377]"
                  placeholder="Brief title of the incident or warning"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
                <textarea
                  value={newRecord.description}
                  onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377] resize-none"
                  placeholder="Detailed description of what occurred..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Incident Date</label>
                  <input
                    type="date"
                    value={newRecord.incident_date}
                    onChange={(e) => setNewRecord({ ...newRecord, incident_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={newRecord.follow_up_date}
                    onChange={(e) => setNewRecord({ ...newRecord, follow_up_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Action Taken</label>
                <textarea
                  value={newRecord.action_taken}
                  onChange={(e) => setNewRecord({ ...newRecord, action_taken: e.target.value })}
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377] resize-none"
                  placeholder="What steps have been taken or are planned..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Witnesses</label>
                <input
                  type="text"
                  value={newRecord.witnesses}
                  onChange={(e) => setNewRecord({ ...newRecord, witnesses: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0D7377]"
                  placeholder="Comma-separated names"
                />
              </div>
              {newRecord.type === "pip" && (
                <div className="border border-violet-200 rounded-xl p-4 bg-violet-50 space-y-3">
                  <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">PIP Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-violet-600 block mb-1">PIP Start Date</label>
                      <input
                        type="date"
                        value={newRecord.pip_start_date}
                        onChange={(e) => setNewRecord({ ...newRecord, pip_start_date: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg focus:outline-none focus:border-violet-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-violet-600 block mb-1">PIP End Date</label>
                      <input
                        type="date"
                        value={newRecord.pip_end_date}
                        onChange={(e) => setNewRecord({ ...newRecord, pip_end_date: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg focus:outline-none focus:border-violet-400 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-violet-600 block mb-1">PIP Goals &amp; Objectives</label>
                    <textarea
                      value={newRecord.pip_goals}
                      onChange={(e) => setNewRecord({ ...newRecord, pip_goals: e.target.value })}
                      rows={3}
                      maxLength={500}
                      className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg focus:outline-none focus:border-violet-400 bg-white resize-none"
                      placeholder="List the specific goals and measurable targets..."
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !newRecord.employee_id || !newRecord.title.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#0D7377] rounded-lg hover:bg-[#0a5f62] disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {saving ? "Saving..." : "Log Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}