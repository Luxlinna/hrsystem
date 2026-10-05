import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { invalidatePermissionsCache } from "@/hooks/usePermissions";
import type { AppRole, RoleFormState } from "../types";
import { BLANK_ROLE, SCOPE_OVERRIDES, CATEGORY_PRESETS, ROLE_CATEGORIES, getRoleCategoryKey } from "../constants";

interface UseAdminRoleMutationsProps {
  roles: AppRole[];
  isSuperAdmin: boolean;
  userBranchId?: string | null;
  targetBranch?: string | null;
  selectedBranchId?: string | null;
  showToast: (msg: string, type?: "ok" | "err") => void;
  loadData: () => Promise<void>;
}

export function useAdminRoleMutations({
  roles,
  isSuperAdmin,
  userBranchId,
  targetBranch,
  selectedBranchId,
  showToast,
  loadData,
}: UseAdminRoleMutationsProps) {
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [roleForm, setRoleForm] = useState<RoleFormState>(BLANK_ROLE);
  const [savingRole, setSavingRole] = useState(false);

  const openNewRole = useCallback((defaultCategoryKey?: string | null, defaultBranchId?: string | null, defaultWorkLocationId?: string | null) => {
    setEditingRole(null);
    const catKey = (defaultCategoryKey && ROLE_CATEGORIES.some((c) => c.key === defaultCategoryKey))
      ? defaultCategoryKey
      : "line_manager";
    const preset = CATEGORY_PRESETS[catKey] || CATEGORY_PRESETS.line_manager;

    const initialBranch = !isSuperAdmin
      ? (userBranchId || targetBranch || null)
      : (defaultBranchId !== undefined
          ? defaultBranchId
          : (selectedBranchId && !selectedBranchId.startsWith("site:") && selectedBranchId !== "all"
              ? selectedBranchId
              : null));

    const initialSite = !isSuperAdmin
      ? (defaultWorkLocationId || null)
      : (defaultWorkLocationId !== undefined
          ? defaultWorkLocationId
          : (selectedBranchId && selectedBranchId.startsWith("site:")
              ? selectedBranchId.substring(5)
              : null));

    setRoleForm({
      ...BLANK_ROLE,
      category: catKey,
      color: preset.color,
      is_admin: preset.is_admin,
      allowed_modules: [...preset.allowed_modules],
      description: preset.description,
      branch_id: initialBranch,
      branch_ids: initialBranch ? [initialBranch] : [],
      work_location_id: initialSite,
      ...preset.scopes,
    });
    setShowRoleForm(true);
  }, [isSuperAdmin, userBranchId, targetBranch, selectedBranchId]);

  const openEditRole = useCallback((r: AppRole) => {
    setEditingRole(r);
    const cat = r.category || getRoleCategoryKey(r);
    let bIds = r.branch_ids || [];
    if (!bIds.length && r.branch_id) {
      bIds = r.branch_id.includes(",")
        ? r.branch_id.split(",").map((s) => s.trim()).filter(Boolean)
        : [r.branch_id];
    }
    try {
      const buMap = JSON.parse(localStorage.getItem("hrm_role_bu_map") || "{}");
      if (buMap[r.id] && Array.isArray(buMap[r.id]) && buMap[r.id].length > 0) {
        bIds = buMap[r.id];
      }
    } catch (_e) { /* ignore */ }

    setRoleForm({
      name: r.name,
      category: cat,
      description: r.description || "",
      color: r.color,
      is_admin: r.is_admin,
      branch_id: bIds.length === 1 ? bIds[0] : null,
      branch_ids: bIds,
      work_location_id: r.work_location_id || null,
      allowed_modules: [...r.allowed_modules],
      ...Object.fromEntries(
        SCOPE_OVERRIDES.map((o) => {
          let localVal;
          try {
            const allLocal = JSON.parse(localStorage.getItem("hrm_role_custom_scopes") || "{}");
            localVal = allLocal[r.id]?.[o.key];
          } catch (_e) { /* localStorage may be unavailable in some environments */ }
          return [o.key, r[o.key] ?? localVal ?? false];
        })
      ) as unknown as Omit<RoleFormState, "name" | "category" | "description" | "color" | "is_admin" | "branch_id" | "work_location_id" | "allowed_modules">,
    });
    setShowRoleForm(true);
  }, []);

  const cloneRoleToBU = useCallback((r: AppRole, targetBranchId?: string | null) => {
    setEditingRole(null);
    const effectiveTarget = targetBranchId || (!isSuperAdmin ? (userBranchId || targetBranch) : (selectedBranchId && selectedBranchId !== "all" ? selectedBranchId : null));
    const cat = r.category || getRoleCategoryKey(r);
    setRoleForm({
      name: `${r.name} (${r.branch_name ? "Copy" : "Custom"})`,
      category: cat,
      description: r.description ? `${r.description} (Customized for BU)` : "",
      color: r.color,
      is_admin: false,
      branch_id: effectiveTarget || null,
      branch_ids: effectiveTarget ? [effectiveTarget] : [],
      work_location_id: null,
      allowed_modules: [...r.allowed_modules],
      ...Object.fromEntries(SCOPE_OVERRIDES.map((o) => [o.key, r[o.key]])) as unknown as Omit<RoleFormState, "name" | "category" | "description" | "color" | "is_admin" | "branch_id" | "work_location_id" | "allowed_modules">,
    });
    setShowRoleForm(true);
  }, [isSuperAdmin, userBranchId, targetBranch, selectedBranchId]);

  const saveRole = useCallback(async () => {
    if (!roleForm.name.trim()) {
      showToast("Role name is required", "err");
      return;
    }
    if (!isSuperAdmin && editingRole && (editingRole.is_admin || editingRole.name === "Super Admin")) {
      showToast("Only Super Admin can modify the Super Admin role", "err");
      return;
    }
    if (!isSuperAdmin && editingRole && !editingRole.branch_id) {
      showToast("Global system roles cannot be modified by BU Admin. Use 'Customize for BU' instead.", "err");
      return;
    }
    if (!isSuperAdmin && editingRole && editingRole.branch_id !== userBranchId && editingRole.branch_id !== targetBranch) {
      showToast("You can only modify roles inside your own Business Unit", "err");
      return;
    }

    setSavingRole(true);
    const selectedBUs = roleForm.branch_ids || (roleForm.branch_id ? [roleForm.branch_id] : []);
    const effectiveBranchId = !isSuperAdmin
      ? (userBranchId || targetBranch || null)
      : (selectedBUs.length === 1 ? selectedBUs[0] : null);

    const categoryKey = roleForm.category || "admin";
    const payload = {
      name: roleForm.name.trim(),
      category: categoryKey,
      description: roleForm.description.trim(),
      color: roleForm.color,
      is_admin: isSuperAdmin ? roleForm.is_admin : false,
      branch_id: effectiveBranchId,
      work_location_id: roleForm.work_location_id || null,
      allowed_modules: (isSuperAdmin && roleForm.is_admin) ? ["*"] : roleForm.allowed_modules,
      ...Object.fromEntries(SCOPE_OVERRIDES.map((o) => [o.key, roleForm[o.key]])),
      updated_at: new Date().toISOString(),
    };

    let error;
    let savedRoleId = editingRole?.id;

    if (editingRole) {
      ({ error } = await supabase.from("app_roles").update(payload).eq("id", editingRole.id));
      // If error is about missing columns (e.g. category or specific permissions), retry with base payload
      if (error && error.message?.includes("column")) {
        const fallbackPayload = { ...payload };
        delete (fallbackPayload as any).category;
        delete (fallbackPayload as any).candidate_approval_ceo_sign;
        delete (fallbackPayload as any).candidate_approval_hr_sign;
        delete (fallbackPayload as any).candidate_approval_director_sign;
        delete (fallbackPayload as any).candidate_approval_chairwoman_sign;
        delete (fallbackPayload as any).candidates_manage;
        delete (fallbackPayload as any).leave_manager_endorse;
        delete (fallbackPayload as any).leave_bu_admin_endorse;
        ({ error } = await supabase.from("app_roles").update(fallbackPayload).eq("id", editingRole.id));
      }
    } else {
      let insertRes = await supabase.from("app_roles").insert(payload).select("id").maybeSingle();
      if (insertRes.error && insertRes.error.message?.includes("column")) {
        const fallbackPayload = { ...payload };
        delete (fallbackPayload as any).category;
        delete (fallbackPayload as any).candidate_approval_ceo_sign;
        delete (fallbackPayload as any).candidate_approval_hr_sign;
        delete (fallbackPayload as any).candidate_approval_director_sign;
        delete (fallbackPayload as any).candidate_approval_chairwoman_sign;
        delete (fallbackPayload as any).candidates_manage;
        delete (fallbackPayload as any).leave_manager_endorse;
        delete (fallbackPayload as any).leave_bu_admin_endorse;
        insertRes = await supabase.from("app_roles").insert(fallbackPayload).select("id").maybeSingle();
      }
      error = insertRes.error;
      savedRoleId = insertRes.data?.id;
    }

    if (savedRoleId) {
      try {
        const catMap = JSON.parse(localStorage.getItem("hrm_role_category_map") || "{}");
        catMap[savedRoleId] = categoryKey;
        localStorage.setItem("hrm_role_category_map", JSON.stringify(catMap));
      } catch (_e) { /* ignore */ }

      try {
        const buMap = JSON.parse(localStorage.getItem("hrm_role_bu_map") || "{}");
        buMap[savedRoleId] = selectedBUs;
        localStorage.setItem("hrm_role_bu_map", JSON.stringify(buMap));
      } catch (_e) { /* ignore */ }

      try {
        const allLocal = JSON.parse(localStorage.getItem("hrm_role_custom_scopes") || "{}");
        allLocal[savedRoleId] = {
          ...(allLocal[savedRoleId] || {}),
          candidate_approval_ceo_sign: roleForm.candidate_approval_ceo_sign,
          candidate_approval_hr_sign: roleForm.candidate_approval_hr_sign,
          candidate_approval_director_sign: roleForm.candidate_approval_director_sign,
          candidate_approval_chairwoman_sign: roleForm.candidate_approval_chairwoman_sign,
          candidates_manage: roleForm.candidates_manage,
          leave_manager_endorse: roleForm.leave_manager_endorse,
          leave_bu_admin_endorse: roleForm.leave_bu_admin_endorse,
        };
        localStorage.setItem("hrm_role_custom_scopes", JSON.stringify(allLocal));
      } catch (_e) { /* localStorage may be unavailable in some environments */ }
    }

    setSavingRole(false);
    if (error) {
      showToast(error.message || "Failed to save role", "err");
      return;
    }
    showToast(editingRole ? "Role updated!" : "Role created!");
    setShowRoleForm(false);
    invalidatePermissionsCache();
    loadData();
  }, [roleForm, editingRole, isSuperAdmin, userBranchId, targetBranch, showToast, loadData]);

  const deleteRole = useCallback(async (id: number) => {
    const targetRole = roles.find((r) => r.id === id);
    if (targetRole && (targetRole.is_admin || targetRole.name === "Super Admin")) {
      showToast("The Super Admin role cannot be deleted", "err");
      return;
    }
    if (!isSuperAdmin && targetRole && !targetRole.branch_id) {
      showToast("Global system roles cannot be deleted by BU Admin", "err");
      return;
    }
    if (!isSuperAdmin && targetRole && targetRole.branch_id !== userBranchId && targetRole.branch_id !== targetBranch) {
      showToast("You can only delete roles inside your own Business Unit", "err");
      return;
    }
    const { error } = await supabase.from("app_roles").delete().eq("id", id);
    if (error) {
      showToast(error.message || "Failed to delete role", "err");
      return;
    }

    if (id) {
      try {
        const catMap = JSON.parse(localStorage.getItem("hrm_role_category_map") || "{}");
        delete catMap[id];
        localStorage.setItem("hrm_role_category_map", JSON.stringify(catMap));
      } catch (_e) { /* ignore */ }

      try {
        const buMap = JSON.parse(localStorage.getItem("hrm_role_bu_map") || "{}");
        delete buMap[id];
        localStorage.setItem("hrm_role_bu_map", JSON.stringify(buMap));
      } catch (_e) { /* ignore */ }
    }

    showToast("Role deleted");
    invalidatePermissionsCache();
    loadData();
  }, [roles, isSuperAdmin, userBranchId, targetBranch, showToast, loadData]);

  return {
    editingRole,
    showRoleForm,
    setShowRoleForm,
    roleForm,
    setRoleForm,
    savingRole,
    openNewRole,
    openEditRole,
    cloneRoleToBU,
    saveRole,
    deleteRole,
  };
}
