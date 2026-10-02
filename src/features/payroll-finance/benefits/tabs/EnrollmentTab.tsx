import { memo } from "react";
import type { BenefitPlan, Enrollment } from "../types";
import { EnrollmentFilterBar } from "../components/EnrollmentFilterBar";
import { EnrollmentTableView } from "../components/EnrollmentTableView";

interface EnrollmentTabProps {
  enrollments: Enrollment[];
  filteredEnrollments: Enrollment[];
  plans: BenefitPlan[];
  departments: string[];
  canManage: boolean;
  enrollSearchQuery: string;
  setEnrollSearchQuery: (q: string) => void;
  enrollPlanFilter: string;
  setEnrollPlanFilter: (p: string) => void;
  enrollStatusFilter: string;
  setEnrollStatusFilter: (s: string) => void;
  enrollDeptFilter: string;
  setEnrollDeptFilter: (d: string) => void;
  onToggleEnrollmentStatus: (enrollment: Enrollment) => void;
  onOpenEnrollModal: () => void;
}

export const EnrollmentTab = memo(function EnrollmentTab({
  filteredEnrollments,
  plans,
  departments,
  canManage,
  enrollSearchQuery,
  setEnrollSearchQuery,
  enrollPlanFilter,
  setEnrollPlanFilter,
  enrollStatusFilter,
  setEnrollStatusFilter,
  enrollDeptFilter,
  setEnrollDeptFilter,
  onToggleEnrollmentStatus,
  onOpenEnrollModal,
}: EnrollmentTabProps) {
  return (
    <div className="space-y-6">
      <EnrollmentFilterBar
        plans={plans}
        departments={departments}
        enrollSearchQuery={enrollSearchQuery}
        setEnrollSearchQuery={setEnrollSearchQuery}
        enrollPlanFilter={enrollPlanFilter}
        setEnrollPlanFilter={setEnrollPlanFilter}
        enrollStatusFilter={enrollStatusFilter}
        setEnrollStatusFilter={setEnrollStatusFilter}
        enrollDeptFilter={enrollDeptFilter}
        setEnrollDeptFilter={setEnrollDeptFilter}
      />

      {filteredEnrollments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
            <i className="ri-user-unfollow-line" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Enrollment Records Found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            No staff members match the selected filters or search query.
          </p>
          <button
            type="button"
            onClick={onOpenEnrollModal}
            className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
          >
            + Enroll Staff Member
          </button>
        </div>
      ) : (
        <EnrollmentTableView
          enrollments={filteredEnrollments}
          canManage={canManage}
          onToggleEnrollmentStatus={onToggleEnrollmentStatus}
        />
      )}
    </div>
  );
});
