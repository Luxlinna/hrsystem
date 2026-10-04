import { memo } from "react";
import type { Goal, Employee } from "../../types";
import { progressColor } from "../../performanceUtils";

interface PerformanceGoalCardProps {
  goal: Goal;
  employee?: Employee;
  onUpdateProgress: (goalId: string, progress: number) => void;
}

export const PerformanceGoalCard = memo(function PerformanceGoalCard({
  goal: g,
  employee: emp,
  onUpdateProgress,
}: PerformanceGoalCardProps) {
  const isOverdue = g.target_date && new Date(g.target_date) < new Date() && g.status !== "completed";

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-2xs">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-[14px] font-semibold text-gray-900 leading-tight">{g.title}</p>
          {emp && (
            <p className="text-[11px] text-gray-500 mt-1">
              {emp.first_name} {emp.last_name} &middot; {emp.department}
            </p>
          )}
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
            g.status === "completed"
              ? "bg-emerald-50 text-emerald-700"
              : isOverdue
              ? "bg-red-50 text-red-600"
              : "bg-[#253C7D]/10 text-[#253C7D]"
          }`}
        >
          {isOverdue ? "Overdue" : g.status}
        </span>
      </div>

      {g.description && (
        <p className="text-[12px] text-gray-500 mb-3 line-clamp-2">{g.description}</p>
      )}

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-gray-500">Progress</span>
          <span className="text-[12px] font-bold text-gray-700">{g.progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${progressColor(g.progress)} rounded-full transition-all`}
            style={{ width: `${g.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400">
          Due: {g.target_date ? new Date(g.target_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={g.progress}
          onChange={(e) => onUpdateProgress(g.id, parseInt(e.target.value))}
          className="w-20 h-1 accent-[#253C7D] cursor-pointer"
        />
      </div>
    </div>
  );
});
