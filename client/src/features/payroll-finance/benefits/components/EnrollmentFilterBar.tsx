import { memo } from "react";
import type { BenefitPlan } from "../types";

interface EnrollmentFilterBarProps {
  plans: BenefitPlan[];
  departments: string[];
  enrollSearchQuery: string;
  setEnrollSearchQuery: (q: string) => void;
  enrollPlanFilter: string;
  setEnrollPlanFilter: (p: string) => void;
  enrollStatusFilter: string;
  setEnrollStatusFilter: (s: string) => void;
  enrollDeptFilter: string;
  setEnrollDeptFilter: (d: string) => void;
}

export const EnrollmentFilterBar = memo(function EnrollmentFilterBar({
  plans,
  departments,
  enrollSearchQuery,
  setEnrollSearchQuery,
  enrollPlanFilter,
  setEnrollPlanFilter,
  enrollStatusFilter,
  setEnrollStatusFilter,
  enrollDeptFilter,
  setEnrollDeptFilter,
}: EnrollmentFilterBarProps) {
  const isFiltered =
    enrollSearchQuery ||
    enrollPlanFilter !== "all" ||
    enrollStatusFilter !== "all" ||
    enrollDeptFilter !== "all";

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
      <div className="relative w-full sm:w-64">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          value={enrollSearchQuery}
          onChange={(e) => setEnrollSearchQuery(e.target.value)}
          placeholder="Search staff, role, plan..."
          className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
        />
        {enrollSearchQuery && (
          <button
            type="button"
            onClick={() => setEnrollSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-circle-fill text-xs" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={enrollPlanFilter}
          onChange={(e) => setEnrollPlanFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold max-w-[150px] truncate"
        >
          <option value="all">All Benefit Plans</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={enrollStatusFilter}
          onChange={(e) => setEnrollStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
        >
          <option value="all">All Statuses</option>
          <option value="enrolled">Enrolled Active</option>
          <option value="opted_out">Opted Out</option>
        </select>

        <select
          value={enrollDeptFilter}
          onChange={(e) => setEnrollDeptFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[130px] truncate font-medium"
        >
          {departments.map((d) => (
            <option key={d} value={d === "All Departments" ? "all" : d}>{d}</option>
          ))}
        </select>

        {isFiltered && (
          <button
            type="button"
            onClick={() => {
              setEnrollSearchQuery("");
              setEnrollPlanFilter("all");
              setEnrollStatusFilter("all");
              setEnrollDeptFilter("all");
            }}
            title="Reset Filters"
            className="px-2 py-1.5 text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <i className="ri-refresh-line text-sm" />
          </button>
        )}
      </div>
    </div>
  );
});
