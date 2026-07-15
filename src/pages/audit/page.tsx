import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface AuditLog {
  id: string;
  module: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_name: string;
  actor_role: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const MODULE_COLORS: Record<string, string> = {
  hire: "bg-violet-100 text-violet-700",
  leave: "bg-amber-100 text-amber-700",
  payroll: "bg-emerald-100 text-emerald-700",
  onboarding: "bg-sky-100 text-sky-700",
  employees: "bg-indigo-100 text-indigo-700",
  offboard: "bg-red-100 text-red-700",
  it: "bg-slate-100 text-slate-700",
  finance: "bg-teal-100 text-teal-700",
  benefits: "bg-pink-100 text-pink-700",
  tools: "bg-orange-100 text-orange-700",
  unity: "bg-cyan-100 text-cyan-700",
  branches: "bg-lime-100 text-lime-700",
  settings: "bg-gray-100 text-gray-700",
};

const ACTION_ICONS: Record<string, string> = {
  created: "ri-add-circle-line",
  updated: "ri-edit-line",
  approved: "ri-checkbox-circle-line",
  rejected: "ri-close-circle-line",
  deleted: "ri-delete-bin-line",
  processed: "ri-refresh-line",
};

const ACTION_COLORS: Record<string, string> = {
  created: "text-emerald-500",
  updated: "text-sky-500",
  approved: "text-emerald-500",
  rejected: "text-red-500",
  deleted: "text-red-500",
  processed: "text-teal-500",
};

const MODULES = ["all", "hire", "leave", "payroll", "onboarding", "employees", "offboard", "it", "finance", "benefits", "tools", "unity", "branches", "settings"];

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isLive, setIsLive] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    let q = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (moduleFilter !== "all") q = q.eq("module", moduleFilter);
    if (actionFilter !== "all") q = q.eq("action", actionFilter);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo) q = q.lte("created_at", dateTo + "T23:59:59");
    const { data } = await q;
    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    const channel = supabase
      .channel("audit-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, (payload) => {
        const newLog = payload.new as AuditLog;
        setLogs((prev) => [newLog, ...prev]);
        setNewCount((c) => c + 1);
        setTimeout(() => setNewCount((c) => Math.max(0, c - 1)), 5000);
      })
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });
    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
    };
  }, []);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.description.toLowerCase().includes(q) || l.actor_name.toLowerCase().includes(q) || l.module.toLowerCase().includes(q) || l.action.toLowerCase().includes(q);
  });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const downloadCSV = () => {
    const cols = ["Timestamp", "Module", "Action", "Entity Type", "Actor", "Role", "Description"];
    const rows = filtered.map((l) => [
      new Date(l.created_at).toLocaleString(),
      l.module, l.action, l.entity_type, l.actor_name, l.actor_role,
      `"${l.description.replace(/"/g, '""')}"`,
    ]);
    const csv = [cols.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statsByModule = MODULES.slice(1).reduce((acc, m) => {
    acc[m] = logs.filter((l) => l.module === m).length;
    return acc;
  }, {} as Record<string, number>).valueOf();

  const topModules = Object.entries(statsByModule)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F8F8F7] p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Activity Audit Log
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time tracking of all HR system changes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isLive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
            <span className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
            {isLive ? "Live" : "Connecting..."}
          </div>
          {newCount > 0 && (
            <span className="bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-medium animate-bounce">
              +{newCount} new
            </span>
          )}
          <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors whitespace-nowrap cursor-pointer">
            <i className="ri-download-line" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {topModules.map(([mod, count]) => (
          <button
            key={mod}
            onClick={() => setModuleFilter(moduleFilter === mod ? "all" : mod)}
            className={`bg-white border rounded-xl p-3 text-left transition-all cursor-pointer ${moduleFilter === mod ? "border-[#0D7377] ring-1 ring-[#0D7377]/20" : "border-gray-100 hover:border-gray-200"}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${MODULE_COLORS[mod] || "bg-gray-100 text-gray-600"}`}>{mod}</span>
              <span className="text-xl font-bold text-gray-900">{count}</span>
            </div>
            <p className="text-[11px] text-gray-400">events</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0D7377]/30"
          />
        </div>
        <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none cursor-pointer">
          {MODULES.map((m) => <option key={m} value={m}>{m === "all" ? "All Modules" : m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
        </select>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none cursor-pointer">
          {["all", "created", "updated", "approved", "rejected", "deleted", "processed"].map((a) => (
            <option key={a} value={a}>{a === "all" ? "All Actions" : a.charAt(0).toUpperCase() + a.slice(1)}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none cursor-pointer" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none cursor-pointer" />
        {(moduleFilter !== "all" || actionFilter !== "all" || dateFrom || dateTo || search) && (
          <button onClick={() => { setModuleFilter("all"); setActionFilter("all"); setDateFrom(""); setDateTo(""); setSearch(""); }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
            Clear all
          </button>
        )}
      </div>

      {/* Log Timeline */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Activity Timeline</span>
          <span className="text-xs text-gray-400">{filtered.length} events</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <i className="ri-file-search-line text-3xl mb-2" />
            <p className="text-sm">No audit events found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((log) => (
              <div key={log.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full shrink-0 bg-gray-100 ${ACTION_COLORS[log.action] || "text-gray-500"}`}>
                    <i className={`${ACTION_ICONS[log.action] || "ri-record-circle-line"} text-sm`} />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${MODULE_COLORS[log.module] || "bg-gray-100 text-gray-600"}`}>
                        {log.module}
                      </span>
                      <span className={`text-xs font-medium capitalize ${ACTION_COLORS[log.action] || "text-gray-500"}`}>
                        {log.action}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{log.entity_type.replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-snug">{log.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <i className="ri-user-line text-xs" />
                        {log.actor_name} &mdash; {log.actor_role}
                      </span>
                      <span className="text-xs text-gray-400">{formatTime(log.created_at)}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                    </div>

                    {/* Metadata */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleExpand(log.id)}
                          className="text-xs text-[#0D7377] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <i className={`${expanded.has(log.id) ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}`} />
                          {expanded.has(log.id) ? "Hide" : "Show"} details
                        </button>
                        {expanded.has(log.id) && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg flex flex-wrap gap-3">
                            {Object.entries(log.metadata).map(([k, v]) => (
                              <div key={k} className="text-xs">
                                <span className="text-gray-400">{k.replace(/_/g, " ")}: </span>
                                <span className="text-gray-700 font-medium">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}