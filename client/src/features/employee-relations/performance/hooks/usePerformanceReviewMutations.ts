import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { Review, ReviewForm, TaskStats, Employee } from "../types";
import { MIN_COMMENT_LENGTH } from "../constants";
import { packReviewComment } from "../performanceUtils";
import { notifySelfAssessmentSubmitted, notifyEvaluationCompleted } from "../services/performanceNotificationService";
import type { PerformanceTab } from "./usePerformanceFilters";

interface Props {
  loadData: () => Promise<void>;
  setActiveTab: (tab: PerformanceTab) => void;
  employees?: Employee[];
}

export const DEFAULT_REVIEW_FORM: ReviewForm = {
  employee_id: "", reviewer_id: "", quarter: "Q3", year: new Date().getFullYear(),
  review_type: "Quarterly Review", evaluation_period: "", evaluation_date: new Date().toISOString().split("T")[0],
  quality_of_work_score: 3, quality_of_work_comment: "", productivity_score: 3, productivity_comment: "",
  attendance_score: 3, attendance_comment: "", communication_score: 3, communication_comment: "",
  teamwork_score: 3, teamwork_comment: "", problem_solving_score: 3, problem_solving_comment: "",
  responsibility_score: 3, responsibility_comment: "", initiative_score: 3, initiative_comment: "",
  technical_score: 3, technical_comment: "", goal_achievement_score: 3, goal_achievement_comment: "", leadership_score: 3,
  self_quality_of_work_score: 3, self_productivity_score: 3, self_attendance_score: 3, self_communication_score: 3,
  self_teamwork_score: 3, self_problem_solving_score: 3, self_responsibility_score: 3, self_initiative_score: 3,
  self_technical_score: 3, self_goal_achievement_score: 3,
  key_goals: "", goals_completed: "", major_achievements: "", projects_completed: "",
  skills_to_improve: "", performance_issues: "", recommended_training: "",
  training_required: "", new_skills_to_develop: "", career_development_goals: "", next_period_objectives: "",
  comments: "", strengths: "", areas_for_improvement: "", manager_comments: "",
  employee_comments: "", employee_acknowledged: false, employee_acknowledged_date: "",
};

