import { memo } from "react";
import type { BenefitPlan, Enrollment } from "../types";
import { BenefitsExportMenu } from "./BenefitsExportMenu";

interface BenefitsHeaderProps {
  canManage: boolean;
  onExportCSV?: () => void;
  onOpenNewPlanModal: () => void;
  onOpenEnrollModal: () => void;
  tab?: "plans" | "enrollment" | "providers";
  plans?: BenefitPlan[];
  enrollments?: Enrollment[];
}

export const BenefitsHeader = memo(function BenefitsHeader({
  canManage,
  onOpenNewPlanModal,
  onOpenEnrollModal,
  tab = "plans",
  plans = [],
  enrollments = [],
}: BenefitsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Compensation & Perks</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] font-bold">Benefits Administration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          Employee Benefits Hub
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
            Healthcare & Perks
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Manage company health insurance plans, edit benefit programs, track employee coverage, and administer enrollment.
        </p>
      </div>

      {/* Header Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* 3-Format Export Dropdown */}
        <BenefitsExportMenu
          tab={tab}
          plans={plans}
          enrollments={enrollments}
        />

        {canManage && (
          <button
            onClick={onOpenNewPlanModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <i className="ri-add-line text-sm" />
            New Plan
          </button>
        )}

        <button
          onClick={onOpenEnrollModal}
          className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
        >
          <i className="ri-user-add-line text-base font-bold" />
          Enroll Employees
        </button>
      </div>
    </div>
  );
});
