import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { invalidatePermissionsCache } from "@/hooks/usePermissions";

interface AppRole {
  id: number;
  name: string;
  description: string;
  color: string;
  is_admin: boolean;
  allowed_modules: string[];
  self_service_all_employees: boolean;
  leave_view_all_employees: boolean;
  payroll_view_all_employees: boolean;
  attendance_view_all_employees: boolean;
  performance_view_all_employees: boolean;
  disciplinary_view_all_employees: boolean;
  created_at: string;
}

interface UserAssignment {
  id: number;
  user_id: string | null;
  email: string;
  display_name: string | null;
  role_id: number | null;
  created_at: string;
  app_roles?: { id: number; name: string; color: string } | null;
}

const ALL_MODULES = [
  { key: "dashboard", label: "Dashboard", icon: "ri-dashboard-line", group: "Core" },
  { key: "employees", label: "Employees", icon: "ri-user-search-line", group: "Core" },
  { key: "branches", label: "Branches", icon: "ri-building-line", group: "Core" },
  { key: "analytics", label: "Analytics", icon: "ri-bar-chart-2-line", group: "Core" },
  { key: "onboarding", label: "Onboarding", icon: "ri-user-add-line", group: "Workforce" },
  { key: "onboarding-checklist", label: "Onboarding Checklist", icon: "ri-task-line", group: "Workforce" },
  { key: "leave", label: "Leave Requests", icon: "ri-calendar-event-line", group: "Workforce" },
  { key: "leave-calendar", label: "Leave Calendar", icon: "ri-calendar-2-line", group: "Workforce" },
  { key: "hire", label: "Recruitment", icon: "ri-briefcase-line", group: "Workforce" },
  { key: "offboard", label: "Offboarding", icon: "ri-user-unfollow-line", group: "Workforce" },
  { key: "org-chart", label: "Org Chart", icon: "ri-organization-chart", group: "Workforce" },
  { key: "performance", label: "Performance", icon: "ri-star-line", group: "Workforce" },
  { key: "attendance", label: "Attendance", icon: "ri-fingerprint-line", group: "Workforce" },
  { key: "training", label: "Training", icon: "ri-graduation-cap-line", group: "Workforce" },
  { key: "disciplinary", label: "Disciplinary", icon: "ri-alert-line", group: "Workforce" },
  { key: "shifts", label: "Shifts", icon: "ri-calendar-schedule-line", group: "Workforce" },
  { key: "meeting-rooms", label: "Meeting Rooms", icon: "ri-door-open-line", group: "Workforce" },
  { key: "payroll", label: "Payroll", icon: "ri-money-dollar-circle-line", group: "Operations" },
  { key: "payroll-approval", label: "Payroll Approval", icon: "ri-file-check-line", group: "Operations" },
  { key: "finance", label: "Finance", icon: "ri-bank-line", group: "Operations" },
  { key: "it-management", label: "IT Management", icon: "ri-computer-line", group: "Operations" },
  { key: "benefits", label: "Benefits", icon: "ri-heart-pulse-line", group: "Operations" },
  { key: "tools", label: "HR Tools", icon: "ri-tools-line", group: "Operations" },
  { key: "announcements", label: "Announcements", icon: "ri-megaphone-line", group: "Operations" },
  { key: "documents", label: "Documents", icon: "ri-folder-line", group: "Operations" },
  { key: "reports", label: "Reports", icon: "ri-file-chart-line", group: "Insights" },
  { key: "audit-log", label: "Audit Log", icon: "ri-shield-check-line", group: "Insights" },
  { key: "self-service", label: "Self-Service", icon: "ri-user-settings-line", group: "Insights" },
  { key: "notifications", label: "Notifications", icon: "ri-notification-3-line", group: "System" },
  { key: "unity-apps", label: "Unity Apps", icon: "ri-apps-line", group: "System" },
  { key: "settings", label: "Settings", icon: "ri-settings-3-line", group: "System" },
];

const MODULE_GROUPS = ["Core", "Workforce", "Operations", "Insights", "System"];

const COLORS = [
  "#0D7377","#7C3AED","#059669","#D97706","#DC2626","#2563EB","#DB2777","#EA580C","#64748B","#0369A1",
];

