import { memo } from "react";

interface AddEmployeeFormFooterProps {
  submitting: boolean;
  onClose: () => void;
}

export const AddEmployeeFormFooter = memo(function AddEmployeeFormFooter({
  submitting,
  onClose,
}: AddEmployeeFormFooterProps) {
  return (
    <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer"
      >
        <i className="ri-save-line text-sm" />
        <span>{submitting ? "Saving..." : "Save"}</span>
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
  );
});
