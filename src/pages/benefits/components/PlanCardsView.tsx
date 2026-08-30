import { memo } from "react";
import type { BenefitPlan, Enrollment } from "../types";
import { PLAN_TYPE_CONFIG } from "../constants";

interface PlanCardsViewProps {
  plans: BenefitPlan[];
  enrollments: Enrollment[];
  canManage: boolean;
  onSelectPlan: (plan: BenefitPlan) => void;
  onOpenEditPlan: (plan: BenefitPlan) => void;
  onDeletePlan: (plan: BenefitPlan) => void;
  onOpenEnrollModal: (planId: string) => void;
}

export const PlanCardsView = memo(function PlanCardsView({
  plans,
  enrollments,
  canManage,
  onSelectPlan,
  onOpenEditPlan,
  onDeletePlan,
  onOpenEnrollModal,
}: PlanCardsViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {plans.map((p) => {
        const typeCfg = PLAN_TYPE_CONFIG[p.type] || PLAN_TYPE_CONFIG.other;
        const enrolledCount = enrollments.filter((e) => e.plan_id === p.id && e.status === "enrolled").length;
        const rate = p.eligible_count > 0 ? ((enrolledCount / p.eligible_count) * 100).toFixed(1) : "0.0";

        return (
          <div
            key={p.id}
            onClick={() => onSelectPlan(p)}
            className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 ${typeCfg.bg} ${typeCfg.color}`}>
                    <i className={typeCfg.icon} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors text-sm">{p.name}</h4>
                    <p className="text-[11px] text-gray-400 font-bold">{p.provider}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${p.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                  {p.status}
                </span>
              </div>

              <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                {p.description || "Comprehensive benefit plan providing corporate subsidized coverage."}
              </p>

              <div className="grid grid-cols-2 gap-2 bg-slate-50/70 p-3 rounded-2xl border border-gray-100 mb-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Coverage Value</span>
                  <p className="font-extrabold text-gray-900 text-sm mt-0.5">${Number(p.coverage_amount).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Employee Cost</span>
                  <p className="font-extrabold text-gray-900 text-sm mt-0.5">${p.employee_contribution} /mo</p>
                </div>
              </div>

              <div className="space-y-1.5 mb-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Participation Rate</span>
                  <span className="font-extrabold text-gray-800">{rate}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Number(rate))}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>{enrolledCount} Enrolled Staff</span>
                  <span>{p.eligible_count} Eligible</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${typeCfg.bg} ${typeCfg.color}`}>
                <i className={typeCfg.icon} />
                {typeCfg.label}
              </span>

              {canManage && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onOpenEnrollModal(p.id)}
                    className="px-2.5 py-1 bg-[#253C7D]/10 hover:bg-[#253C7D] text-[#253C7D] hover:text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer mr-1"
                  >
                    + Enroll
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenEditPlan(p)}
                    className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-[#253C7D] transition-colors cursor-pointer"
                  >
                    <i className="ri-edit-line text-xs" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePlan(p)}
                    className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <i className="ri-delete-bin-line text-xs" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
