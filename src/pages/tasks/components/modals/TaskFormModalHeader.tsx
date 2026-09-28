import { memo } from "react";

interface TaskFormModalHeaderProps {
  isEditing: boolean;
  onClose: () => void;
}

export const TaskFormModalHeader = memo(function TaskFormModalHeader({
  isEditing,
  onClose,
}: TaskFormModalHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800 gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base font-bold bg-[#0284c7]/10 text-[#0284c7]">
          <i className="ri-map-pin-user-line" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-gray-900 dark:text-slate-100">
            {isEditing ? "Edit Mission / Outside Work" : "Create Mission / Outside Work"}
          </h3>
          <p className="text-[11px] text-gray-400">
            Field mission structure with employee details, team members, location GPS &amp; attachments
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
      >
        <i className="ri-close-line text-lg" />
      </button>
    </div>
  );
});
