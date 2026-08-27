import { memo } from "react";
import type { TaskViewMode } from "../types";

interface TasksHeaderProps {
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    blocked: number;
    overdue: number;
    outside: number;
  };
  viewMode: TaskViewMode;
  setViewMode: (v: TaskViewMode) => void;
  onNewTask: () => void;
}

export const TasksHeader = memo(function TasksHeader({
  stats,
  viewMode,
  setViewMode,
  onNewTask,
}: TasksHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Tasks &amp; Field Work
          </h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#253C7D]/10 text-[#253C7D]">
            {stats.total} {stats.total === 1 ? "task" : "tasks"}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          Assign tasks, track work progression, and log outside GPS check-ins
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* View Switcher */}
        <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1 shadow-2xs">
          {[
            { mode: "board" as const, label: "Board", icon: "ri-layout-masonry-line" },
            { mode: "list" as const, label: "List", icon: "ri-list-check" },
            { mode: "calendar" as const, label: "Calendar", icon: "ri-calendar-line" },
          ].map((item) => (
            <button
              key={item.mode}
              onClick={() => setViewMode(item.mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === item.mode
                  ? "bg-[#253C7D] text-white shadow-2xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <i className={item.icon} />
              {item.label}
            </button>
          ))}
        </div>

        {/* New Task Button */}
        <button
          onClick={onNewTask}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#253C7D] text-white rounded-xl text-xs font-semibold hover:bg-[#1F336A] shadow-sm transition-all cursor-pointer whitespace-nowrap"
        >
          <i className="ri-add-line text-base font-bold" />
          New Task
        </button>
      </div>
    </div>
  );
});
