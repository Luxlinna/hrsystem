import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useTrainingData } from "./useTrainingData";
import { useTrainingFilters } from "./useTrainingFilters";
import { useTrainingMutations } from "./useTrainingMutations";

export function useTraining() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin } = usePermissions();
  const canManage = isAdmin || (Boolean(role) && !["Employee", "Staff"].includes(role.name));

  const data = useTrainingData();
  const filters = useTrainingFilters({
    courses: data.courses,
    enrollments: data.enrollments,
  });
  const mutations = useTrainingMutations({
    actorName,
    canManage,
    courses: data.courses,
    employees: data.employees,
    fetchData: data.fetchData,
  });

  return {
    canManage,
    ...data,
    ...filters,
    ...mutations,
  };
}
