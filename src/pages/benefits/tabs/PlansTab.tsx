import { memo } from "react";
import type { BenefitPlan, Enrollment, ViewMode } from "../types";
import { PLAN_TYPE_CONFIG } from "../constants";

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
  const isFiltered = planSearchQuery || planTypeFilter !== "all" || planStatusFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Quick Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="relative w-full sm:w-64">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={planSearchQuery}
            onChange={(e) => setPlanSearchQuery(e.target.value)}
            placeholder="Search plan name, provider..."
            className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
          />
          {planSearchQuery && (
            <button
              onClick={() => setPlanSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-close-circle-fill text-xs" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filter */}
          <select
            value={planTypeFilter}
            onChange={(e) => setPlanTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold"
          >
            <option value="all">All Benefit Types</option>
            {Object.keys(PLAN_TYPE_CONFIG).map((t) => (
              <option key={t} value={t}>
                {PLAN_TYPE_CONFIG[t].label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={planStatusFilter}
            onChange={(e) => setPlanStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Plans</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Reset */}
          {isFiltered && (
            <button
              onClick={() => {
                setPlanSearchQuery("");
                setPlanTypeFilter("all");
                setPlanStatusFilter("all");
              }}
              title="Reset Filters"
              className="px-2 py-1.5 text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <i className="ri-refresh-line text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* Plans Display */}
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
              onClick={onOpenNewPlanModal}
              className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
            >
              + Create Benefit Plan
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
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
                {filteredPlans.map((p) => {
                  const typeCfg = PLAN_TYPE_CONFIG[p.type] || PLAN_TYPE_CONFIG.other;
                  const enrolledCount = enrollments.filter((e) => e.plan_id === p.id && e.status === "enrolled").length;
                  const rate = p.eligible_count > 0 ? ((enrolledCount / p.eligible_count) * 100).toFixed(1) : "0.0";

                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectPlan(p)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl ${typeCfg.bg} ${typeCfg.color} flex items-center justify-center text-base font-bold shrink-0 shadow-2xs`}
                          >
                            <i className={typeCfg.icon} />
                          </div>
                          <div>
                            <p className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors text-sm">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate max-w-xs">{p.description || p.provider}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-semibold text-gray-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                          {p.provider || "Internal"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-medium text-gray-600 capitalize">
                        {typeCfg.label}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-black text-gray-900">
                        ${Number(p.coverage_amount || 0).toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-700">
                        ${Number(p.employee_contribution || 0).toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#253C7D] rounded-full transition-all"
                              style={{ width: `${Math.min(100, Number(rate))}%` }}
                            />
                          </div>
                          <span className="font-black text-gray-900 text-xs">
                            {enrolledCount}/{p.eligible_count} ({rate}%)
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            p.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          ● {p.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onOpenEnrollModal(p.id)}
                            className="px-2.5 py-1 text-xs font-bold text-[#253C7D] bg-[#253C7D]/10 hover:bg-[#253C7D]/20 rounded-lg transition-colors cursor-pointer"
                          >
                            + Enroll
                          </button>

                          {canManage && (
                            <>
                              <button
                                onClick={() => onOpenEditPlan(p)}
                                className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Plan"
                              >
                                <i className="ri-edit-line text-sm" />
                              </button>

                              <button
                                onClick={() => onDeletePlan(p)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Plan"
                              >
                                <i className="ri-delete-bin-line text-sm" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.map((p) => {
            const typeCfg = PLAN_TYPE_CONFIG[p.type] || PLAN_TYPE_CONFIG.other;
            const enrolledCount = enrollments.filter((e) => e.plan_id === p.id && e.status === "enrolled").length;
            const rate = p.eligible_count > 0 ? ((enrolledCount / p.eligible_count) * 100).toFixed(1) : "0.0";

            return (
              <div
                key={p.id}
                onClick={() => onSelectPlan(p)}
                className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl ${typeCfg.bg} ${typeCfg.color} flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs`}
                      >
                        <i className={typeCfg.icon} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors truncate text-sm">
                          {p.name}
                        </h4>
                        <p className="text-[11px] text-gray-400 truncate">{p.provider || "Internal Plan"}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border shrink-0 ${
                        p.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  {p.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 bg-gray-50 p-2.5 rounded-2xl border border-gray-100 mb-3">
                      {p.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-slate-50 p-2.5 rounded-xl">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Coverage Limit</span>
                      <span className="font-black text-gray-900">${Number(p.coverage_amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Employee / Mo</span>
                      <span className="font-black text-[#253C7D]">${Number(p.employee_contribution || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 text-[11px]">Enrolled Staff</span>
                      <span className="font-bold text-gray-800">
                        {enrolledCount} / {p.eligible_count} ({rate}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#253C7D] rounded-full transition-all"
                        style={{ width: `${Math.min(100, Number(rate))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEnrollModal(p.id);
                    }}
                    className="px-3.5 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    + Enroll Staff
                  </button>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {canManage && (
                      <>
                        <button
                          onClick={() => onOpenEditPlan(p)}
                          className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                          title="Edit Plan"
                        >
                          <i className="ri-edit-line text-sm" />
                        </button>
                        <button
                          onClick={() => onDeletePlan(p)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete Plan"
                        >
                          <i className="ri-delete-bin-line text-sm" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