export function usePerformanceReviewMutations({ loadData, setActiveTab, employees }: Props) {
  const [reviewForm, setReviewForm] = useState<ReviewForm>(DEFAULT_REVIEW_FORM);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);

  useEffect(() => {
    if (!reviewForm.employee_id) { setTaskStats(null); return; }
    let cancelled = false;
    supabase.from("tasks").select("status, due_date").eq("assigned_to", reviewForm.employee_id).is("deleted_at", null)
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
    return () => { cancelled = true; };
  }, [reviewForm.employee_id]);

  const handleSubmitReview = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.employee_id || !reviewForm.reviewer_id) {
      toast("Missing info", "Select both employee and evaluator.", "error"); return;
    }
    if (reviewForm.employee_id === reviewForm.reviewer_id) {
      toast("Invalid reviewer", "Reviewer cannot be the same as employee.", "error"); return;
    }
    if (reviewForm.comments.trim().length < MIN_COMMENT_LENGTH) {
      toast("Comment too short", `Write at least ${MIN_COMMENT_LENGTH} characters.`, "error"); return;
    }

    setSubmittingReview(true);
    const mScores = [
      reviewForm.quality_of_work_score, reviewForm.productivity_score, reviewForm.attendance_score,
      reviewForm.communication_score, reviewForm.teamwork_score, reviewForm.problem_solving_score,
      reviewForm.responsibility_score, reviewForm.initiative_score, reviewForm.technical_score, reviewForm.goal_achievement_score,
    ];
    const overall = mScores.reduce((a, b) => a + b, 0) / mScores.length;
    const packedComments = packReviewComment(reviewForm.comments, { ...reviewForm, status: "submitted" });
    const payload = {
      employee_id: reviewForm.employee_id, reviewer_id: reviewForm.reviewer_id,
      quarter: reviewForm.quarter, year: Number(reviewForm.year),
      overall_score: parseFloat(overall.toFixed(2)),
      communication_score: parseFloat(reviewForm.communication_score.toFixed(2)),
      teamwork_score: parseFloat(reviewForm.teamwork_score.toFixed(2)),
      technical_score: parseFloat(reviewForm.technical_score.toFixed(2)),
      leadership_score: parseFloat(reviewForm.leadership_score.toFixed(2)),
      comments: packedComments, strengths: reviewForm.strengths || "",
      areas_for_improvement: reviewForm.areas_for_improvement || "",
      status: "submitted", submitted_at: new Date().toISOString(),
    };

    const req = reviewForm.id
      ? supabase.from("performance_reviews").update(payload).eq("id", reviewForm.id)
      : supabase.from("performance_reviews").insert(payload);

    const { data: revData, error } = await req.select().single();
    setSubmittingReview(false);
    if (error) { toast("Error", error.message || "Failed to submit evaluation", "error"); return; }
    toast("Success", "Performance evaluation submitted successfully.", "success");
    logActivity({
      module: "performance", action: reviewForm.id ? "updated" : "created",
      entityType: "performance_review", entityId: revData?.id, actorName: "Evaluator", actorRole: "Manager",
      description: `Completed evaluation for ${reviewForm.quarter} ${reviewForm.year}`,
    });

    const emp = employees?.find((x) => x.id === reviewForm.employee_id);
    const mgr = employees?.find((x) => x.id === reviewForm.reviewer_id);
    void notifyEvaluationCompleted({
      reviewId: revData?.id || reviewForm.id, employee: emp, evaluator: mgr, overallScore: overall,
      quarter: reviewForm.quarter, year: Number(reviewForm.year),
      comments: reviewForm.comments || reviewForm.manager_comments, branchId: emp?.branch_id || null,
    });

    setReviewForm(DEFAULT_REVIEW_FORM);
    loadData();
    setActiveTab("reviews");
  }, [reviewForm, loadData, setActiveTab, employees]);

  const handleSelfAssessmentSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.employee_id || !reviewForm.reviewer_id) {
      toast("Missing info", "Select your evaluator / manager.", "error"); return;
    }
    if (reviewForm.employee_id === reviewForm.reviewer_id) {
      toast("Invalid evaluator", "You cannot choose yourself as evaluator.", "error"); return;
    }
    if (!reviewForm.employee_comments.trim()) {
      toast("Reflection required", "Please share your reflections in the employee comments section.", "error"); return;
    }

    setSubmittingReview(true);
    const sScores = [
      reviewForm.self_quality_of_work_score, reviewForm.self_productivity_score, reviewForm.self_attendance_score,
      reviewForm.self_communication_score, reviewForm.self_teamwork_score, reviewForm.self_problem_solving_score,
      reviewForm.self_responsibility_score, reviewForm.self_initiative_score, reviewForm.self_technical_score, reviewForm.self_goal_achievement_score,
    ];
    const selfAvg = sScores.reduce((a, b) => a + b, 0) / sScores.length;
    const packedComments = packReviewComment(reviewForm.employee_comments, {
      ...reviewForm, status: "self_review",
      employee_acknowledged: true, employee_acknowledged_date: new Date().toISOString().split("T")[0],
    });
    const payload = {
      employee_id: reviewForm.employee_id, reviewer_id: reviewForm.reviewer_id,
      quarter: reviewForm.quarter, year: Number(reviewForm.year),
      overall_score: parseFloat(selfAvg.toFixed(2)),
      communication_score: parseFloat(reviewForm.self_communication_score.toFixed(2)),
      teamwork_score: parseFloat(reviewForm.self_teamwork_score.toFixed(2)),
      technical_score: parseFloat(reviewForm.self_technical_score.toFixed(2)),
      leadership_score: 3.0,
      comments: packedComments, strengths: reviewForm.strengths || "",
      areas_for_improvement: reviewForm.areas_for_improvement || "",
      status: "draft", submitted_at: new Date().toISOString(),
    };

    const req = reviewForm.id
      ? supabase.from("performance_reviews").update(payload).eq("id", reviewForm.id)
      : supabase.from("performance_reviews").insert(payload);

    const { data: revData, error } = await req.select().single();
    setSubmittingReview(false);
    if (error) { toast("Error", error.message || "Failed to submit self-assessment", "error"); return; }
    toast("Success", "Self-assessment submitted! Your evaluator can now complete the appraisal.", "success");
    logActivity({
      module: "performance", action: "created",
      entityType: "performance_review", entityId: revData?.id, actorName: "Employee", actorRole: "Staff",
      description: `Submitted self-assessment for ${reviewForm.quarter} ${reviewForm.year}`,
    });

    const sEmp = employees?.find((x) => x.id === reviewForm.employee_id);
    const sMgr = employees?.find((x) => x.id === reviewForm.reviewer_id);
    void notifySelfAssessmentSubmitted({
      reviewId: revData?.id || reviewForm.id, employee: sEmp, evaluator: sMgr, selfScore: selfAvg,
      quarter: reviewForm.quarter, year: Number(reviewForm.year),
      reflection: reviewForm.employee_comments, branchId: sEmp?.branch_id || null,
    });

    setReviewForm(DEFAULT_REVIEW_FORM);
    loadData();
    setActiveTab("reviews");
  }, [reviewForm, loadData, setActiveTab, employees]);

  const handleStartAppraisal = useCallback((review: Review) => {
    setReviewForm({
      ...DEFAULT_REVIEW_FORM, ...review, id: review.id,
      employee_id: review.employee_id, reviewer_id: review.reviewer_id,
      review_type: review.review_type || "Quarterly Review", evaluation_period: review.evaluation_period || "",
      evaluation_date: new Date().toISOString().split("T")[0],
      comments: review.comments || "", strengths: review.strengths || "", areas_for_improvement: review.areas_for_improvement || "",
      manager_comments: review.manager_comments || "", employee_comments: review.employee_comments || "",
      employee_acknowledged: review.employee_acknowledged ?? false, employee_acknowledged_date: review.employee_acknowledged_date || "",
    });
    setActiveTab("submit");
  }, [setActiveTab]);

  return { reviewForm, setReviewForm, submittingReview, taskStats, handleSubmitReview, handleSelfAssessmentSubmit, handleStartAppraisal };
}
