import React from "react";

interface LeaveFormActionsProps {
  submitting: boolean;
  isSuperAdmin: boolean;
  formMode?: "self" | "for_employee";
  onExportSlip: () => void;
  onBack: () => void;
}

export function LeaveFormActions({
  submitting,
  isSuperAdmin,
  formMode = "self",
  onExportSlip,
  onBack,
}: LeaveFormActionsProps) {
  const submitLabel = isSuperAdmin
    ? "Save & Approve Direct"
    : formMode === "for_employee"
    ? "Submit Leave for Staff"
    : "Submit Leave Request";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <div className="flex items-center gap-2.5">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          {submitting ? (
            <>
              <i className="ri-loader-4-line animate-spin text-sm" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <i className="ri-save-3-line text-sm" />
              <span>{submitLabel}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onExportSlip}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <i className="ri-printer-line text-sm text-[#253C7D]" />
          <span>Export Leave Form</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onBack}
        disabled={submitting}
        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
      >
        <i className="ri-close-line mr-1" />
        Discard
      </button>
    </div>
  );
}
