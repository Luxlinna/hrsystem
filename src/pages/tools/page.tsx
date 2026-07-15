import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

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
  const [tab, setTab] = useState("tools");
  const [tools, setTools] = useState<Tool[]>([]);
  const [assignments, setAssignments] = useState<ToolAssignment[]>([]);
  const [usages, setUsages] = useState<ToolUsage[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
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
    setAssignEmployeeId("");
    setAssignModalOpen(true);
  };

  const assignTool = async () => {
    if (!selectedTool || !assignEmployeeId) return;
    const already = assignments.find(
      (a) => a.tool_id === selectedTool.id && a.employee_id === assignEmployeeId
    );
    if (already) {
      toast("Already assigned", "This employee already has access to this tool.", "warning");
      return;
    }
    const { error } = await supabase.from("tool_assignments").insert({
      tool_id: selectedTool.id,
      employee_id: assignEmployeeId,
    });
    if (error) {
      toast("Error", error.message, "error");
      return;
    }
    toast("Assigned", `Tool access granted successfully.`, "success");
    setAssignModalOpen(false);
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
    loadData();
  };

  const totalAssignments = assignments.length;
  const totalUsages = usages.length;
  const activeTools = tools.filter((t) => t.status === "active").length;
  const avgUsagePerTool = tools.length > 0 ? Math.round(totalUsages / tools.length) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
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
              <div className="w-9 h-9 rounded-lg bg-[#0D7377]/10 flex items-center justify-center">
                <i className={`${s.icon} text-[#0D7377] text-sm w-5 h-5 flex items-center justify-center`} />
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
              tab === t.key ? "bg-[#0D7377] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                  filter === c ? "bg-[#0D7377] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                  className="border border-gray-100 rounded-xl p-5 hover:border-[#0D7377]/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#0D7377]/10 flex items-center justify-center mb-4 group-hover:bg-[#0D7377] transition-colors">
                    <i
                      className={`${t.icon} text-lg text-[#0D7377] group-hover:text-white transition-colors w-6 h-6 flex items-center justify-center`}
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
                      className="flex-1 py-1.5 bg-[#0D7377] text-white text-[11px] font-semibold rounded-lg hover:bg-[#0a5c60] transition-colors whitespace-nowrap"
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
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[12px] text-gray-700 focus:outline-none focus:border-[#0D7377]"
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
                  <div className="w-8 h-8 rounded-lg bg-[#0D7377]/10 flex items-center justify-center">
                    <i className={`${tool.icon} text-[#0D7377] text-sm w-5 h-5 flex items-center justify-center`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-gray-900">{tool.name}</p>
                    <p className="text-[11px] text-gray-500">{toolAssigns.length} active access grants</p>
                  </div>
                  <button
                    onClick={() => openAssign(tool)}
                    className="px-3 py-1.5 bg-[#0D7377] text-white text-[11px] font-semibold rounded-lg hover:bg-[#0a5c60] transition-colors whitespace-nowrap"
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
                <div className="w-10 h-10 rounded-full bg-[#0D7377]/10 flex items-center justify-center shrink-0">
                  <i className={`${tool?.icon || "ri-apps-line"} text-[#0D7377] w-5 h-5 flex items-center justify-center`} />
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-[16px] font-bold text-[#1A1A1A] mb-1">Grant Tool Access</h3>
            <p className="text-[12px] text-gray-500 mb-4">
              Give an employee access to <strong>{selectedTool.name}</strong>
            </p>

            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider block mb-2">
              Employee
            </label>
            <select
              value={assignEmployeeId}
              onChange={(e) => setAssignEmployeeId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#0D7377] mb-6"
            >
              <option value="">Select employee...</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name}
                </option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={assignTool}
                disabled={!assignEmployeeId}
                className="flex-1 py-2.5 bg-[#0D7377] text-white text-[13px] font-semibold rounded-lg hover:bg-[#0a5c60] transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                Grant Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}