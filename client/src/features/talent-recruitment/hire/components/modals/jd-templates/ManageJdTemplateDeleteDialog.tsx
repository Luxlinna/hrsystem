import { memo } from "react";

interface ManageJdTemplateDeleteDialogProps {
  deleteConfirmId: string | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}

export const ManageJdTemplateDeleteDialog = memo(function ManageJdTemplateDeleteDialog({
  deleteConfirmId,
  deleting,
  onCancel,
  onConfirm,
}: ManageJdTemplateDeleteDialogProps) {
  if (!deleteConfirmId) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-3">
        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl mx-auto">
          <i className="ri-delete-bin-line" />
        </div>
        <div className="text-center">
          <h4 className="text-sm font-bold text-slate-900">Delete JD Template?</h4>
          <p className="text-xs text-slate-500 mt-1">
            This template will be permanently removed from the JD Library.
          </p>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => onConfirm(deleteConfirmId)}
            className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
});
