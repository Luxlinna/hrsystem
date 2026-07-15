import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import AppCard from "./components/AppCard";
import AppDetailPanel from "./components/AppDetailPanel";
import { UnityApp, AppAccess, AppUsageLog, Employee } from "./types";

const categoryColors: Record<string, string> = {
  Communication: "bg-emerald-50 text-emerald-700",
  Engineering: "bg-sky-50 text-sky-700",
  Design: "bg-rose-50 text-rose-700",
  Productivity: "bg-amber-50 text-amber-700",
  Sales: "bg-violet-50 text-violet-700",
  HR: "bg-teal-50 text-teal-700",
  Security: "bg-red-50 text-red-700",
};

export default function UnityApps() {
  const [apps, setApps] = useState<UnityApp[]>([]);
  const [accesses, setAccesses] = useState<AppAccess[]>([]);
  const [usageLogs, setUsageLogs] = useState<AppUsageLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<UnityApp | null>(null);
  const [grantForApp, setGrantForApp] = useState<UnityApp | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"directory" | "activity" | "costs">("directory");

  const loadAll = async () => {
    const [{ data: a }, { data: ac }, { data: ul }, { data: emp }] = await Promise.all([
      supabase.from("unity_apps").select("*").order("name"),
      supabase.from("app_access").select("*, employees(first_name, last_name, role, department, avatar_url)").eq("is_active", true),
      supabase.from("app_usage_logs").select("*, unity_apps(name, icon, color), employees(first_name, last_name, avatar_url)").order("logged_at", { ascending: false }).limit(100),
      supabase.from("employees").select("id, first_name, last_name, role, department, avatar_url").eq("status", "active"),
    ]);
    setApps((a || []) as UnityApp[]);
    setAccesses((ac || []) as AppAccess[]);
    setUsageLogs((ul || []) as AppUsageLog[]);
    setEmployees((emp || []) as Employee[]);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(apps.map((a) => a.category))).sort()], [apps]);

  const filteredApps = useMemo(() => apps.filter((a) => {
    const matchCat = categoryFilter === "All" || a.category === categoryFilter;
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchSearch = !searchTerm || a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchStatus && matchSearch;
  }), [apps, categoryFilter, statusFilter, searchTerm]);

  const getAccessCount = (appId: number) => accesses.filter((a) => a.app_id === appId).length;
  const getUsageCount = (appId: number) => usageLogs.filter((l) => l.app_id === appId).length;
  const getTodayMinutes = (appId: number) => {
    const today = new Date().toDateString();
    return usageLogs
      .filter((l) => l.app_id === appId && new Date(l.logged_at).toDateString() === today)
      .reduce((s, l) => s + (l.duration_minutes || 0), 0);
  };

  const totalMonthlyCost = apps.reduce((s, a) => s + Number(a.monthly_cost || 0), 0);
  const activeApps = apps.filter((a) => a.status === "active").length;
  const totalUsers = new Set(accesses.map((a) => a.employee_id)).size;
  const todayEvents = usageLogs.filter((l) => new Date(l.logged_at).toDateString() === new Date().toDateString()).length;

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  }

  const actionLabels: Record<string, string> = {
    message_sent: "sent a message", channel_joined: "joined a channel", file_shared: "shared a file",
    huddle_started: "started a huddle", pull_request: "opened a PR", code_review: "reviewed code",
    commit_pushed: "pushed a commit", branch_created: "created a branch", issue_created: "created an issue",
    prototype_edited: "edited a prototype", design_viewed: "viewed a design", comment_added: "added a comment",
    frame_created: "created a frame", meeting_hosted: "hosted a meeting", meeting_joined: "joined a meeting",
    issue_updated: "updated an issue", sprint_planned: "planned a sprint", ticket_created: "created a ticket",
    ticket_resolved: "resolved a ticket", lead_updated: "updated a lead", report_viewed: "viewed a report",
    instance_launched: "launched an instance", deploy_triggered: "triggered a deploy",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Unity Apps</h1>
          <p className="text-[13px] text-gray-500 mt-1">Integrated workplace apps — manage access, track usage, control costs</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Apps", value: activeApps, icon: "ri-apps-line", color: "text-[#0D7377] bg-[#0D7377]/10" },
          { label: "Total Users", value: totalUsers, icon: "ri-user-line", color: "text-emerald-700 bg-emerald-50" },
          { label: "Today Events", value: todayEvents, icon: "ri-pulse-line", color: "text-amber-700 bg-amber-50" },
          { label: "Monthly Cost", value: `$${(totalMonthlyCost / 1000).toFixed(1)}k`, icon: "ri-money-dollar-circle-line", color: "text-rose-700 bg-rose-50" },
        ].map((s) => (
          <div key={s.label} className="border border-gray-100 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <i className={`${s.icon} w-5 h-5 flex items-center justify-center`} />
            </div>
            <div>
              <p className="text-[18px] font-bold text-gray-900">{s.value}</p>
              <p className="text-[11px] text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "directory", label: "App Directory" },
          { key: "activity", label: "Live Activity" },
          { key: "costs", label: "Cost Breakdown" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap ${activeTab === t.key ? "bg-white text-[#0D7377]" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "directory" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-xs">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search apps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#0D7377] text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {["all", "active", "maintenance"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 rounded-xl text-[12px] font-semibold capitalize transition-colors whitespace-nowrap ${statusFilter === s ? "bg-[#0D7377] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {s === "all" ? "All Status" : s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap ${
                  categoryFilter === cat
                    ? "bg-[#0D7377] text-white"
                    : `${categoryColors[cat] || "bg-gray-50 text-gray-600"} hover:opacity-80`
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                accessCount={getAccessCount(app.id)}
                usageCount={getUsageCount(app.id)}
                todayMinutes={getTodayMinutes(app.id)}
                onClick={() => setSelectedApp(app)}
                onGrantAccess={() => setSelectedApp(app)}
              />
            ))}
            {filteredApps.length === 0 && (
              <div className="col-span-4 py-16 text-center">
                <i className="ri-apps-line text-4xl text-gray-300 block mb-2" />
                <p className="text-[14px] text-gray-400">No apps found matching your filters</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "activity" && (
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold text-gray-900 mb-4">{usageLogs.length} total events recorded</p>
          <div className="space-y-1">
            {usageLogs.map((log) => {
              const emp = log.employees;
              const app = log.unity_apps;
              return (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  {emp?.avatar_url ? (
                    <img src={emp.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold flex-shrink-0 mt-0.5">
                      {emp?.first_name?.[0]}{emp?.last_name?.[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-[12px] text-gray-900">
                      <span className="font-semibold">{emp?.first_name} {emp?.last_name}</span>
                      {" "}{actionLabels[log.action] || log.action}{" "}
                      <span className="font-medium text-[#0D7377]">in {app?.name}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400">{timeAgo(log.logged_at)}</span>
                      {log.duration_minutes > 0 && <span className="text-[10px] text-gray-400">· {log.duration_minutes}min</span>}
                    </div>
                  </div>
                  {app && (
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs flex-shrink-0" style={{ backgroundColor: app.color }}>
                      <i className={`${app.icon} w-3 h-3 flex items-center justify-center`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "costs" && (
        <div className="max-w-3xl">
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-gray-900">Monthly Software Costs</h3>
              <span className="text-[13px] font-bold text-[#0D7377]">Total: ${totalMonthlyCost.toLocaleString()}/mo</span>
            </div>
            <div>
              {[...apps].sort((a, b) => Number(b.monthly_cost) - Number(a.monthly_cost)).map((app) => {
                const pct = totalMonthlyCost > 0 ? (Number(app.monthly_cost) / totalMonthlyCost) * 100 : 0;
                return (
                  <div key={app.id} className="px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs" style={{ backgroundColor: app.color }}>
                        <i className={`${app.icon} w-4 h-4 flex items-center justify-center`} />
                      </div>
                      <span className="text-[13px] font-semibold text-gray-900 flex-1">{app.name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        categoryColors[app.category] || "bg-gray-50 text-gray-500"
                      }`}>{app.category}</span>
                      <span className="text-[13px] font-bold text-gray-900">${Number(app.monthly_cost).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#0D7377]" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400 w-10 text-right">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedApp && (
        <AppDetailPanel
          app={selectedApp}
          accesses={accesses}
          usageLogs={usageLogs}
          employees={employees}
          onClose={() => setSelectedApp(null)}
          onRefresh={loadAll}
        />
      )}
    </div>
  );
}