import { memo } from "react";
import type { DepartmentImpact } from "../../types";
import { MONTHS } from "../../constants";

interface DepartmentImpactWidgetProps {
  departmentStats: DepartmentImpact[];
  month: number;
}

export const DepartmentImpactWidget = memo(function DepartmentImpactWidget({
  departmentStats,
  month,
}: DepartmentImpactWidgetProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-extrabold text-gray-900">
            Department Leave Impact &middot; {MONTHS[month]}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Staff absence load across divisions</p>
        </div>
      </div>

      <div className="space-y-3">
        {departmentStats.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No department data recorded</p>
        ) : (
          departmentStats.slice(0, 5).map((d) => (
            <div key={d.dept} className="p-3 bg-gray-50/70 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-extrabold text-gray-900">{d.dept}</span>
                <span className="font-bold text-gray-600">
                  {d.awayCount} / {d.staffCount} staff ({d.pctAway}%)
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    d.pctAway > 40 ? "bg-rose-500" : d.pctAway > 20 ? "bg-amber-500" : "bg-[#253C7D]"
                  }`}
                  style={{ width: `${d.pctAway}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
