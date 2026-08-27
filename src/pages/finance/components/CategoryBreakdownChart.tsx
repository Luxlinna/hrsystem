import { memo } from "react";
import type { CategoryChartItem } from "../types";

interface CategoryBreakdownChartProps {
  categoryChartData: CategoryChartItem[];
  totalAmount: number;
}

export const CategoryBreakdownChart = memo(function CategoryBreakdownChart({
  categoryChartData,
  totalAmount,
}: CategoryBreakdownChartProps) {
  return (
    <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <i className="ri-pie-chart-2-line text-[#253C7D]" />
            Spending by Expense Category
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Operational cost allocation across categories</p>
        </div>
        <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200/60">
          {categoryChartData.length} active categories
        </span>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {categoryChartData.map((item) => {
          const maxVal = categoryChartData[0]?.value || 1;
          const pct = Math.round((item.value / (totalAmount || 1)) * 100);

          return (
            <div key={item.name} className="flex items-center gap-3">
              <div className="w-32 shrink-0 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                <span className="text-xs font-bold text-gray-700 truncate">{item.name}</span>
              </div>

              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.value / maxVal) * 100}%`,
                    backgroundColor: item.fill,
                  }}
                />
              </div>

              <div className="w-24 text-right shrink-0">
                <span className="text-xs font-black text-gray-900">${item.value.toLocaleString()}</span>
                <span className="text-[10px] text-gray-400 font-semibold block">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
