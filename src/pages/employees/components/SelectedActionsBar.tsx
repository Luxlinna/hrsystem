import { memo } from "react";

interface SelectedActionsBarProps {
  selectedCount: number;
  canManage: boolean;
  onBulkInvite: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

export const SelectedActionsBar = memo(function SelectedActionsBar({
  selectedCount,
  canManage,
  onBulkInvite,
  onBulkDelete,
  onClearSelection,
}: SelectedActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-[#253C7D]/8 dark:bg-[#253C7D]/20 border border-[#253C7D]/25 dark:border-[#253C7D]/40 rounded px-4 py-2.5 mb-3 flex items-center justify-between">
      {/* Left: count label */}
      <div className="flex items-center gap-2">
        <i className="ri-checkbox-multiple-line text-[#253C7D] dark:text-blue-300 text-sm" />
        <span className="text-xs font-semibold text-[#253C7D] dark:text-blue-200">
          {selectedCount} employee{selectedCount === 1 ? "" : "s"} selected
        </span>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-1.5">
        {canManage && (
          <>
            <button
              onClick={onBulkInvite}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#253C7D]/40 dark:border-blue-400/40 text-[#253C7D] dark:text-blue-300 bg-white dark:bg-slate-800 text-xs font-medium rounded hover:bg-[#253C7D]/5 dark:hover:bg-[#253C7D]/20 transition-colors cursor-pointer"
            >
              <i className="ri-mail-send-line text-xs" />
              Invite All
            </button>
            <button
              onClick={onBulkDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-300 dark:border-rose-500/50 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 text-xs font-medium rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <i className="ri-delete-bin-line text-xs" />
              Delete All
            </button>
          </>
        )}
        <button
          onClick={onClearSelection}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 text-xs font-medium rounded hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
        >
          Clear
        </button>
      </div>
    </div>
  );
});
