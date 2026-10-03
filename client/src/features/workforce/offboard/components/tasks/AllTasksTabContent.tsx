import { memo } from "react";
import type { EnrichedOffboardingTask } from "../../types";
import { TASK_TYPE_COLORS } from "../../constants";

interface AllTasksTabContentProps {
  tasks: EnrichedOffboardingTask[];
  onToggleTask: (taskId: string, currentStatus: string) => void;
}

export const AllTasksTabContent = memo(function AllTasksTabContent({
  tasks,
  onToggleTask,
}: AllTasksTabContentProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2">
          <i className="ri-task-line" />
        </div>
        <p className="font-extrabold text-sm text-gray-800">No Exit Tasks Found</p>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No departure checklist tasks match the active filters or search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="px-5 py-3.5 w-10">Status</th>
              <th className="px-5 py-3.5">Task Description</th>
              <th className="px-5 py-3.5">Department Type</th>
              <th className="px-5 py-3.5">Assigned To</th>
              <th className="px-5 py-3.5">Departing Staff</th>
              <th className="px-5 py-3.5">Target Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tasks.map((task) => {
              const isDone = task.status === "completed";
              const typeColor = TASK_TYPE_COLORS[task.type] || TASK_TYPE_COLORS.IT;
              const isOverdue =
                !isDone &&
                task.due_date &&
                new Date(task.due_date + "T00:00:00") < new Date();

              return (
                <tr
                  key={task.id}
                  onClick={() => onToggleTask(task.id, task.status)}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    isDone ? "bg-gray-50/40 opacity-75" : ""
                  }`}
                >
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => {}}
                      className="rounded text-[#253C7D] cursor-pointer"
                    />
                  </td>

                  <td className="px-5 py-3.5 font-bold text-gray-900">
                    <span className={isDone ? "line-through text-gray-400 font-normal" : ""}>
                      {task.title}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border ${typeColor.bg} ${typeColor.text} ${typeColor.border}`}>
                      <i className={typeColor.icon} />
                      {task.type}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 font-medium">
                    {task.assignee}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <p className="font-extrabold text-gray-900 text-xs">{task.employeeName}</p>
                    <p className="text-[10px] text-gray-400">{task.employeeDept}</p>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {task.due_date ? (
                      <span
                        className={`font-bold ${
                          isOverdue ? "text-rose-600 font-black" : "text-gray-700"
                        }`}
                      >
                        {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {isOverdue && " (Overdue)"}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
