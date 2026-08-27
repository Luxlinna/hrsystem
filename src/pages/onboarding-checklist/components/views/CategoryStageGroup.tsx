import { memo, useState } from "react";
import type { ChecklistTask } from "../../types";
import { CATEGORY_META } from "../../constants";
import { ChecklistTaskItem } from "./ChecklistTaskItem";

interface CategoryStageGroupProps {
  categoryKey: string;
  categoryTasks: ChecklistTask[];
  isLocked: boolean;
  toggling: string | null;
  completerName: string;
  onToggle: (task: ChecklistTask) => void;
  onQuickAssign: (task: ChecklistTask) => void;
  onEdit: (task: ChecklistTask) => void;
  onDelete: (taskId: string) => void;
  onViewDetails: (task: ChecklistTask) => void;
  onMarkAllComplete: (categoryKey: string) => void;
  onOpenAddModal: (categoryKey: string) => void;
}

export const CategoryStageGroup = memo(function CategoryStageGroup({
  categoryKey,
  categoryTasks,
  isLocked,
  toggling,
  completerName,
  onToggle,
  onQuickAssign,
  onEdit,
  onDelete,
  onViewDetails,
  onMarkAllComplete,
  onOpenAddModal,
}: CategoryStageGroupProps) {
  const [open, setOpen] = useState(true);
  const meta = CATEGORY_META[categoryKey] || {
    label: categoryKey,
    icon: "ri-folder-line",
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  };

  const completedCount = categoryTasks.filter((t) => t.completed).length;
  const totalCount = categoryTasks.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
      {/* Category Header */}
      <div
        onClick={() => setOpen(!open)}
        className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 select-none transition-colors border-b border-gray-100"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.text}`}>
            <i className={`${meta.icon} text-lg`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm sm:text-base text-gray-900 truncate">
                {meta.label}
              </h4>
              {isLocked && (
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-gray-100 text-gray-500 border border-gray-200 flex items-center gap-1">
                  <i className="ri-lock-line text-[9px]" /> Locked Step
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {completedCount} of {totalCount} tasks completed ({pct}%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Category Controls */}
          {totalCount > completedCount && !isLocked && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAllComplete(categoryKey);
              }}
              className="px-2.5 py-1 text-[11px] font-bold text-[#253C7D] hover:bg-[#253C7D]/10 rounded-lg transition-colors cursor-pointer hidden sm:inline-block"
            >
              Mark All Done
            </button>
          )}

          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
            <div
              className={`h-full rounded-full transition-all ${
                pct === 100 ? "bg-emerald-500" : "bg-[#253C7D]"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <i className={`ri-arrow-down-s-line text-lg text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Category Task List */}
      {open && (
        <div className="p-4 sm:p-5 space-y-2.5 bg-slate-50/40">
          {categoryTasks.map((task) => (
            <ChecklistTaskItem
              key={task.id}
              task={task}
              isLocked={isLocked}
              toggling={toggling}
              completerName={completerName}
              onToggle={onToggle}
              onQuickAssign={onQuickAssign}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
            />
          ))}

          {categoryTasks.length === 0 && (
            <div className="p-6 text-center text-xs text-gray-400">
              No tasks added in this category yet.
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => onOpenAddModal(categoryKey)}
              disabled={isLocked}
              className="text-xs font-bold text-[#253C7D] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <i className="ri-add-line" />
              Add Task to {meta.label}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
