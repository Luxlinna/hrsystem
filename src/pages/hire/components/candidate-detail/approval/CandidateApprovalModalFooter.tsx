import { memo } from "react";

interface FooterProps {
  saving: boolean;
  disabled: boolean;
  isCompleted: boolean;
  onSave: () => void;
  onExportPdf: () => void;
  onAdvanceNext: () => void;
  onClose: () => void;
}

export const CandidateApprovalModalFooter = memo(function CandidateApprovalModalFooter({
  saving,
  disabled,
  isCompleted,
  onSave,
  onExportPdf,
  onAdvanceNext,
  onClose,
}: FooterProps) {
  return (
    <div className="p-4 px-6 border-t border-gray-100 bg-white flex items-center justify-between">
      <button
        type="button"
        disabled={saving || disabled}
        onClick={onSave}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
      >
        <i className="ri-save-line" /> {saving ? "Saving..." : "Save Draft"}
      </button>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={onExportPdf}
          className="px-4 py-2 bg-white hover:bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
        >
          <i className="ri-file-pdf-line text-sm text-fuchsia-600" />
          Generate Approval Form (PDF)
        </button>

        {isCompleted ? (
          <button
            type="button"
            onClick={onAdvanceNext}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <i className="ri-check-double-line text-base" />
            Approve & Advance to Salary Negotiation
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#172B4D] hover:bg-[#091E42] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close & Complete Later
          </button>
        )}
      </div>
    </div>
  );
});
