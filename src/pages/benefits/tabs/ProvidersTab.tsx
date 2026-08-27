import { memo } from "react";
import type { BenefitPlan, ProviderItem } from "../types";

interface ProvidersTabProps {
  providersList: ProviderItem[];
  onSelectPlan: (plan: BenefitPlan) => void;
}

export const ProvidersTab = memo(function ProvidersTab({
  providersList,
  onSelectPlan,
}: ProvidersTabProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {providersList.map(({ provider, plans: provPlans, enrolledCount }) => (
        <div
          key={provider}
          className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-2xl font-bold shrink-0">
                <i className="ri-building-line" />
              </div>
              <div>
                <h4 className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors text-base">
                  {provider}
                </h4>
                <p className="text-xs text-gray-400">
                  {provPlans.length} Active Plan{provPlans.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-2xl mb-3 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Enrolled Members:</span>
                <span className="font-black text-[#253C7D]">{enrolledCount} Staff</span>
              </div>
            </div>

            {/* Plan chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Underwritten Programs:
              </span>
              {provPlans.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPlan(p)}
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer"
                >
                  <span className="font-bold text-gray-800">{p.name}</span>
                  <span className="text-gray-400 font-semibold">${p.coverage_amount?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
