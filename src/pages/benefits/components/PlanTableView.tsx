import { memo } from "react";
import type { BenefitPlan, Enrollment } from "../types";
import { PLAN_TYPE_CONFIG } from "../constants";

interface PlanTableViewProps {
  plans: BenefitPlan[];
  enrollments: Enrollment[];
  canManage: boolean;
  onSelectPlan: (plan: BenefitPlan) => void;
  onOpenEditPlan: (plan: BenefitPlan) => void;
  onDeletePlan: (plan: BenefitPlan) => void;
  onOpenEnrollModal: (planId: string) => void;
}

export const PlanTableView = memo(function PlanTableView({
  plans,
  enrollments,
  canManage,
  onSelectPlan,
  onOpenEditPlan,
  onDeletePlan,
  onOpenEnrollModal,
}: PlanTableViewProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="px-5 py-3.5">Benefit Plan</th>
              <th className="px-5 py-3.5">Provider</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Coverage Value</th>
              <th className="px-5 py-3.5">Employee / Mo</th>
              <th className="px-5 py-3.5">Participation Rate</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {plans.map((p) => {
              const typeCfg = PLAN_TYPE_CONFIG[p.type] || PLAN_TYPE_CONFIG.other;
              const enrolledCount = enrollments.filter((e) => e.plan_id === p.id && e.status === "enrolled").length;
              const rate = p.eligible_count > 0 ? ((enrolledCount / p.eligible_count) * 100).toFixed(1) : "0.0";

              return (
                <tr
                  key={p.id}
                  onClick={() => onSelectPlan(p)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${typeCfg.bg} ${typeCfg.color}`}>
                        <i className={typeCfg.icon} />
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors">{p.name}</p>
                        <p className="text-[11px] text-gray-400 truncate max-w-xs">{p.description || "Company sponsored coverage plan"}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="font-bold text-gray-800">{p.provider}</span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${typeCfg.bg} ${typeCfg.color}`}>
                      <i className={typeCfg.icon} />
                      {typeCfg.label}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap font-extrabold text-gray-900">
                    ${Number(p.coverage_amount).toLocaleString()}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-700">
                    ${p.employee_contribution} /mo
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Number(rate))}%` }} />
                      </div>
                      <span className="font-bold text-gray-700 text-[11px]">
                        {rate}% ({enrolledCount}/{p.eligible_count})
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${p.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                      {p.status}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenEnrollModal(p.id)}
                            className="px-2 py-1 bg-[#253C7D]/10 hover:bg-[#253C7D] text-[#253C7D] hover:text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer mr-1"
                          >
                            + Enroll
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenEditPlan(p)}
                            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-[#253C7D] transition-colors cursor-pointer"
                            title="Edit Plan"
                          >
                            <i className="ri-edit-line text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePlan(p)}
                            className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Plan"
                          >
                            <i className="ri-delete-bin-line text-sm" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectPlan(p)}
                        className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <i className="ri-arrow-right-s-line text-base" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
