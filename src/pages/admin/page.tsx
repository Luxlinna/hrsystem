import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { invalidatePermissionsCache } from "@/hooks/usePermissions";
import { useSearchParams } from "react-router-dom";
import type {
  AdminTab,
  AppRole,
  AuthAccountsResult,
  DirectoryEmployee,
  NewUserState,
  PasswordResetRequest,
  RoleFormState,
  UserAssignment,
} from "./types";
import { BLANK_ROLE, SCOPE_OVERRIDES } from "./constants";
import {
  getInviteError,
  handlePasswordResetEdgeAction,
  listAuthAccounts,
  manageUserRole,
  sendUserInvite,
} from "./api";
import { RolesTab } from "./components/RolesTab";
import { RoleFormModal } from "./components/RoleFormModal";
import { UsersTab } from "./components/UsersTab";
import { PasswordResetsTab } from "./components/PasswordResetsTab";

export default function AdminPortal() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminTab>(
    searchParams.get("tab") === "password-resets" ? "password-resets" : "roles"
  );
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [users, setUsers] = useState<UserAssignment[]>([]);
  const [passwordResetRequests, setPasswordResetRequests] = useState<PasswordResetRequest[]>([]);
  const [actingResetId, setActingResetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [userLoadError, setUserLoadError] = useState<string | null>(null);

  // Role editor state
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [roleForm, setRoleForm] = useState<RoleFormState>(BLANK_ROLE);
  const [savingRole, setSavingRole] = useState(false);

  // User assignment state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState<NewUserState>({ email: "", display_name: "", role_id: "", sendInvite: true });
  const [selectedEmployeeEmail, setSelectedEmployeeEmail] = useState("");
  const [savingUser, setSavingUser] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<DirectoryEmployee[]>([]);
  const [unconfirmedEmails, setUnconfirmedEmails] = useState<Set<string>>(new Set());

  const showToast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setUserLoadError(null);
    const authAccountsPromise = listAuthAccounts().catch((error) => {
      console.warn("Could not fetch Auth accounts:", error);
      return { accounts: [], assignments: null } as AuthAccountsResult;
    });

    const [rolesRes, usersRes, deletedRes, employeesRes, resetRequestsRes, authAccountsResult] = await Promise.all([
      supabase.from("app_roles").select("*").order("id"),
      supabase.from("user_role_assignments").select("*, app_roles(id, name, color)").is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("user_role_assignments").select("email").not("deleted_at", "is", null),
      supabase.from("employees").select("id, email, first_name, last_name, role, department").not("email", "is", null).order("first_name"),
      supabase.from("password_reset_requests").select("id, email, status, requested_at, acted_at").is("deleted_at", null).order("requested_at", { ascending: false }).limit(50),
      authAccountsPromise,
    ]);

    const activeAssignments: UserAssignment[] = (authAccountsResult.assignments || usersRes.data || []).filter((user: any) => !user.deleted_at);
    const activeEmails = new Set(activeAssignments.map((u) => u.email?.toLowerCase()).filter(Boolean));
    const deletedEmails = new Set((deletedRes.data || []).map((u: any) => u.email?.toLowerCase()).filter(Boolean));

    let virtualIdCounter = -1;
    const unassignedAuthUsers: UserAssignment[] = (authAccountsResult.accounts || [])
      .filter((account) => account.email && !activeEmails.has(account.email.toLowerCase()) && !deletedEmails.has(account.email.toLowerCase()))
      .map((account) => {
        activeEmails.add(account.email!.toLowerCase());
        return {
          id: virtualIdCounter--,
          user_id: account.id,
          email: account.email!.toLowerCase(),
          display_name: account.display_name,
          role_id: null,
          created_at: new Date().toISOString(),
          app_roles: null,
        };
      });

    const unconfirmed = new Set<string>(
      (authAccountsResult.accounts || [])
        .filter((a) => a.email && !a.email_confirmed_at && !a.confirmed_at)
        .map((a) => a.email!.toLowerCase())
    );

    setRoles(rolesRes.data || []);
    setUsers([...activeAssignments, ...unassignedAuthUsers]);
    setUnconfirmedEmails(unconfirmed);
    setEmployees(employeesRes.data || []);
    setPasswordResetRequests((resetRequestsRes.data || []) as PasswordResetRequest[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (searchParams.get("tab") === "password-resets") setActiveTab("password-resets");
  }, [searchParams]);

  // Realtime subscription for password reset requests
  useEffect(() => {
    const channel = supabase
      .channel("admin_password_resets")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "password_reset_requests" },
        () => { loadData(); }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "password_reset_requests" },
        () => { loadData(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  // ── Role Actions ──
  const openNewRole = useCallback(() => {
    setEditingRole(null);
    setRoleForm(BLANK_ROLE);
    setShowRoleForm(true);
  }, []);

  const openEditRole = useCallback((r: AppRole) => {
    setEditingRole(r);
    setRoleForm({
      name: r.name,
      description: r.description || "",
      color: r.color,
      is_admin: r.is_admin,
      allowed_modules: [...r.allowed_modules],
      ...Object.fromEntries(SCOPE_OVERRIDES.map((o) => [o.key, r[o.key]])) as unknown as Omit<RoleFormState, "name" | "description" | "color" | "is_admin" | "allowed_modules">,
    });
    setShowRoleForm(true);
  }, []);

  const saveRole = useCallback(async () => {
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
  }, [roleForm, editingRole, showToast, loadData]);

  const deleteRole = useCallback(async (id: number) => {
    const { error } = await supabase.from("app_roles").delete().eq("id", id);
    if (error) { showToast("Failed to delete role", "err"); return; }
    showToast("Role deleted");
    invalidatePermissionsCache();
    loadData();
  }, [showToast, loadData]);

  // ── User Management Actions ──
  const addCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const existing = users.find((u) => u.user_id === user.id);
    if (existing) { showToast("You are already in the list", "err"); return; }
    const { error } = await supabase.from("user_role_assignments").insert({
      user_id: user.id,
      email: user.email || "",
      display_name: (user.user_metadata?.display_name as string) || "",
      role_id: null,
    });
    if (error) { showToast("Failed to add current user", "err"); return; }
    showToast("Added current user");
    loadData();
  }, [users, showToast, loadData]);

  const saveNewUser = useCallback(async () => {
    if (!newUser.email.trim()) { showToast("Email is required", "err"); return; }
    setSavingUser(true);

    if (newUser.sendInvite) {
      try {
        const { res, result } = await sendUserInvite({
          email: newUser.email.trim(),
          display_name: newUser.display_name.trim() || null,
          role_id: newUser.role_id || null,
        });
        setSavingUser(false);
        if (!res.ok || result.error) {
          console.error("Invite failed", { status: res.status, result });
          showToast(getInviteError(result), "err");
          return;
        }
        showToast("Invite sent! User will receive an email to set up their account.");
      } catch (err: any) {
        setSavingUser(false);
        showToast(err.message || "Failed to send invitation", "err");
        return;
      }
    } else {
      const { error } = await supabase.from("user_role_assignments").insert({
        email: newUser.email.trim(),
        display_name: newUser.display_name.trim() || null,
        role_id: newUser.role_id ? parseInt(newUser.role_id) : null,
      });
      setSavingUser(false);
      if (error) { showToast("Failed to add user. Email may already exist.", "err"); return; }
      showToast("User added!");
    }

    setShowAddUser(false);
    setNewUser({ email: "", display_name: "", role_id: "", sendInvite: true });
    setSelectedEmployeeEmail("");
    loadData();
  }, [newUser, showToast, loadData]);

  const resendInvite = useCallback(async (user: UserAssignment) => {
    setInvitingUserId(user.id);
    try {
      const { res, result } = await sendUserInvite({
        email: user.email,
        display_name: user.display_name,
        role_id: user.role_id ? String(user.role_id) : null,
      });
      setInvitingUserId(null);
      if (!res.ok || result.error) {
        console.error("Invite failed", { status: res.status, result });
        showToast(getInviteError(result), "err");
        return;
      }
      showToast("Invite sent!");
    } catch (err: any) {
      setInvitingUserId(null);
      showToast(err.message || "Failed to resend invite", "err");
    }
  }, [showToast]);

  const updateUserRole = useCallback(async (targetUser: UserAssignment, roleId: number | null) => {
    const previousUsers = users;
    const nextRole = roles.find((role) => role.id === roleId) || null;
    setUsers((current) => current.map((user) => user.id === targetUser.id
      ? {
          ...user,
          role_id: roleId,
          app_roles: nextRole ? { id: nextRole.id, name: nextRole.name, color: nextRole.color } : null,
        }
      : user
    ));

    try {
      await manageUserRole("update_role", targetUser.id > 0 ? targetUser.id : null, roleId, targetUser.email, targetUser.display_name);
      invalidatePermissionsCache();
      showToast("Role updated!");
      if (targetUser.id <= 0) {
        loadData();
      }
    } catch (error: any) {
      setUsers(previousUsers);
      showToast(error.message || "Failed to update role", "err");
    }
  }, [users, roles, showToast, loadData]);

  const removeUser = useCallback(async (targetUser: UserAssignment) => {
    const previousUsers = users;
    setUsers((current) => current.filter((user) => user.id !== targetUser.id));

    try {
      await manageUserRole(
        "delete_assignment",
        targetUser.id > 0 ? targetUser.id : null,
        null,
        targetUser.email,
        targetUser.display_name
      );
      showToast("User moved to Recycle Bin");
    } catch (error: any) {
      setUsers(previousUsers);
      showToast(error.message || "Failed to remove user", "err");
    }
  }, [users, showToast]);

  // ── Password Reset Actions ──
  const handlePasswordResetAction = useCallback(async (requestId: string, action: "approve" | "reject") => {
    setActingResetId(requestId);
    try {
      await handlePasswordResetEdgeAction(requestId, action);
      showToast(action === "approve" ? "Reset link sent to user" : "Reset request rejected");
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to update password reset request", "err");
    } finally {
      setActingResetId(null);
    }
  }, [showToast, loadData]);

  const deleteResetRequest = useCallback(async (request: PasswordResetRequest) => {
    if (!confirm(`Move the password reset request for "${request.email}" to the Recycle Bin?`)) return;
    setActingResetId(request.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("password_reset_requests")
        .update({ deleted_at: new Date().toISOString(), deleted_by: user?.email || null })
        .eq("id", request.id);
      if (error) throw new Error(error.message);
      showToast("Moved to Recycle Bin");
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to delete password reset request", "err");
    } finally {
      setActingResetId(null);
    }
  }, [showToast, loadData]);

  const pendingResetCount = useMemo(
    () => passwordResetRequests.filter((r) => r.status === "pending").length,
    [passwordResetRequests]
  );

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
          <div className="w-10 h-10 bg-[#253C7D] rounded-xl flex items-center justify-center shrink-0">
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
          {
            id: "password-resets",
            label: "Password Resets",
            icon: "ri-lock-password-line",
            count: pendingResetCount,
          },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as AdminTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === t.id ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <i className={t.icon} />
            {t.label}
            {"count" in t && (t.count ?? 0) > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === t.id ? "bg-white text-gray-900" : "bg-rose-100 text-rose-700"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-60">
          <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === "roles" && (
            <RolesTab
              roles={roles}
              users={users}
              onOpenNewRole={openNewRole}
              onOpenEditRole={openEditRole}
              onDeleteRole={deleteRole}
            />
          )}

          {activeTab === "users" && (
            <UsersTab
              users={users}
              roles={roles}
              employees={employees}
              unconfirmedEmails={unconfirmedEmails}
              invitingUserId={invitingUserId}
              userLoadError={userLoadError}
              showAddUser={showAddUser}
              setShowAddUser={setShowAddUser}
              newUser={newUser}
              setNewUser={setNewUser}
              selectedEmployeeEmail={selectedEmployeeEmail}
              setSelectedEmployeeEmail={setSelectedEmployeeEmail}
              savingUser={savingUser}
              onAddCurrentUser={addCurrentUser}
              onSaveNewUser={saveNewUser}
              onResendInvite={resendInvite}
              onUpdateUserRole={updateUserRole}
              onRemoveUser={removeUser}
            />
          )}

          {activeTab === "password-resets" && (
            <PasswordResetsTab
              passwordResetRequests={passwordResetRequests}
              actingResetId={actingResetId}
              onRefresh={loadData}
              onDeleteRequest={deleteResetRequest}
              onPasswordResetAction={handlePasswordResetAction}
            />
          )}

          {/* Role Editor Modal */}
          <RoleFormModal
            isOpen={showRoleForm}
            onClose={() => setShowRoleForm(false)}
            editingRole={editingRole}
            roleForm={roleForm}
            setRoleForm={setRoleForm}
            savingRole={savingRole}
            onSaveRole={saveRole}
          />
        </>
      )}
    </div>
  );
}
