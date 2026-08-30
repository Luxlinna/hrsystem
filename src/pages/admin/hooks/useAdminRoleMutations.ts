import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { invalidatePermissionsCache } from "@/hooks/usePermissions";
import type { AppRole, RoleFormState } from "../types";
import { BLANK_ROLE, SCOPE_OVERRIDES } from "../constants";

interface UseAdminRoleMutationsProps {
  roles: AppRole[];
  isSuperAdmin: boolean;
  showToast: (msg: string, type?: "ok" | "err") => void;
  loadData: () => Promise<void>;
}

export function useAdminRoleMutations({
  roles,
  isSuperAdmin,
  showToast,
  loadData,
}: UseAdminRoleMutationsProps) {
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [roleForm, setRoleForm] = useState<RoleFormState>(BLANK_ROLE);
  const [savingRole, setSavingRole] = useState(false);

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
    if (!isSuperAdmin && editingRole && (editingRole.is_admin || editingRole.name === "Super Admin")) {
      showToast("Only Super Admin can modify the Super Admin role", "err");
      return;
    }
    setSavingRole(true);
    const payload = {
      name: roleForm.name.trim(),
      description: roleForm.description.trim(),
      color: roleForm.color,
      is_admin: isSuperAdmin ? roleForm.is_admin : false,
      allowed_modules: (isSuperAdmin && roleForm.is_admin) ? ["*"] : roleForm.allowed_modules,
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
  }, [roleForm, editingRole, isSuperAdmin, showToast, loadData]);

  const deleteRole = useCallback(async (id: number) => {
    const targetRole = roles.find((r) => r.id === id);
    if (targetRole && (targetRole.is_admin || targetRole.name === "Super Admin")) {
      showToast("The Super Admin role cannot be deleted", "err");
      return;
    }
    const { error } = await supabase.from("app_roles").delete().eq("id", id);
    if (error) { showToast("Failed to delete role", "err"); return; }
    showToast("Role deleted");
    invalidatePermissionsCache();
    loadData();
  }, [roles, showToast, loadData]);

  return {
    editingRole,
    showRoleForm,
    setShowRoleForm,
    roleForm,
    setRoleForm,
    savingRole,
    openNewRole,
    openEditRole,
    saveRole,
    deleteRole,
  };
}
