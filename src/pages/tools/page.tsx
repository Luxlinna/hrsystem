import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";

interface Tool {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: string;
  created_at: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department?: string;
  avatar_url?: string;
}

interface ToolAssignment {
  id: number;
  tool_id: number;
  employee_id: string;
  assigned_at: string;
  revoked_at: string | null;
  employee: Employee;
}

interface ToolUsage {
  id: number;
  tool_id: number;
  employee_id: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
  employee: Employee;
}

const typeColors: Record<string, string> = {
  Productivity: "bg-teal-50 text-teal-700 border-teal-200",
  Documents: "bg-amber-50 text-amber-700 border-amber-200",
  Reviews: "bg-rose-50 text-rose-700 border-rose-200",
  Finance: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Scheduling: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Compliance: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Feedback: "bg-violet-50 text-violet-700 border-violet-200",
  Hiring: "bg-orange-50 text-orange-700 border-orange-200",
};

const actionLabels: Record<string, string> = {
  login: "Signed in",
  track_hours: "Tracked hours",
  generate_doc: "Generated document",
  create_review: "Created review",
  submit_expense: "Submitted expense",
  create_schedule: "Created schedule",
  run_audit: "Ran audit",
  create_survey: "Created survey",
  submit_referral: "Submitted referral",
};

