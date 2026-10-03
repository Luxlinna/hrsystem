import type { Goal, Employee } from "../types";
import { usePerformanceGoalMutations } from "./usePerformanceGoalMutations";
import { usePerformanceReviewMutations } from "./usePerformanceReviewMutations";
import type { PerformanceTab } from "./usePerformanceFilters";

interface UsePerformanceMutationsProps {
  loadData: () => Promise<void>;
  setActiveTab: (tab: PerformanceTab) => void;
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  employees?: Employee[];
}

export function usePerformanceMutations({
  loadData,
  setActiveTab,
  setGoals,
  employees,
}: UsePerformanceMutationsProps) {
  const goalMutations = usePerformanceGoalMutations({ loadData, setGoals });
  const reviewMutations = usePerformanceReviewMutations({ loadData, setActiveTab, employees });

  return {
    showGoalModal: goalMutations.showGoalModal,
    setShowGoalModal: goalMutations.setShowGoalModal,
    goalForm: goalMutations.goalForm,
    setGoalForm: goalMutations.setGoalForm,
    reviewForm: reviewMutations.reviewForm,
    setReviewForm: reviewMutations.setReviewForm,
    submitting: goalMutations.submittingGoal || reviewMutations.submittingReview,
    taskStats: reviewMutations.taskStats,
    handleSubmitReview: reviewMutations.handleSubmitReview,
    handleSelfAssessmentSubmit: reviewMutations.handleSelfAssessmentSubmit,
    handleStartAppraisal: reviewMutations.handleStartAppraisal,
    handleAddGoal: goalMutations.handleAddGoal,
    updateGoalProgress: goalMutations.updateGoalProgress,
  };
}
