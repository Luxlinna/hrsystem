import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Goal, ReviewForm, GoalForm, TaskStats } from "../types";
import { MIN_COMMENT_LENGTH } from "../constants";

interface UsePerformanceMutationsProps {
  loadData: () => Promise<void>;
  setActiveTab: (tab: "reviews" | "goals" | "submit") => void;
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
}

export function usePerformanceMutations({
  loadData,
  setActiveTab,
  setGoals,
}: UsePerformanceMutationsProps) {
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState<GoalForm>({
    employee_id: "",
    title: "",
    description: "",
    target_date: "",
    progress: 0,
    status: "active",
  });

  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    employee_id: "",
    reviewer_id: "",
    quarter: "Q2",
    year: 2026,
    communication_score: 3,
    teamwork_score: 3,
    technical_score: 3,
    leadership_score: 3,
    comments: "",
    strengths: "",
    areas_for_improvement: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);

  // Live task record stats lookup
  useEffect(() => {
    if (!reviewForm.employee_id) {
      setTaskStats(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("tasks")
      .select("status, due_date")
      .eq("assigned_to", reviewForm.employee_id)
      .is("deleted_at", null)
      .then(({ data }) => {
        if (cancelled) return;
        const rows = data || [];
        const today = new Date().toISOString().split("T")[0];
        setTaskStats({
          total: rows.length,
          done: rows.filter((r) => r.status === "done").length,
          overdue: rows.filter((r) => r.due_date && r.due_date < today && r.status !== "done").length,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [reviewForm.employee_id]);

  const handleSubmitReview = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!reviewForm.employee_id || !reviewForm.reviewer_id) {
        toast("Missing info", "Select both the employee and the reviewer.", "error");
        return;
      }
      if (reviewForm.employee_id === reviewForm.reviewer_id) {
        toast("Invalid reviewer", "The reviewer can't be the same person as the employee being reviewed.", "error");
        return;
      }
      if (reviewForm.comments.trim().length < MIN_COMMENT_LENGTH) {
        toast(
          "Comment too short",
          `Write a meaningful summary (at least ${MIN_COMMENT_LENGTH} characters) — this review will be visible to the employee.`,
          "error"
        );
        return;
      }

      setSubmitting(true);
      const overall =
        (reviewForm.communication_score +
          reviewForm.teamwork_score +
          reviewForm.technical_score +
          reviewForm.leadership_score) /
        4;

      const { error } = await supabase.from("performance_reviews").insert({
        ...reviewForm,
        overall_score: parseFloat(overall.toFixed(1)),
        status: "submitted",
        submitted_at: new Date().toISOString(),
      });

      setSubmitting(false);
      if (error) {
        toast("Error", "Failed to submit review", "error");
        return;
      }
      setReviewForm({
        employee_id: "",
        reviewer_id: "",
        quarter: "Q2",
        year: 2026,
        communication_score: 3,
        teamwork_score: 3,
        technical_score: 3,
        leadership_score: 3,
        comments: "",
        strengths: "",
        areas_for_improvement: "",
      });
      loadData();
      setActiveTab("reviews");
    },
    [reviewForm, loadData, setActiveTab]
  );

  const handleAddGoal = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!goalForm.employee_id || !goalForm.title.trim()) {
        toast("Missing info", "Select an employee and enter a goal title.", "error");
        return;
      }
      setSubmitting(true);
      const { error } = await supabase.from("performance_goals").insert(goalForm);
      setSubmitting(false);
      if (error) {
        toast("Error", "Failed to add goal", "error");
        return;
      }
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
    reviewForm,
    setReviewForm,
    submitting,
    taskStats,
    handleSubmitReview,
    handleAddGoal,
    updateGoalProgress,
  };
}
