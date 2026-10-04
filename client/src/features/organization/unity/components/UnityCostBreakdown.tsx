import { memo } from "react";
import type { UnityApp } from "../types";
import { categoryColors } from "../constants";

interface UnityCostBreakdownProps {
  apps: UnityApp[];
  totalMonthlyCost: number;
}

export const UnityCostBreakdown = memo(function UnityCostBreakdown({
  apps,
  totalMonthlyCost,
}: UnityCostBreakdownProps) {
  const sortedApps = [...apps].sort((a, b) => Number(b.monthly_cost) - Number(a.monthly_cost));

  return (
    <div className="max-w-3xl">
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-gray-900">Monthly Software Costs</h3>
          <span className="text-[13px] font-bold text-[#253C7D]">Total: ${totalMonthlyCost.toLocaleString()}/mo</span>
        </div>
        <div>
          {sortedApps.map((app) => {
            const pct = totalMonthlyCost > 0 ? (Number(app.monthly_cost) / totalMonthlyCost) * 100 : 0;
            return (
              <div key={app.id} className="px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs" style={{ backgroundColor: app.color }}>
                    <i className={`${app.icon} w-4 h-4 flex items-center justify-center`} />
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900 flex-1">{app.name}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      categoryColors[app.category] || "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {app.category}
                  </span>
                  <span className="text-[13px] font-bold text-gray-900">${Number(app.monthly_cost).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#253C7D]" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-400 w-10 text-right">{pct.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
