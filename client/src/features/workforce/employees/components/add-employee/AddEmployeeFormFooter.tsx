import { memo } from "react";

interface AddEmployeeFormFooterProps {
  submitting: boolean;
  onClose: () => void;
  lastSavedAt?: Date | null;
  onClearDraft?: () => void;
  isEdit?: boolean;
}

export const AddEmployeeFormFooter = memo(function AddEmployeeFormFooter({
  submitting,
  onClose,
  lastSavedAt,
  onClearDraft,
  isEdit = false,
}: AddEmployeeFormFooterProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-100">
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {submitting ? (
            <>
              <i className="ri-loader-4-line animate-spin text-sm" />
              <span>Saving Employee...</span>
            </>
          ) : (
            <>
              <i className="ri-save-line text-sm" />
              <span>{isEdit ? "Update Employee" : "Create Employee"}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
        >
          <i className="ri-close-line text-sm" />
          <span>Discard</span>
        </button>
      </div>

      {lastSavedAt && onClearDraft && (
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <i className="ri-check-double-line text-xs" />
            <span>Draft auto-saved</span>
          </span>
          <button
            type="button"
            onClick={onClearDraft}
            className="text-slate-400 hover:text-rose-600 underline cursor-pointer transition-colors"
          >
            Clear draft
          </button>
        </div>
      )}
    </div>
  );
});
