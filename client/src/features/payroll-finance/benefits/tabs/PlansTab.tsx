import { memo } from "react";
import type { BenefitPlan, Enrollment, ViewMode } from "../types";
import { PlanFilterBar } from "../components/PlanFilterBar";
import { PlanTableView } from "../components/PlanTableView";
import { PlanCardsView } from "../components/PlanCardsView";

interface PlansTabProps {
  plans: BenefitPlan[];
  filteredPlans: BenefitPlan[];
  enrollments: Enrollment[];
  canManage: boolean;
  viewMode: ViewMode;
  planSearchQuery: string;
  setPlanSearchQuery: (q: string) => void;
  planTypeFilter: string;
  setPlanTypeFilter: (t: string) => void;
  planStatusFilter: string;
  setPlanStatusFilter: (s: string) => void;
  onSelectPlan: (plan: BenefitPlan) => void;
  onOpenEditPlan: (plan: BenefitPlan) => void;
  onDeletePlan: (plan: BenefitPlan) => void;
  onOpenEnrollModal: (planId: string) => void;
  onOpenNewPlanModal: () => void;
}

export const PlansTab = memo(function PlansTab({
  filteredPlans,
  enrollments,
  canManage,
  viewMode,
  planSearchQuery,
  setPlanSearchQuery,
  planTypeFilter,
  setPlanTypeFilter,
  planStatusFilter,
  setPlanStatusFilter,
  onSelectPlan,
  onOpenEditPlan,
  onDeletePlan,
  onOpenEnrollModal,
  onOpenNewPlanModal,
}: PlansTabProps) {
  return (
    <div className="space-y-6">
      <PlanFilterBar
        planSearchQuery={planSearchQuery}
        setPlanSearchQuery={setPlanSearchQuery}
        planTypeFilter={planTypeFilter}
        setPlanTypeFilter={setPlanTypeFilter}
        planStatusFilter={planStatusFilter}
        setPlanStatusFilter={setPlanStatusFilter}
      />

      {filteredPlans.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
            <i className="ri-heart-pulse-line" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Benefit Plans Found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            No benefit programs match your selected search criteria.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={onOpenNewPlanModal}
              className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
            >
              + Create Benefit Plan
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        <PlanTableView
          plans={filteredPlans}
          enrollments={enrollments}
          canManage={canManage}
          onSelectPlan={onSelectPlan}
          onOpenEditPlan={onOpenEditPlan}
          onDeletePlan={onDeletePlan}
          onOpenEnrollModal={onOpenEnrollModal}
        />
      ) : (
        <PlanCardsView
          plans={filteredPlans}
          enrollments={enrollments}
          canManage={canManage}
          onSelectPlan={onSelectPlan}
          onOpenEditPlan={onOpenEditPlan}
          onDeletePlan={onDeletePlan}
          onOpenEnrollModal={onOpenEnrollModal}
        />
      )}
    </div>
  );
});
