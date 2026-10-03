import type { UserRole } from "@/hooks/usePermissions";

export type DashboardTier = "executive" | "management" | "operations" | "self_service";

const EXECUTIVE_ROLES = ["chairman", "ceo"];
const MANAGEMENT_ROLES = ["admin manager", "department manager", "hr manager"];
const OPERATIONS_ROLES = ["hr staff"];

// Named roles map to a tier explicitly; any future custom role (created via
// the Admin Portal) falls back to a tier inferred from how many modules it
// was granted, so a brand-new role still gets a reasonable dashboard.
export function getDashboardTier(role: UserRole | null): DashboardTier {
  if (!role) return "self_service";
  if (role.is_admin) return "management"; // Super Admin
  const name = role.name.trim().toLowerCase();
  if (EXECUTIVE_ROLES.includes(name)) return "executive";
  if (MANAGEMENT_ROLES.includes(name)) return "management";
  if (OPERATIONS_ROLES.includes(name)) return "operations";
  const moduleCount = role.allowed_modules.length;
  if (moduleCount >= 20) return "management";
  if (moduleCount >= 10) return "operations";
  return "self_service";
}
