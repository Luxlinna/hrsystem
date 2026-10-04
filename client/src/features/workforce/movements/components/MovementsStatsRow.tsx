import React from "react";
import type { EmployeeMovement } from "../types";

interface MovementsStatsRowProps {
  movements: EmployeeMovement[];
}

export const MovementsStatsRow: React.FC<MovementsStatsRowProps> = ({ movements }) => {
  const total = movements.length;
  const promotions = movements.filter((m) => m.movement_type === "promote").length;
  const transfers = movements.filter((m) => m.movement_type === "transfer").length;
  const passedProbation = movements.filter((m) => m.movement_type === "pass_probation").length;
  const salaryAdjustments = movements.filter((m) => m.movement_type === "salary_adjustment").length;

  const stats = [
    {
      label: "Total Movements",
      value: total,
      subtext: "All logged transitions",
      icon: "ri-route-line",
      color: "text-[#253C7D] dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
      border: "border-indigo-100 dark:border-indigo-900/50",
    },
    {
      label: "Promotions",
      value: promotions,
      subtext: "Career advancements",
      icon: "ri-arrow-up-circle-line",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40",
      border: "border-purple-100 dark:border-purple-900/50",
    },
    {
      label: "Transfers",
      value: transfers,
      subtext: "Branch / site relocations",
      icon: "ri-arrow-left-right-line",
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/40",
      border: "border-sky-100 dark:border-sky-900/50",
    },
    {
      label: "Passed Probation",
      value: passedProbation,
      subtext: "Permanent confirmations",
      icon: "ri-checkbox-circle-line",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-100 dark:border-emerald-900/50",
    },
    {
      label: "Salary Adjustments",
      value: salaryAdjustments,
      subtext: "Comp & merit revisions",
      icon: "ri-money-dollar-circle-line",
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/40",
      border: "border-teal-100 dark:border-teal-900/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {stats.map((s, idx) => (
        <div
          key={idx}
          className={`p-3.5 rounded-xl border bg-white dark:bg-slate-800 ${s.border} shadow-sm transition-all hover:shadow`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {s.label}
            </span>
            <div className={`w-7 h-7 rounded-lg ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
              <i className={`${s.icon} text-sm`} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white leading-none">
            {s.value}
          </div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 truncate">
            {s.subtext}
          </div>
        </div>
      ))}
    </div>
  );
};
