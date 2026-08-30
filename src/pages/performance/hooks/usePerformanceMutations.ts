import type { Goal } from "../types";
import { usePerformanceGoalMutations } from "./usePerformanceGoalMutations";
import { usePerformanceReviewMutations } from "./usePerformanceReviewMutations";

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
  const goalMutations = usePerformanceGoalMutations({ loadData, setGoals });
  const reviewMutations = usePerformanceReviewMutations({ loadData, setActiveTab });

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
    handleAddGoal: goalMutations.handleAddGoal,
    updateGoalProgress: goalMutations.updateGoalProgress,
  };
}
