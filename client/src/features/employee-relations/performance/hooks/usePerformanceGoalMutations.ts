import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { Goal, GoalForm } from "../types";

interface UsePerformanceGoalMutationsProps {
  loadData: () => Promise<void>;
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
}

export function usePerformanceGoalMutations({
  loadData,
  setGoals,
}: UsePerformanceGoalMutationsProps) {
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [submittingGoal, setSubmittingGoal] = useState(false);
  const [goalForm, setGoalForm] = useState<GoalForm>({
    employee_id: "",
    title: "",
    description: "",
    target_date: "",
    progress: 0,
    status: "active",
  });

  const handleAddGoal = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!goalForm.employee_id || !goalForm.title.trim()) {
        toast("Missing info", "Select an employee and enter a goal title.", "error");
        return;
      }
      setSubmittingGoal(true);
      const { data: goalData, error } = await supabase
        .from("performance_goals")
        .insert(goalForm)
        .select()
        .single();

      setSubmittingGoal(false);
      if (error) {
        toast("Error", "Failed to add goal", "error");
        return;
      }
      toast("Success", "Goal created successfully.", "success");
      logActivity({
        module: "performance",
        action: "created",
        entityType: "performance_goal",
        entityId: goalData?.id,
        actorName: "Manager",
        actorRole: "Manager",
        description: `Created performance goal "${goalForm.title}"`,
      });
      setGoalForm({
        employee_id: "",
        title: "",
        description: "",
        target_date: "",
        progress: 0,
        status: "active",
      });
      setShowGoalModal(false);
      loadData();
    },
    [goalForm, loadData]
  );

  const updateGoalProgress = useCallback(
    async (goalId: string, progress: number) => {
      const { error } = await supabase
        .from("performance_goals")
        .update({ progress, status: progress >= 100 ? "completed" : "active" })
        .eq("id", goalId);

      if (error) {
        toast("Error", "Failed to update goal progress", "error");
        return;
      }
      logActivity({
        module: "performance",
        action: "updated",
        entityType: "performance_goal",
        entityId: goalId,
        actorName: "Staff",
        actorRole: "Employee",
        description: `Updated performance goal progress to ${progress}%`,
      });
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? { ...g, progress, status: progress >= 100 ? "completed" : "active" }
            : g
        )
      );
    },
    [setGoals]
  );

  return {
    showGoalModal,
    setShowGoalModal,
    goalForm,
    setGoalForm,
    submittingGoal,
    handleAddGoal,
    updateGoalProgress,
  };
}
