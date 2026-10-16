import React from "react";

interface LeaveFormActionsProps {
  submitting: boolean;
  isSuperAdmin: boolean;
  formMode?: "self" | "for_employee";
  onExportSlip?: () => void;
  onBack?: () => void;
}

export function LeaveFormActions({
  submitting,
  isSuperAdmin,
  formMode = "self",
  onBack,
}: LeaveFormActionsProps) {
  const submitLabel = isSuperAdmin
    ? "Submit & Approve Direct"
    : formMode === "for_employee"
    ? "Submit Leave for Staff"
    : "Submit Leave Request";

  return (
    <div className="pt-1 flex items-center justify-end gap-2 w-full">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex-1 sm:flex-initial px-4 sm:px-5 py-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-[0.99] text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 font-bold rounded-lg text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50 text-center"
        >
          Cancel
        </button>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="flex-[2] sm:flex-initial px-5 sm:px-6 py-2 bg-[#253C7D] hover:bg-[#1e3064] active:scale-[0.99] text-white font-bold rounded-lg text-xs shadow-sm shadow-[#253C7D]/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
      >
        {submitting ? (
          <>
            <i className="ri-loader-4-line animate-spin text-xs" />
            <span>Submitting...</span>
          </>
        ) : (
          <>
            <i className="ri-send-plane-fill text-xs" />
            <span>{submitLabel}</span>
          </>
        )}
      </button>
    </div>
  );
}
