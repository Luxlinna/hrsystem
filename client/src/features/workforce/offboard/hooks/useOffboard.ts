import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useOffboardData } from "./useOffboardData";
import { useOffboardFilters } from "./useOffboardFilters";
import { useOffboardMutations } from "./useOffboardMutations";

export function useOffboard() {
  const { user } = useAuth();
  const { role } = usePermissions();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  // 1. Data hook
  const data = useOffboardData((tab) => filters.setTab(tab));

  // 2. Filters hook
  const filters = useOffboardFilters(data.offboardings, data.employees);

  // 3. Mutations hook
  const mutations = useOffboardMutations({
    offboardings: data.offboardings,
    employees: data.employees,
    actorName,
    roleName: role?.name,
    loadData: data.loadData,
  });

  return {
    user,
    role,
    ...data,
    ...filters,
    ...mutations,
  };
}
