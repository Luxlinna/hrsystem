import { useTasksData } from "./useTasksData";
import { useTaskActivities } from "./useTaskActivities";
import { useTaskFilters } from "./useTaskFilters";
import { useTaskMutations } from "./useTaskMutations";

export function useTasks() {
  const data = useTasksData();
  const activities = useTaskActivities();
  const filters = useTaskFilters(data.tasks);
  const mutations = useTaskMutations({
    currentEmployeeId: data.currentEmployeeId,
    employees: data.employees,
    fetchTasks: data.fetchTasks,
    logActivity: activities.logActivity,
  });

  return {
    ...data,
    ...activities,
    ...filters,
    ...mutations,
  };
}
