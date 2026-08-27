import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { TaskActivity } from "../types";

export function useTaskActivities() {
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const fetchActivities = useCallback(async (taskId: string) => {
    setLoadingActivities(true);
    const { data } = await supabase
      .from("task_activities")
      .select(
        "id, task_id, actor_id, action, field, old_value, new_value, created_at, employees(first_name, last_name, avatar_url)"
      )
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (data) setActivities(data as unknown as TaskActivity[]);
    setLoadingActivities(false);
  }, []);

  const logActivity = useCallback(
    async (
      taskId: string,
      actorId: string | null,
      action: TaskActivity["action"],
      field: string,
      oldVal?: string | null,
      newVal?: string | null
    ) => {
      try {
        await supabase.from("task_activities").insert({
          task_id: taskId,
          actor_id: actorId || null,
          action,
          field,
          old_value: oldVal ?? null,
          new_value: newVal ?? null,
        });
      } catch (err) {
        console.error("Failed to log activity:", err);
      }
    },
    []
  );

  return {
    activities,
    loadingActivities,
    fetchActivities,
    logActivity,
  };
}
