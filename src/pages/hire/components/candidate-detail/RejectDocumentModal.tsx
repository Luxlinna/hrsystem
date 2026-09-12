import { useState } from "react";
import { DEFAULT_REJECTION_REASONS } from "../../constants/documentStatusConfig";

interface RejectDocumentModalProps {
  isOpen: boolean;
  slotTitle: string;
  onClose: () => void;
  onConfirmReject: (reason: string) => void;
}

export function RejectDocumentModal({
  isOpen,
  slotTitle,
  onClose,
  onConfirmReject,
}: RejectDocumentModalProps) {
  const [selectedReason, setSelectedReason] = useState(DEFAULT_REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customReason.trim() ? customReason.trim() : selectedReason;
    if (!finalReason) return;
    onConfirmReject(finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-rose-600">
            <i className="ri-close-circle-fill text-xl" />
            <h3 className="font-bold text-sm text-gray-900">Reject Document</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-xs text-gray-600">
            Select or enter the rejection reason for <strong className="text-gray-900">{slotTitle}</strong>. The candidate will be notified to re-upload.
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
              Common Reasons
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_REJECTION_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    setSelectedReason(reason);
                    setCustomReason("");
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    selectedReason === reason && !customReason
                      ? "bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs"
                      : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
              Or Custom Reason / Note
            </label>
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g., Image unclear, corners cut off. Please upload full page."
              className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <i className="ri-close-circle-line text-xs" />
              <span>Confirm Rejection</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
