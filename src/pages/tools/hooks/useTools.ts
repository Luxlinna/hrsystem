import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useToolsData } from "./useToolsData";
import { useToolsFilters } from "./useToolsFilters";
import { useToolsMutations } from "./useToolsMutations";

export function useTools() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const canManage = isAdmin || (Boolean(role) && role.name !== "Chairman");

  const data = useToolsData();
  const filters = useToolsFilters({
    tools: data.tools,
    employees: data.employees,
    assignments: data.assignments,
    usages: data.usages,
  });
  const mutations = useToolsMutations({
    actorName,
    canManage,
    loadData: data.loadData,
    assignments: data.assignments,
  });

  return {
    canManage,
    ...data,
    ...filters,
    ...mutations,
  };
}