// "Own record only" pages — each has a per-role override so admins decide
// who's allowed to see every employee's data instead of just their own.
const SCOPE_OVERRIDES = [
  { key: "self_service_all_employees", label: "Can view/switch other employees in Self-Service", hint: "Off by default — this role only sees the employee record matching their own account email." },
  { key: "leave_view_all_employees", label: "Can view/approve all employees' leave requests", hint: "Off by default — this role only sees and submits their own leave requests (the team calendar stays visible either way)." },
  { key: "payroll_view_all_employees", label: "Can view all employees' payroll", hint: "Off by default — this role only sees their own payslip data." },
  { key: "attendance_view_all_employees", label: "Can view all employees' attendance records", hint: "Off by default — this role only sees their own attendance history." },
  { key: "performance_view_all_employees", label: "Can view/manage all employees' performance reviews", hint: "Off by default — this role only sees their own reviews and goals." },
  { key: "disciplinary_view_all_employees", label: "Can view all employees' disciplinary records", hint: "Off by default — this role only sees their own records, if any." },
] as const;

const BLANK_ROLE = {
  name: "", description: "", color: "#0D7377", is_admin: false, allowed_modules: [] as string[],
  ...Object.fromEntries(SCOPE_OVERRIDES.map((o) => [o.key, false])) as Record<typeof SCOPE_OVERRIDES[number]["key"], boolean>,
};

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<"roles" | "users">("roles");
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [users, setUsers] = useState<UserAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Role editor
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [roleForm, setRoleForm] = useState(BLANK_ROLE);
  const [savingRole, setSavingRole] = useState(false);

  // User assignment
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", display_name: "", role_id: "" });
  const [savingUser, setSavingUser] = useState(false);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    const [rolesRes, usersRes] = await Promise.all([
      supabase.from("app_roles").select("*").order("id"),
      supabase.from("user_role_assignments").select("*, app_roles(id, name, color)").order("created_at", { ascending: false }),
    ]);
    setRoles(rolesRes.data || []);
    setUsers(usersRes.data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // ── Role CRUD ──
  const openNewRole = () => {
    setEditingRole(null);
    setRoleForm(BLANK_ROLE);
    setShowRoleForm(true);
  };

  const openEditRole = (r: AppRole) => {
    setEditingRole(r);
    setRoleForm({
      name: r.name, description: r.description || "", color: r.color, is_admin: r.is_admin, allowed_modules: [...r.allowed_modules],
      ...Object.fromEntries(SCOPE_OVERRIDES.map((o) => [o.key, r[o.key]])) as Record<typeof SCOPE_OVERRIDES[number]["key"], boolean>,
    });
    setShowRoleForm(true);
  };

  const toggleModule = (key: string) => {
    setRoleForm((prev) => ({
      ...prev,
      allowed_modules: prev.allowed_modules.includes(key)
        ? prev.allowed_modules.filter((m) => m !== key)
        : [...prev.allowed_modules, key],
    }));
  };

  const toggleAllInGroup = (group: string) => {
    const groupKeys = ALL_MODULES.filter((m) => m.group === group).map((m) => m.key);
    const allSelected = groupKeys.every((k) => roleForm.allowed_modules.includes(k));
    if (allSelected) {
      setRoleForm((p) => ({ ...p, allowed_modules: p.allowed_modules.filter((m) => !groupKeys.includes(m)) }));
    } else {
      const merged = Array.from(new Set([...roleForm.allowed_modules, ...groupKeys]));
      setRoleForm((p) => ({ ...p, allowed_modules: merged }));
    }
  };

  const saveRole = async () => {
    if (!roleForm.name.trim()) { showToast("Role name is required", "err"); return; }
    setSavingRole(true);
    const payload = {
      name: roleForm.name.trim(),
      description: roleForm.description.trim(),
      color: roleForm.color,
      is_admin: roleForm.is_admin,
      allowed_modules: roleForm.is_admin ? ["*"] : roleForm.allowed_modules,
      ...Object.fromEntries(SCOPE_OVERRIDES.map((o) => [o.key, roleForm[o.key]])),
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editingRole) {
      ({ error } = await supabase.from("app_roles").update(payload).eq("id", editingRole.id));
    } else {
      ({ error } = await supabase.from("app_roles").insert(payload));
    }

    setSavingRole(false);
    if (error) { showToast("Failed to save role", "err"); return; }
    showToast(editingRole ? "Role updated!" : "Role created!");
    setShowRoleForm(false);
    invalidatePermissionsCache();
    loadData();
  };

  const deleteRole = async (id: number) => {
    const { error } = await supabase.from("app_roles").update({ updated_at: new Date().toISOString() }).eq("id", id);
    if (!error) {
      await supabase.from("app_roles").delete().eq("id", id);
      showToast("Role deleted");
      loadData();
    }
  };

  // ── User management ──
  const addCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const existing = users.find((u) => u.user_id === user.id);
    if (existing) { showToast("You are already in the list", "err"); return; }
    await supabase.from("user_role_assignments").insert({
      user_id: user.id,
      email: user.email || "",
      display_name: (user.user_metadata?.display_name as string) || "",
      role_id: null,
    });
    showToast("Added current user");
    loadData();
  };

  const saveNewUser = async () => {
    if (!newUser.email.trim()) { showToast("Email is required", "err"); return; }
    setSavingUser(true);
    const { error } = await supabase.from("user_role_assignments").insert({
      email: newUser.email.trim(),
      display_name: newUser.display_name.trim() || null,
      role_id: newUser.role_id ? parseInt(newUser.role_id) : null,
    });
    setSavingUser(false);
    if (error) { showToast("Failed to add user. Email may already exist.", "err"); return; }
    showToast("User added!");
    setShowAddUser(false);
    setNewUser({ email: "", display_name: "", role_id: "" });
    loadData();
  };

  const updateUserRole = async (userId: number, roleId: number | null) => {
    await supabase.from("user_role_assignments").update({ role_id: roleId, updated_at: new Date().toISOString() }).eq("id", userId);
    invalidatePermissionsCache();
    loadData();
    showToast("Role updated!");
  };

  const removeUser = async (userId: number) => {
    await supabase.from("user_role_assignments").delete().eq("id", userId);
    showToast("User removed");
    loadData();
  };

  return (
    <div className="min-h-screen bg-[#F8F8F7] p-4 md:p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 text-white text-sm px-4 py-3 rounded-xl ${toast.type === "ok" ? "bg-gray-900" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-[#0D7377] rounded-xl flex items-center justify-center shrink-0">
            <i className="ri-admin-line text-white text-lg" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              Admin Portal
            </h1>
            <p className="text-sm text-gray-500">Manage user roles and module access permissions</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-6 w-fit max-w-full overflow-x-auto">
        {[
          { id: "roles", label: "Roles & Permissions", icon: "ri-shield-user-line" },
          { id: "users", label: "User Management", icon: "ri-team-line" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as "roles" | "users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === t.id ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <i className={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-60">
          <div className="w-8 h-8 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── ROLES TAB ── */}
          {activeTab === "roles" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{roles.length} roles defined</p>
                <button
                  onClick={openNewRole}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0D7377] text-white rounded-xl text-sm hover:bg-[#0a5f63] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-add-line" />
                  New Role
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <div key={role.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: role.color + "20" }}>
                          <i className={`${role.is_admin ? "ri-shield-star-line" : "ri-shield-user-line"} text-lg`} style={{ color: role.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{role.name}</p>
                          {role.is_admin ? (
                            <span className="text-[10px] font-semibold text-[#0D7377] bg-[#0D7377]/10 px-2 py-0.5 rounded-full">Full Access</span>
                          ) : (
                            <span className="text-[11px] text-gray-400">{role.allowed_modules.length} modules</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openEditRole(role)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 cursor-pointer"
                        >
                          <i className="ri-edit-line text-sm" />
                        </button>
                        <button
                          onClick={() => deleteRole(role.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-400 cursor-pointer"
                        >
                          <i className="ri-delete-bin-line text-sm" />
                        </button>
                      </div>
                    </div>
                    {role.description && (
                      <p className="text-xs text-gray-500 mb-3">{role.description}</p>
                    )}
                    {!role.is_admin && role.allowed_modules.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {role.allowed_modules.slice(0, 6).map((m) => {
                          const mod = ALL_MODULES.find((x) => x.key === m);
                          return mod ? (
                            <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                              <i className={`${mod.icon} text-[9px]`} />
                              {mod.label}
                            </span>
                          ) : null;
                        })}
                        {role.allowed_modules.length > 6 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">+{role.allowed_modules.length - 6} more</span>
                        )}
                      </div>
                    )}
                    {/* User count with this role */}
                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1.5">
                      <i className="ri-user-line text-gray-400 text-xs" />
                      <span className="text-[11px] text-gray-400">
                        {users.filter((u) => u.role_id === role.id).length} user{users.filter((u) => u.role_id === role.id).length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Role form modal */}
              {showRoleForm && (
                <>
                  <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowRoleForm(false)} />
                  <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
                      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h3 className="text-base font-bold text-gray-900">{editingRole ? "Edit Role" : "Create New Role"}</h3>
                        <button onClick={() => setShowRoleForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
                          <i className="ri-close-line" />
                        </button>
                      </div>
                      <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Role Name *</label>
                            <input
                              value={roleForm.name}
                              onChange={(e) => setRoleForm((p) => ({ ...p, name: e.target.value }))}
                              placeholder="e.g. HR Analyst"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0D7377]/30"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Color</label>
                            <div className="flex flex-wrap gap-2">
                              {COLORS.map((c) => (
                                <button
                                  key={c}
                                  onClick={() => setRoleForm((p) => ({ ...p, color: c }))}
                                  className={`w-7 h-7 rounded-lg cursor-pointer transition-all ${roleForm.color === c ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : ""}`}
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Description</label>
                          <input
                            value={roleForm.description}
                            onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Brief description of this role..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0D7377]/30"
                          />
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-[#0D7377]/5 rounded-xl">
                          <input
                            type="checkbox"
                            id="is_admin"
                            checked={roleForm.is_admin}
                            onChange={(e) => setRoleForm((p) => ({ ...p, is_admin: e.target.checked }))}
                            className="w-4 h-4 rounded cursor-pointer accent-[#0D7377]"
                          />
                          <label htmlFor="is_admin" className="text-sm font-medium text-gray-800 cursor-pointer">
                            Super Admin — grant full access to ALL modules
                          </label>
                        </div>

                        {!roleForm.is_admin && (
                          <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Data Visibility Overrides</label>
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                              {SCOPE_OVERRIDES.map((o) => (
                                <div key={o.key} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                                  <input
                                    type="checkbox"
                                    id={o.key}
                                    checked={roleForm[o.key]}
                                    onChange={(e) => setRoleForm((p) => ({ ...p, [o.key]: e.target.checked }))}
                                    className="w-4 h-4 rounded cursor-pointer accent-[#0D7377] shrink-0"
                                  />
                                  <label htmlFor={o.key} className="text-sm font-medium text-gray-800 cursor-pointer">
                                    {o.label}
                                    <span className="block text-xs font-normal text-gray-500 mt-0.5">{o.hint}</span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!roleForm.is_admin && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-xs font-semibold text-gray-600">Module Permissions</label>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setRoleForm((p) => ({ ...p, allowed_modules: ALL_MODULES.map((m) => m.key) }))}
                                  className="text-[11px] text-[#0D7377] font-medium cursor-pointer hover:underline"
                                >Select All</button>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={() => setRoleForm((p) => ({ ...p, allowed_modules: [] }))}
                                  className="text-[11px] text-gray-400 font-medium cursor-pointer hover:underline"
                                >Clear</button>
                              </div>
                            </div>
                            <div className="space-y-4 max-h-64 overflow-y-auto">
                              {MODULE_GROUPS.map((group) => {
                                const groupModules = ALL_MODULES.filter((m) => m.group === group);
                                const allSelected = groupModules.every((m) => roleForm.allowed_modules.includes(m.key));
                                return (
                                  <div key={group}>
                                    <div className="flex items-center gap-2 mb-2">
                                      <button
                                        onClick={() => toggleAllInGroup(group)}
                                        className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${allSelected ? "bg-[#0D7377] border-[#0D7377]" : "border-gray-300"}`}
                                      >
                                        {allSelected && <i className="ri-check-line text-white text-[10px]" />}
                                      </button>
                                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{group}</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pl-2">
                                      {groupModules.map((mod) => {
                                        const selected = roleForm.allowed_modules.includes(mod.key);
                                        return (
                                          <button
                                            key={mod.key}
                                            onClick={() => toggleModule(mod.key)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all cursor-pointer text-left ${
                                              selected ? "bg-[#0D7377]/10 text-[#0D7377]" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                            }`}
                                          >
                                            <i className={`${mod.icon} text-sm shrink-0`} />
                                            <span className="truncate">{mod.label}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => setShowRoleForm(false)}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer"
                          >Cancel</button>
                          <button
                            onClick={saveRole}
                            disabled={savingRole}
                            className="flex items-center gap-2 px-5 py-2 bg-[#0D7377] text-white rounded-lg text-sm hover:bg-[#0a5f63] disabled:opacity-60 cursor-pointer whitespace-nowrap"
                          >
                            {savingRole ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <i className="ri-save-line" />}
                            {editingRole ? "Update Role" : "Create Role"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── USERS TAB ── */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500">{users.length} users assigned</p>
                <div className="flex gap-2">
                  <button
                    onClick={addCurrentUser}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-user-add-line" />
                    Add Me
                  </button>
                  <button
                    onClick={() => setShowAddUser(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0D7377] text-white rounded-xl text-sm hover:bg-[#0a5f63] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-add-line" />
                    Add User
                  </button>
                </div>
              </div>

              {/* Add user form */}
              {showAddUser && (
                <div className="bg-[#0D7377]/5 border border-[#0D7377]/20 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-gray-900 mb-4">Add User</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">Email *</label>
                      <input
                        value={newUser.email}
                        onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                        placeholder="user@company.com"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0D7377]/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">Display Name</label>
                      <input
                        value={newUser.display_name}
                        onChange={(e) => setNewUser((p) => ({ ...p, display_name: e.target.value }))}
                        placeholder="Full name"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0D7377]/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">Assign Role</label>
                      <select
                        value={newUser.role_id}
                        onChange={(e) => setNewUser((p) => ({ ...p, role_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0D7377]/30 cursor-pointer"
                      >
                        <option value="">No role (no access until assigned)</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowAddUser(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">Cancel</button>
                    <button
                      onClick={saveNewUser}
                      disabled={savingUser}
                      className="flex items-center gap-2 px-5 py-2 bg-[#0D7377] text-white rounded-lg text-sm hover:bg-[#0a5f63] disabled:opacity-60 cursor-pointer whitespace-nowrap"
                    >
                      {savingUser ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <i className="ri-user-add-line" />}
                      Add User
                    </button>
                  </div>
                </div>
              )}

              {/* User list */}
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                {users.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <i className="ri-team-line text-3xl mb-2" />
                    <p className="text-sm">No users assigned yet. Click &quot;Add Me&quot; to start.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {users.map((user) => (
                      <div key={user.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                        <div className="w-10 h-10 rounded-xl bg-[#0D7377]/10 flex items-center justify-center text-[#0D7377] text-[12px] font-bold shrink-0">
                          {(user.display_name || user.email).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user.display_name || user.email}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            value={user.role_id || ""}
                            onChange={(e) => updateUserRole(user.id, e.target.value ? parseInt(e.target.value) : null)}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#0D7377]/30 cursor-pointer"
                          >
                            <option value="">No role (no access until assigned)</option>
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                          {user.app_roles && (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white shrink-0"
                              style={{ backgroundColor: user.app_roles.color }}
                            >
                              {user.app_roles.name}
                            </span>
                          )}
                          <button
                            onClick={() => removeUser(user.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-400 cursor-pointer shrink-0"
                          >
                            <i className="ri-delete-bin-line text-sm" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info box */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                <i className="ri-information-line text-amber-500 text-lg shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">How it works</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Users are matched by their account email. You can add a user by email before they sign up — the assignment links automatically the first time they log in. Users with no role assigned have no access until an admin assigns one. Role restrictions determine which modules a user can open, including in the sidebar and navigation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}