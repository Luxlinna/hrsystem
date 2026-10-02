import { useMemo } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";

export function useWarningPermission() {
  const { role, isAdmin } = usePermissions();
  const { isSuperAdmin, isBranchAdmin } = useBranchScope();

  const roleName = (role?.name || "").trim().toLowerCase();
  const isBuCeoAdmin =
    isBranchAdmin ||
    /(branch|bu)\s*.*admin/i.test(roleName) ||
    /(branch|bu)\s*ceo/i.test(roleName) ||
    roleName.includes("bu ceo");

  // Only BU CEO admin and SuperAdmin can view by default, other roles require explicit permission
  const canManageWarningSettings = useMemo(() => {
    if (isSuperAdmin || isAdmin || role?.is_admin || role?.allowed_modules?.includes("*")) {
      return true;
    }
    if (isBuCeoAdmin) {
      return true;
    }
    return Boolean(
      (role as any)?.disciplinary_manage_settings ||
      (role as any)?.warning_manage_settings
    );
  }, [isSuperAdmin, isAdmin, role, isBuCeoAdmin]);

  return {
    canManageWarningSettings,
    isSuperAdmin,
    isBuCeoAdmin,
  };
}
