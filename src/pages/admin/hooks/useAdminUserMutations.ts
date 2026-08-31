import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { invalidatePermissionsCache } from "@/hooks/usePermissions";
import type { AppRole, NewUserState, UserAssignment } from "../types";
import { getInviteError, manageUserRole, sendUserInvite } from "../api";

interface UseAdminUserMutationsProps {
  users: UserAssignment[];
  setUsers: React.Dispatch<React.SetStateAction<UserAssignment[]>>;
  roles: AppRole[];
  isSuperAdmin: boolean;
  currentUserEmail?: string;
  showToast: (msg: string, type?: "ok" | "err") => void;
  loadData: () => Promise<void>;
}

export function useAdminUserMutations({
  users,
  setUsers,
  roles,
  isSuperAdmin,
  currentUserEmail,
  showToast,
  loadData,
}: UseAdminUserMutationsProps) {
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState<NewUserState>({ email: "", display_name: "", role_id: "", sendInvite: true });
  const [selectedEmployeeEmail, setSelectedEmployeeEmail] = useState("");
  const [savingUser, setSavingUser] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<number | null>(null);

  const addCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (users.some((u) => u.user_id === user.id)) {
      showToast("You are already in the list", "err");
      return;
    }
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
      const cleanEmail = newUser.email.trim().toLowerCase();
      const roleIdInt = newUser.role_id ? parseInt(newUser.role_id) : null;
      const displayNameStr = newUser.display_name.trim() || null;

      const { data: existing } = await supabase.from("user_role_assignments").select("id").ilike("email", cleanEmail).maybeSingle();
      const { error } = existing
        ? await supabase.from("user_role_assignments").update({ display_name: displayNameStr, role_id: roleIdInt, deleted_at: null, deleted_by: null }).eq("id", existing.id)
        : await supabase.from("user_role_assignments").insert({ email: cleanEmail, display_name: displayNameStr, role_id: roleIdInt });

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
      const { res, result } = await sendUserInvite({ email: user.email, display_name: user.display_name, role_id: user.role_id ? String(user.role_id) : null });
      setInvitingUserId(null);
      if (!res.ok || result.error) { showToast(getInviteError(result), "err"); return; }
      showToast("Invite sent!");
    } catch (err: any) {
      setInvitingUserId(null);
      showToast(err.message || "Failed to resend invite", "err");
    }
  }, [showToast]);

  const updateUserRole = useCallback(async (targetUser: UserAssignment, roleId: number | null) => {
    const targetIsSuper = targetUser.app_roles?.is_admin || targetUser.app_roles?.name === "Super Admin";
    if (!isSuperAdmin && targetIsSuper) { showToast("Only Super Admin can modify Super Admin accounts", "err"); return; }
    const nextRole = roles.find((role) => role.id === roleId) || null;
    if (!isSuperAdmin && nextRole?.is_admin) { showToast("Branch Admin cannot assign Super Admin role", "err"); return; }

    const previousUsers = users;
    setUsers((cur) => cur.map((u) => u.id === targetUser.id ? { ...u, role_id: roleId, app_roles: nextRole ? { id: nextRole.id, name: nextRole.name, color: nextRole.color, is_admin: nextRole.is_admin } : null } : u));

    try {
      await manageUserRole("update_role", targetUser.id > 0 ? targetUser.id : null, roleId, targetUser.email, targetUser.display_name);
      invalidatePermissionsCache();
      showToast("Role updated!");
      if (targetUser.id <= 0) loadData();
    } catch (error: any) {
      setUsers(previousUsers);
      showToast(error.message || "Failed to update role", "err");
    }
  }, [users, roles, isSuperAdmin, setUsers, showToast, loadData]);

  const removeUser = useCallback(async (targetUser: UserAssignment) => {
    if (!isSuperAdmin && (targetUser.app_roles?.is_admin || targetUser.app_roles?.name === "Super Admin")) {
      showToast("Only Super Admin can remove Super Admin accounts", "err");
      return;
    }
    const previousUsers = users;
    setUsers((cur) => cur.filter((u) => u.id !== targetUser.id));

    try {
      try {
        await manageUserRole("delete_assignment", targetUser.id > 0 ? targetUser.id : null, null, targetUser.email, targetUser.display_name);
      } catch (edgeErr) {
        console.warn("manageUserRole edge call failed, attempting direct DB update:", edgeErr);
        const now = new Date().toISOString();
        const query = supabase.from("user_role_assignments").update({ deleted_at: now, deleted_by: currentUserEmail || "Admin" });
        const { error: dbErr } = targetUser.id > 0
          ? await query.eq("id", targetUser.id)
          : await query.ilike("email", targetUser.email || "");
        if (dbErr) {
          throw new Error(dbErr.message || (edgeErr as any)?.message || "Failed to remove user");
        }
      }
      showToast("User moved to Recycle Bin");
      loadData();
    } catch (error: any) {
      setUsers(previousUsers);
      showToast(error.message || "Failed to remove user", "err");
    }
  }, [users, isSuperAdmin, setUsers, currentUserEmail, showToast, loadData]);

  return {
    showAddUser,
    setShowAddUser,
    newUser,
    setNewUser,
    selectedEmployeeEmail,
    setSelectedEmployeeEmail,
    savingUser,
    invitingUserId,
    addCurrentUser,
    saveNewUser,
    resendInvite,
    updateUserRole,
    removeUser,
  };
}
