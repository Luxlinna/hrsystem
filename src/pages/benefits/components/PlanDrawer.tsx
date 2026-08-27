import { memo } from "react";
import type { BenefitPlan, Enrollment } from "../types";
import { initials } from "../constants";

interface PlanDrawerProps {
  selectedPlan: BenefitPlan | null;
  enrollments: Enrollment[];
  canManage: boolean;
  onClose: () => void;
  onOpenEditPlan: (plan: BenefitPlan) => void;
  onDeletePlan: (plan: BenefitPlan) => void;
  onOpenEnrollModal: (planId: string) => void;
  onToggleEnrollmentStatus: (enrollment: Enrollment) => void;
}

export const PlanDrawer = memo(function PlanDrawer({
  selectedPlan,
  enrollments,
  canManage,
  onClose,
  onOpenEditPlan,
  onDeletePlan,
  onOpenEnrollModal,
  onToggleEnrollmentStatus,
}: PlanDrawerProps) {
  if (!selectedPlan) return null;

  const planEnrollments = enrollments.filter((e) => e.plan_id === selectedPlan.id);
  const enrolledCount = planEnrollments.filter((e) => e.status === "enrolled").length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full sm:w-[500px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        <div>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">{selectedPlan.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedPlan.provider} · {selectedPlan.type}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {canManage && (
                <>
                  <button
                    onClick={() => onOpenEditPlan(selectedPlan)}
                    className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title="Edit Plan"
                  >
                    <i className="ri-edit-line text-base" />
                  </button>
                  <button
                    onClick={() => onDeletePlan(selectedPlan)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Plan"
                  >
                    <i className="ri-delete-bin-line text-base" />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Financial Overview Card */}
            <div className="p-5 bg-gradient-to-r from-[#253C7D] to-[#17254E] rounded-3xl text-white shadow-md">
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block">
                Max Annual Coverage Limit
              </span>
              <p className="text-3xl font-black text-white mt-1">
                ${Number(selectedPlan.coverage_amount || 0).toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-white/80">
                <span>Employee Contrib: ${Number(selectedPlan.employee_contribution || 0).toLocaleString()}/mo</span>
                <span>·</span>
                <span>Seats: {selectedPlan.eligible_count}</span>
              </div>
            </div>

            {selectedPlan.description && (
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Plan Terms & Policy Summary
                </span>
                <p className="text-xs text-gray-700 bg-gray-50 rounded-2xl p-3.5 border border-gray-100 leading-relaxed">
                  {selectedPlan.description}
                </p>
              </div>
            )}

            {/* Enrolled Staff List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Enrolled Team Members ({enrolledCount})
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {planEnrollments.map((e) => {
                  const emp = e.employees;
                  return (
                    <div
                      key={e.id}
                      className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#253C7D] text-white flex items-center justify-center font-bold text-[10px]">
                          {initials(emp?.first_name, emp?.last_name)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {emp?.first_name} {emp?.last_name}
                          </p>
                          <p className="text-[10px] text-gray-400">{emp?.role} · {emp?.department}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => onToggleEnrollmentStatus(e)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                          e.status === "enrolled"
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        }`}
                      >
                        {e.status.replace("_", " ")}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => onOpenEnrollModal(selectedPlan.id)}
            className="flex-1 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
          >
            + Enroll Staff
          </button>
          {canManage && (
            <button
              onClick={() => onOpenEditPlan(selectedPlan)}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Edit Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
