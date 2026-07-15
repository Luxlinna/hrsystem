import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { UnityApp, AppAccess, AppUsageLog, Employee } from "../types";

interface AppDetailPanelProps {
  app: UnityApp;
  accesses: AppAccess[];
  usageLogs: AppUsageLog[];
  employees: Employee[];
  onClose: () => void;
  onRefresh: () => void;
}

const actionLabels: Record<string, string> = {
  message_sent: "Sent a message",
  channel_joined: "Joined a channel",
  file_shared: "Shared a file",
  huddle_started: "Started a huddle",
  pull_request: "Opened a pull request",
  code_review: "Reviewed code",
  commit_pushed: "Pushed a commit",
  branch_created: "Created a branch",
  issue_created: "Created an issue",
  prototype_edited: "Edited a prototype",
  design_viewed: "Viewed a design",
  comment_added: "Added a comment",
  frame_created: "Created a frame",
  meeting_hosted: "Hosted a meeting",
  meeting_joined: "Joined a meeting",
  issue_updated: "Updated an issue",
  sprint_planned: "Planned a sprint",
  ticket_created: "Created a ticket",
  ticket_resolved: "Resolved a ticket",
  lead_updated: "Updated a lead",
  report_viewed: "Viewed a report",
  instance_launched: "Launched an instance",
  deploy_triggered: "Triggered a deploy",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function AppDetailPanel({ app, accesses, usageLogs, employees, onClose, onRefresh }: AppDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<"access" | "activity" | "info">("access");
  const [grantModal, setGrantModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("user");
  const [saving, setSaving] = useState(false);

  const appLogs = usageLogs.filter((l) => l.app_id === app.id);
  const appAccesses = accesses.filter((a) => a.app_id === app.id && a.is_active);
  const totalMinutes = appLogs.reduce((s, l) => s + (l.duration_minutes || 0), 0);

  const grantedIds = new Set(appAccesses.map((a) => a.employee_id));
  const availableEmployees = employees.filter((e) => !grantedIds.has(e.id));

  const handleGrant = async () => {
    if (!selectedEmpId) return;
    setSaving(true);
    const { error } = await supabase.from("app_access").insert({
      app_id: app.id,
      employee_id: selectedEmpId,
      access_level: selectedLevel,
      granted_by: "HR Admin",
    });
    setSaving(false);
    if (error) { toast.error("Failed to grant access"); return; }
    toast.success("Access granted successfully");
    setGrantModal(false);
    setSelectedEmpId("");
    onRefresh();
  };

  const handleRevoke = async (accessId: number, empName: string) => {
    const { error } = await supabase.from("app_access").update({ is_active: false }).eq("id", accessId);
    if (error) { toast.error("Failed to revoke access"); return; }
    toast.success(`Access revoked for ${empName}`);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="w-[480px] bg-white h-full overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0" style={{ backgroundColor: app.color }}>
            <i className={`${app.icon} w-6 h-6 flex items-center justify-center`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-bold text-gray-900">{app.name}</p>
            <p className="text-[12px] text-gray-500">{app.vendor} · v{app.version}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <i className="ri-close-line text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 flex gap-1 bg-gray-50">
          {(["access", "activity", "info"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-colors whitespace-nowrap ${activeTab === t ? "bg-white text-[#0D7377]" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 p-6">
          {activeTab === "access" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-semibold text-gray-900">{appAccesses.length} Users with Access</p>
                <button
                  onClick={() => setGrantModal(true)}
                  className="px-3 py-1.5 bg-[#0D7377] text-white text-[11px] font-semibold rounded-lg hover:bg-[#0a5c60] transition-colors whitespace-nowrap"
                >
                  <i className="ri-user-add-line mr-1" />
                  Grant Access
                </button>
              </div>

              <div className="space-y-2">
                {appAccesses.map((access) => {
                  const emp = access.employees;
                  if (!emp) return null;
                  return (
                    <div key={access.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                      {emp.avatar_url ? (
                        <img src={emp.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#0D7377]/10 flex items-center justify-center text-[#0D7377] font-bold text-sm flex-shrink-0">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{emp.first_name} {emp.last_name}</p>
                        <p className="text-[11px] text-gray-500">{emp.role} · {emp.department}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        access.access_level === "admin" ? "bg-[#0D7377]/10 text-[#0D7377]" :
                        access.access_level === "viewer" ? "bg-gray-100 text-gray-500" :
                        "bg-emerald-50 text-emerald-700"
                      }`}>
                        {access.access_level}
                      </span>
                      <button
                        onClick={() => handleRevoke(access.id, `${emp.first_name} ${emp.last_name}`)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <i className="ri-user-unfollow-line text-sm" />
                      </button>
                    </div>
                  );
                })}
                {appAccesses.length === 0 && (
                  <div className="py-8 text-center">
                    <i className="ri-user-line text-3xl text-gray-300 block mb-2" />
                    <p className="text-[13px] text-gray-400">No users have access yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-semibold text-gray-900">{appLogs.length} Events · {totalMinutes}min total</p>
              </div>
              <div className="space-y-2">
                {appLogs.sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()).map((log) => {
                  const emp = log.employees;
                  return (
                    <div key={log.id} className="flex items-start gap-3 py-3 border-b border-gray-50">
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
                          {" "}{actionLabels[log.action] || log.action}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400">{timeAgo(log.logged_at)}</span>
                          {log.duration_minutes > 0 && (
                            <span className="text-[10px] text-gray-400">· {log.duration_minutes}min</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {appLogs.length === 0 && (
                  <div className="py-8 text-center">
                    <i className="ri-bar-chart-line text-3xl text-gray-300 block mb-2" />
                    <p className="text-[13px] text-gray-400">No activity recorded yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "info" && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                {[
                  { label: "Vendor", value: app.vendor },
                  { label: "Version", value: app.version },
                  { label: "Category", value: app.category },
                  { label: "Status", value: app.status },
                  { label: "Monthly Cost", value: `$${Number(app.monthly_cost).toLocaleString()}` },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-[12px] text-gray-500">{item.label}</span>
                    <span className="text-[12px] font-semibold text-gray-900 capitalize">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href={app.integration_url}
                  target="_blank"
                  rel="nofollow noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 bg-[#0D7377] text-white text-[13px] font-semibold rounded-xl hover:bg-[#0a5c60] transition-colors"
                >
                  <i className="ri-external-link-line" />
                  Open {app.name}
                </a>
                <a
                  href={app.docs_url}
                  target="_blank"
                  rel="nofollow noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-700 text-[13px] font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <i className="ri-book-open-line" />
                  Documentation
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {grantModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4" onClick={() => setGrantModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[15px] font-bold text-gray-900 mb-4">Grant Access to {app.name}</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[12px] font-semibold text-gray-600 mb-1 block">Employee</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-900 focus:outline-none focus:border-[#0D7377]"
                >
                  <option value="">Select employee...</option>
                  {availableEmployees.map((e) => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name} — {e.department}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-600 mb-1 block">Access Level</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-900 focus:outline-none focus:border-[#0D7377]"
                >
                  <option value="viewer">Viewer — read-only access</option>
                  <option value="user">User — standard access</option>
                  <option value="admin">Admin — full control</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setGrantModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-[13px] font-semibold rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap">
                Cancel
              </button>
              <button
                onClick={handleGrant}
                disabled={!selectedEmpId || saving}
                className="flex-1 py-2.5 bg-[#0D7377] text-white text-[13px] font-semibold rounded-xl hover:bg-[#0a5c60] transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {saving ? "Granting..." : "Grant Access"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}