export default function Tools() {
  const { user } = useAuth();
  const { role } = usePermissions();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const [tab, setTab] = useState("tools");
  const [tools, setTools] = useState<Tool[]>([]);
  const [assignments, setAssignments] = useState<ToolAssignment[]>([]);
  const [usages, setUsages] = useState<ToolUsage[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignEmployeeIds, setAssignEmployeeIds] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const assignRef = useRef<HTMLDivElement>(null);
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [toolsRes, empRes] = await Promise.all([
      supabase.from("tools").select("*").order("id"),
      supabase.from("employees").select("id, first_name, last_name, avatar_url").eq("status", "active"),
    ]);
    setTools(toolsRes.data || []);
    setEmployees(empRes.data || []);

    if (toolsRes.data && toolsRes.data.length > 0) {
      const toolIds = toolsRes.data.map((t) => t.id);
      const [assignRes, usageRes] = await Promise.all([
        supabase.from("tool_assignments").select("*, employee:employees(id, first_name, last_name, avatar_url)").in("tool_id", toolIds).is("revoked_at", null),
        supabase.from("tool_usages").select("*, employee:employees(id, first_name, last_name, avatar_url)").in("tool_id", toolIds).order("created_at", { ascending: false }).limit(50),
      ]);
      setAssignments(assignRes.data || []);
      setUsages(usageRes.data || []);
    }
    setLoading(false);
  };

  const categories = ["All", ...Array.from(new Set(tools.map((t) => t.category)))];
  const filteredTools = filter === "All" ? tools : tools.filter((t) => t.category === filter);
  const filteredByCategory = categoryFilter
    ? filteredTools.filter((t) => t.category === categoryFilter)
    : filteredTools;

  const getAssignedCount = (toolId: number) =>
    assignments.filter((a) => a.tool_id === toolId).length;
  const getRecentUsage = (toolId: number) =>
    usages.filter((u) => u.tool_id === toolId).slice(0, 5);

  const openAssign = (tool: Tool) => {
    setSelectedTool(tool);
    setAssignEmployeeIds([]);
    setAssignModalOpen(true);
  };

  // Close the assign dropdown when clicking outside.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (assignRef.current && !assignRef.current.contains(e.target as Node)) setAssignOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Reset dropdown state when modal closes.
  useEffect(() => {
    if (!assignModalOpen) {
      setAssignOpen(false);
      setAssignSearch("");
    }
  }, [assignModalOpen]);

  const assignTool = async () => {
    if (!selectedTool || assignEmployeeIds.length === 0) return;
    // Filter out already-assigned employees
    const alreadyAssigned = new Set(
      assignments.filter((a) => a.tool_id === selectedTool.id).map((a) => a.employee_id)
    );
    const newIds = assignEmployeeIds.filter((id) => !alreadyAssigned.has(id));
    if (newIds.length === 0) {
      toast("Already assigned", "All selected employees already have access.", "warning");
      return;
    }
    const payload = newIds.map((empId) => ({ tool_id: selectedTool.id, employee_id: empId }));
    const { error } = await supabase.from("tool_assignments").insert(payload);
    if (error) {
      toast("Error", error.message, "error");
      return;
    }
    toast("Assigned", `${newIds.length} employee${newIds.length === 1 ? '' : 's'} granted access to ${selectedTool.name}.`, "success");
    logActivity({ module: "tools", action: "created", entityType: "tool_assignment", actorName, actorRole: role?.name || "Unknown", description: `${newIds.length} employee${newIds.length === 1 ? '' : 's'} granted access to ${selectedTool.name}` });
    setAssignModalOpen(false);
    setAssignEmployeeIds([]);
    loadData();
  };

  const revokeAccess = async (assignId: number) => {
    const { error } = await supabase
      .from("tool_assignments")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", assignId);
    if (error) {
      toast("Error", error.message, "error");
      return;
    }
    toast("Revoked", "Tool access has been revoked.", "success");
    const assignment = assignments.find((a) => a.id === assignId);
    const tool = tools.find((t) => t.id === assignment?.tool_id);
    logActivity({ module: "tools", action: "updated", entityType: "tool_assignment", actorName, actorRole: role?.name || "Unknown", description: `${assignment?.employee ? `${assignment.employee.first_name} ${assignment.employee.last_name}` : "An employee"}'s access to ${tool?.name ?? "a tool"} was revoked` });
    loadData();
  };

  const totalAssignments = assignments.length;
  const totalUsages = usages.length;
  const activeTools = tools.filter((t) => t.status === "active").length;
  const avgUsagePerTool = tools.length > 0 ? Math.round(totalUsages / tools.length) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">HR Tools</h1>
        <p className="text-[13px] text-gray-500 mt-1">
          Manage tool access, track usage, and monitor employee productivity utilities
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Tools", value: activeTools, icon: "ri-apps-line" },
          { label: "Total Access Grants", value: totalAssignments, icon: "ri-user-add-line" },
          { label: "Usage Events", value: totalUsages, icon: "ri-bar-chart-line" },
          { label: "Avg Usage / Tool", value: avgUsagePerTool, icon: "ri-line-chart-line" },
        ].map((s) => (
          <div key={s.label} className="border border-gray-100 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-[#253C7D]/10 flex items-center justify-center">
                <i className={`${s.icon} text-[#253C7D] text-sm w-5 h-5 flex items-center justify-center`} />
              </div>
              <p className="text-[11px] font-medium text-gray-500">{s.label}</p>
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "tools", label: "Tool Directory" },
          { key: "access", label: "Access Management" },
          { key: "activity", label: "Usage Activity" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap ${
              tab === t.key ? "bg-[#253C7D] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tool Directory */}
      {tab === "tools" && (
        <>
          <div className="flex gap-2 mb-6 flex-wrap">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-4 py-2 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap ${
                  filter === c ? "bg-[#253C7D] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredByCategory.map((t) => {
              const badgeColor = typeColors[t.category] || "bg-gray-50 text-gray-600 border-gray-200";
              const assigned = getAssignedCount(t.id);
              const recent = getRecentUsage(t.id);
              return (
                <div
                  key={t.id}
                  className="border border-gray-100 rounded-xl p-5 hover:border-[#253C7D]/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#253C7D]/10 flex items-center justify-center mb-4 group-hover:bg-[#253C7D] transition-colors">
                    <i
                      className={`${t.icon} text-lg text-[#253C7D] group-hover:text-white transition-colors w-6 h-6 flex items-center justify-center`}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-[14px] font-semibold text-gray-900">{t.name}</p>
                    {t.status !== "active" && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {t.status}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-500 leading-relaxed">{t.description}</p>
                  <span
                    className={`inline-block mt-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md border ${badgeColor}`}
                  >
                    {t.category}
                  </span>

                  <div className="mt-4 pt-3 border-t border-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">{assigned} active users</span>
                      <span className="text-[11px] text-gray-400">
                        {recent.length} recent uses
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => openAssign(t)}
                      className="flex-1 py-1.5 bg-[#253C7D] text-white text-[11px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors whitespace-nowrap"
                    >
                      Grant Access
                    </button>
                    <button
                      onClick={() => setTab("access")}
                      className="px-3 py-1.5 border border-gray-200 text-gray-600 text-[11px] font-medium rounded-lg hover:bg-gray-50 whitespace-nowrap"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Access Management */}
      {tab === "access" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[12px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
            >
              <option value="">All Categories</option>
              {categories.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {filteredTools.map((tool) => {
            const toolAssigns = assignments.filter((a) => a.tool_id === tool.id);
            if (categoryFilter && tool.category !== categoryFilter) return null;
            return (
              <div key={tool.id} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 bg-gray-50/50">
                  <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 flex items-center justify-center">
                    <i className={`${tool.icon} text-[#253C7D] text-sm w-5 h-5 flex items-center justify-center`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-gray-900">{tool.name}</p>
                    <p className="text-[11px] text-gray-500">{toolAssigns.length} active access grants</p>
                  </div>
                  <button
                    onClick={() => openAssign(tool)}
                    className="px-3 py-1.5 bg-[#253C7D] text-white text-[11px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors whitespace-nowrap"
                  >
                    + Grant Access
                  </button>
                </div>

                {toolAssigns.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {toolAssigns.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between px-5 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-semibold text-gray-500">
                            {a.employee?.first_name?.[0]}{a.employee?.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-gray-900">
                              {a.employee?.first_name} {a.employee?.last_name}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              Since {new Date(a.assigned_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => revokeAccess(a.id)}
                          className="px-3 py-1 text-[11px] font-medium text-red-600 border border-red-100 rounded-md hover:bg-red-50 transition-colors whitespace-nowrap"
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-6 text-center">
                    <p className="text-[13px] text-gray-400">No active access grants for this tool.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Usage Activity */}
      {tab === "activity" && (
        <div className="space-y-2">
          {usages.length === 0 && (
            <div className="text-center py-16">
              <i className="ri-bar-chart-line text-4xl text-gray-300 mb-3 block" />
              <p className="text-[14px] text-gray-500">No usage activity recorded yet.</p>
            </div>
          )}
          {usages.map((u) => {
            const tool = tools.find((t) => t.id === u.tool_id);
            return (
              <div
                key={u.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#253C7D]/10 flex items-center justify-center shrink-0">
                  <i className={`${tool?.icon || "ri-apps-line"} text-[#253C7D] w-5 h-5 flex items-center justify-center`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-semibold text-gray-900">
                      {actionLabels[u.action] || u.action}
                    </p>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {tool?.name || "Unknown"}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    {u.employee?.first_name} {u.employee?.last_name}
                    {u.metadata && Object.keys(u.metadata).length > 0 && (
                      <span className="text-gray-400">
                        {" "}&middot;{" "}
                        {Object.entries(u.metadata)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(", ")}
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-[11px] text-gray-400 shrink-0">
                  {new Date(u.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Modal */}
      {assignModalOpen && selectedTool && (
        <div className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center overflow-y-auto z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-[16px] font-bold text-[#1A1A1A] mb-1">Grant Tool Access</h3>
            <p className="text-[12px] text-gray-500 mb-4">
              Give an employee access to <strong>{selectedTool.name}</strong>
            </p>

            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider block mb-2">
              Employee(s)
            </label>
            <div className="relative mb-4" ref={assignRef}>
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                <input
                  type="text"
                  role="combobox"
                  aria-expanded={assignOpen}
                  value={assignOpen ? assignSearch : assignEmployeeIds.length > 0 ? `${assignEmployeeIds.length} employee${assignEmployeeIds.length === 1 ? '' : 's'} selected` : assignSearch}
                  onChange={(e) => { setAssignSearch(e.target.value); setAssignOpen(true); }}
                  onFocus={() => setAssignOpen(true)}
                  placeholder="Search by name..."
                  className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] bg-white"
                />
                <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {assignOpen && (() => {
                const filtered = employees.filter((emp) => {
                  const q = assignSearch.trim().toLowerCase();
                  if (!q) return true;
                  return `${emp.first_name} ${emp.last_name} ${emp.department}`.toLowerCase().includes(q);
                });
                return (
                  <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1">
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {filtered.length} employee{filtered.length === 1 ? '' : 's'}{assignSearch.trim() ? ` matching "${assignSearch.trim()}"` : ''}
                    </p>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        const allIds = filtered.map((e) => e.id);
                        const allSelected = allIds.length > 0 && allIds.every((id) => assignEmployeeIds.includes(id));
                        setAssignEmployeeIds(allSelected ? [] : allIds);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        filtered.length > 0 && filtered.every((e) => assignEmployeeIds.includes(e.id))
                          ? "bg-[#253C7D] border-[#253C7D]"
                          : filtered.some((e) => assignEmployeeIds.includes(e.id))
                            ? "bg-[#253C7D]/20 border-[#253C7D]"
                            : "border-gray-300 bg-white"
                      }`}>
                        {filtered.length > 0 && filtered.every((e) => assignEmployeeIds.includes(e.id)) && <i className="ri-check-line text-white text-xs" />}
                        {filtered.some((e) => assignEmployeeIds.includes(e.id)) && !(filtered.length > 0 && filtered.every((e) => assignEmployeeIds.includes(e.id))) && <span className="w-2 h-0.5 bg-[#253C7D] rounded" />}
                      </span>
                      Select all ({filtered.length})
                    </button>
                    {filtered.length === 0 ? (
                      <p className="px-3 py-4 text-[12px] text-gray-400">No employees found.</p>
                    ) : (
                      filtered.map((emp) => {
                        const checked = assignEmployeeIds.includes(emp.id);
                        return (
                          <label
                            key={emp.id}
                            onMouseDown={(e) => e.preventDefault()}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer ${checked ? "bg-[#253C7D]/5" : "hover:bg-gray-50"}`}
                          >
                            <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              checked ? "bg-[#253C7D] border-[#253C7D]" : "border-gray-300 bg-white"
                            }`}>
                              {checked && <i className="ri-check-line text-white text-xs" />}
                            </span>
                            <input type="checkbox" className="sr-only" checked={checked} onChange={() => {
                              setAssignEmployeeIds((prev) => prev.includes(emp.id) ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]);
                            }} />
                            <span className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-[10px] font-bold shrink-0">
                              {`${emp.first_name[0] || ''}${emp.last_name[0] || ''}`.toUpperCase()}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-[13px] font-medium text-gray-900">{emp.first_name} {emp.last_name}</span>
                              <span className="block text-[11px] text-gray-400 truncate">{emp.department}</span>
                            </span>
                            {checked && <i className="ri-check-line text-[#253C7D] text-sm shrink-0" />}
                          </label>
                        );
                      })
                    )}
                  </div>
                );
              })()}
            </div>
            {assignEmployeeIds.length > 0 && (
              <p className="text-[11px] text-gray-400 mb-3">{assignEmployeeIds.length} employee{assignEmployeeIds.length === 1 ? '' : 's'} selected</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={assignTool}
                disabled={assignEmployeeIds.length === 0}
                className="flex-1 py-2.5 bg-[#253C7D] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                {assignEmployeeIds.length > 1 ? `Grant Access (${assignEmployeeIds.length})` : "Grant Access"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}