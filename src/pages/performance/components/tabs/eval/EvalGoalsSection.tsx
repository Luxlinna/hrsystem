import type { Goal } from "../../../types";
import { SectionHeader } from "./EvalHelpers";

interface Props {
  goals: Goal[];
  employeeId: string;
}

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: string }> = {
  completed: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "ri-checkbox-circle-fill" },
  in_progress: { bg: "bg-blue-50", text: "text-blue-500", icon: "ri-loader-2-line" },
  not_started: { bg: "bg-gray-100", text: "text-gray-400", icon: "ri-time-line" },
  overdue: { bg: "bg-red-50", text: "text-red-500", icon: "ri-alarm-warning-line" },
};

export function EvalGoalsSection({ goals, employeeId }: Props) {
  const empGoals = goals.filter((g) => g.employee_id === employeeId);

  if (!employeeId) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="h-1 bg-gradient-to-r from-[#f59e0b] via-[#f97316] to-[#ef4444]" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <SectionHeader number={3} title="Goals & Achievements" icon="ri-trophy-line" />
          <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
            {empGoals.length} goal{empGoals.length !== 1 ? "s" : ""} on record
          </span>
        </div>

        {empGoals.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <i className="ri-flag-line text-3xl mb-2 block" />
            <p className="text-[13px]">No goals set for this employee yet.</p>
            <p className="text-[11px] mt-1">Use the <span className="font-semibold">Goals Tracker</span> tab to add goals first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {empGoals.map((g) => {
              const s = STATUS_STYLE[g.status] ?? STATUS_STYLE["not_started"];
              return (
                <div key={g.id} className="border border-gray-100 rounded-xl p-4 hover:border-amber-200 transition-colors bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-800 truncate">{g.title}</p>
                      {g.description && <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{g.description}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">
                        <i className="ri-calendar-line mr-1" />Target: {g.target_date || "—"}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shrink-0 ${s.bg} ${s.text}`}>
                      <i className={s.icon} />{g.status.replace("_", " ")}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-400">Progress</span>
                      <span className="text-[11px] font-bold text-gray-600">{g.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all"
                        style={{ width: `${g.progress}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 italic">
            <i className="ri-information-line mr-1" />
            These goals are pulled from the Goals Tracker. Review them with the employee during this evaluation.
          </p>
        </div>
      </div>
    </div>
  );
}
