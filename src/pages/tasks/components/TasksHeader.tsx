import { memo } from "react";

interface TasksHeaderProps {
  onNewTask: () => void;
}

export const TasksHeader = memo(function TasksHeader({
  onNewTask,
}: TasksHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
          <span>Workspace</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D]">Task Management</span>
        </div>

        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Tasks &amp; Workflows
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#253C7D]/10 text-[#253C7D] border border-[#253C7D]/20">
            Live Board
          </span>
        </div>

        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Coordinate assignments, monitor milestone delivery, and track team execution in real-time.
        </p>
      </div>

      <button
        onClick={onNewTask}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-98"
      >
        <i className="ri-add-line text-base font-bold" />
        <span>New Task</span>
      </button>
    </div>
  );
});
