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
    <div className="bg-[#253C7D] rounded-2xl px-6 py-4 mb-6 flex items-center justify-between shadow-lg shadow-[#253C7D]/20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <i className="ri-user-follow-line text-white" />
        </div>
        <span className="text-white font-semibold">
          {selectedCount} employee{selectedCount === 1 ? "" : "s"} selected
        </span>
      </div>
      <div className="flex items-center gap-2">
        {canManage && (
          <>
            <button
              onClick={onBulkInvite}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#253C7D] rounded-xl text-sm font-medium hover:bg-[#253C7D]/5 transition-colors cursor-pointer"
            >
              <i className="ri-mail-send-line" />
              Invite All
            </button>
            <button
              onClick={onBulkDelete}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors cursor-pointer"
            >
              <i className="ri-delete-bin-line" />
              Delete All
            </button>
          </>
        )}
        <button
          onClick={onClearSelection}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/30 transition-colors cursor-pointer"
        >
          Clear
        </button>
      </div>
    </div>
  );
});
