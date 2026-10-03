import { memo } from "react";
import type { PayrollRun } from "../../types";
import { fmtFull } from "../../payrollApprovalUtils";

interface ActionApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionModal: { run: PayrollRun; action: "approve" | "reject" } | null;
  actionNote: string;
  setActionNote: (note: string) => void;
  acting: boolean;
  onConfirm: () => Promise<void>;
}

export const ActionApprovalModal = memo(function ActionApprovalModal({
  isOpen,
  onClose,
  actionModal,
  actionNote,
  setActionNote,
  acting,
  onConfirm,
}: ActionApprovalModalProps) {
  if (!isOpen || !actionModal) return null;

  const isApprove = actionModal.action === "approve";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
                isApprove ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}
            >
              <i className={isApprove ? "ri-checkbox-circle-line text-xl" : "ri-close-circle-line text-xl"} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                {isApprove ? "Sign Off Payroll Run" : "Reject Payroll Run"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {actionModal.run.department} &middot; {actionModal.run.period}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-1.5 mb-4">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Net Amount:</span>
            <span className="font-black text-[#253C7D]">{fmtFull(actionModal.run.total_net)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Employee Headcount:</span>
            <span className="font-bold text-gray-800">{actionModal.run.employee_count} Persons</span>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            {isApprove ? "Approval Remarks (Optional)" : "Reason for Rejection *"}
          </label>
          <textarea
            rows={3}
            required={!isApprove}
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
            placeholder={
              isApprove
                ? "Add executive approval sign-off note..."
                : "Provide specific details on why this batch cannot be authorized..."
            }
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium resize-none"
          />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={acting || (!isApprove && !actionNote.trim())}
            onClick={onConfirm}
            className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
              isApprove ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {acting ? "Recording..." : isApprove ? "Confirm Approval" : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  );
});
