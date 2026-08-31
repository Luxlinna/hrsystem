import { PerformanceHeader } from "./components/PerformanceHeader";
import { PerformanceStatsRow } from "./components/PerformanceStatsRow";
import { PerformanceReviewsTab } from "./components/tabs/PerformanceReviewsTab";
import { PerformanceGoalsTab } from "./components/tabs/PerformanceGoalsTab";
import { SubmitReviewTab } from "./components/tabs/SubmitReviewTab";
import { AddGoalModal } from "./components/modals/AddGoalModal";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { usePerformance } from "./hooks/usePerformance";

export default function PerformanceReviews() {
  const {
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    canManage,
    reviews,
    goals,
    employees,
    loading,
    activeTab,
    setActiveTab,
    selectedReview,
    setSelectedReview,
    filterQ,
    setFilterQ,
    filterStatus,
    setFilterStatus,
    filterDept,
    setFilterDept,
    departments,
    avgScore,
    submitted,
    drafts,
    filteredReviews,
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
  } = usePerformance();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFAFA]">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-10">
        <PerformanceHeader
          canManage={false}
          onOpenAddGoal={() => {}}
          onOpenSubmitReview={() => {}}
        />
        <PartnerBranchPrivacyShield
          moduleName="Performance & Appraisals"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="p-6 lg:p-10">
        {/* Header */}
        <PerformanceHeader
          canManage={canManage}
          onOpenAddGoal={() => setShowGoalModal(true)}
          onOpenSubmitReview={() => setActiveTab("submit")}
          activeTab={activeTab}
          reviews={filteredReviews.length > 0 ? filteredReviews : reviews}
          goals={goals}
          employees={employees}
        />

        {/* Stats Row */}
        <PerformanceStatsRow
          totalReviews={reviews.length}
          submitted={submitted}
          drafts={drafts}
          avgScore={avgScore}
        />

        {/* Navigation Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {(canManage
            ? (["reviews", "goals", "submit"] as const)
            : (["reviews", "goals"] as const)
          ).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all capitalize cursor-pointer ${
                activeTab === t ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "submit"
                ? "Submit Review"
                : t === "goals"
                ? "Goals Tracker"
                : canManage
                ? "All Reviews"
                : "My Reviews"}
            </button>
          ))}
        </div>

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <PerformanceReviewsTab
            reviews={filteredReviews}
            selectedReview={selectedReview}
            onSelectReview={setSelectedReview}
            filterQ={filterQ}
            setFilterQ={setFilterQ}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterDept={filterDept}
            setFilterDept={setFilterDept}
            departments={departments}
          />
        )}

        {/* Goals Tab */}
        {activeTab === "goals" && (
          <PerformanceGoalsTab
            goals={goals}
            employees={employees}
            onUpdateProgress={updateGoalProgress}
          />
        )}

        {/* Submit Review Tab */}
        {activeTab === "submit" && canManage && (
          <SubmitReviewTab
            form={reviewForm}
            setForm={setReviewForm}
            employees={employees}
            taskStats={taskStats}
            submitting={submitting}
            onSubmit={handleSubmitReview}
          />
        )}
      </div>

      {/* Add Goal Modal */}
      <AddGoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        form={goalForm}
        setForm={setGoalForm}
        employees={employees}
        submitting={submitting}
        onSubmit={handleAddGoal}
      />
    </div>
  );
}