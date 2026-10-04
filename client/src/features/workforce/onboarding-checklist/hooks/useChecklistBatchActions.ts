import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { OnboardingHire, ChecklistTask } from "../types";
import { STANDARD_TASK_TEMPLATES } from "../constants";

interface UseChecklistBatchActionsProps {
  selectedHire: OnboardingHire | null;
  hireTasks: ChecklistTask[];
  completerName: string;
  loadData: () => Promise<void>;
}

export function useChecklistBatchActions({
  selectedHire,
  hireTasks,
  completerName,
  loadData,
}: UseChecklistBatchActionsProps) {
  const [populatingDefaults, setPopulatingDefaults] = useState(false);

  const handlePopulateDefaultTasks = useCallback(async () => {
    if (!selectedHire) return;
    setPopulatingDefaults(true);

    const existingNames = new Set(hireTasks.map((t) => t.task_name.toLowerCase().trim()));
    const toInsert = STANDARD_TASK_TEMPLATES.filter((tpl) => !existingNames.has(tpl.task_name.toLowerCase().trim())).map(
      (tpl, idx) => ({
        onboarding_request_id: selectedHire.id,
        task_name: tpl.task_name,
        description: tpl.description,
        category: tpl.category,
        priority: tpl.priority,
        sort_order: hireTasks.length + idx + 1,
        completed: false,
      })
    );

    if (toInsert.length === 0) {
      toast("Up to Date", "All standard checklist tasks already exist for this candidate", "info");
      setPopulatingDefaults(false);
      return;
    }

    const { error } = await supabase.from("onboarding_checklist_tasks").insert(toInsert);
    setPopulatingDefaults(false);

    if (error) {
      toast("Error", "Failed to load default checklist tasks", "error");
    } else {
      toast("Checklist Loaded", `Added ${toInsert.length} standard tasks`, "success");
      loadData();
    }
  }, [selectedHire, hireTasks, loadData]);

  const handleMarkAllComplete = useCallback(
    async (categoryKey?: string) => {
      if (!selectedHire) return;
      const targetTasks = hireTasks.filter((t) => (!categoryKey || t.category === categoryKey) && !t.completed);
      if (targetTasks.length === 0) {
        toast("Info", "No pending tasks to mark complete", "info");
        return;
      }

      if (!confirm(`Mark all ${targetTasks.length} pending task(s) as completed?`)) return;
      const ids = targetTasks.map((t) => t.id);
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("onboarding_checklist_tasks")
        .update({ completed: true, completed_at: now, completed_by: completerName })
        .in("id", ids);

      if (error) {
        toast("Error", "Failed to complete tasks", "error");
      } else {
        toast("Completed", `Marked ${targetTasks.length} tasks as completed`, "success");
        loadData();
      }
    },
    [selectedHire, hireTasks, completerName, loadData]
  );

  return {
    populatingDefaults,
    handlePopulateDefaultTasks,
    handleMarkAllComplete,
  };
}
