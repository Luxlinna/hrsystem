import { memo } from "react";
import type { Goal, Employee } from "../../types";
import { PerformanceGoalCard } from "./PerformanceGoalCard";

interface PerformanceGoalsTabProps {
  goals: Goal[];
  employees: Employee[];
  onUpdateProgress: (goalId: string, progress: number) => void;
}

export const PerformanceGoalsTab = memo(function PerformanceGoalsTab({
  goals,
  employees,
  onUpdateProgress,
}: PerformanceGoalsTabProps) {
  if (goals.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-2xs">
        <i className="ri-flag-line text-4xl text-gray-200" />
        <p className="text-gray-400 mt-2">No goals yet. Add one to start tracking!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {goals.map((g) => {
        const emp = employees.find((e) => e.id === g.employee_id);
        return (
          <PerformanceGoalCard
            key={g.id}
            goal={g}
            employee={emp}
            onUpdateProgress={onUpdateProgress}
          />
        );
      })}
    </div>
  );
});
