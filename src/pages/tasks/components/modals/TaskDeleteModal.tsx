import { memo } from "react";
import type { Task } from "../../types";

interface TaskDeleteModalProps {
  task: Task | null;
  onConfirm: (taskId: string) => void;
  onCancel: () => void;
}

export const TaskDeleteModal = memo(function TaskDeleteModal({
  task,
  onConfirm,
  onCancel,
}: TaskDeleteModalProps) {
  if (!task) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <i className="ri-delete-bin-line text-xl" />
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-900">Delete Task</h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Are you sure you want to move{" "}
            <span className="font-semibold text-gray-800">&ldquo;{task.title}&rdquo;</span> to the recycle bin?
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(task.id)}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Move to Bin
          </button>
        </div>
      </div>
    </div>
  );
});
