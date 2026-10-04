import { memo, useState } from "react";

interface CheckoutReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  processing: boolean;
  earlyMinutes?: number;
  isEarly: boolean;
}

export const CheckoutReasonModal = memo(function CheckoutReasonModal({
  isOpen,
  onClose,
  reason,
  onReasonChange,
  onConfirm,
  processing,
  earlyMinutes = 0,
  isEarly,
}: CheckoutReasonModalProps) {
  const [touched, setTouched] = useState(false);

  if (!isOpen) return null;

  const earlyH = Math.floor(earlyMinutes / 60);
  const earlyM = earlyMinutes % 60;
  const earlyTimeStr = earlyH > 0 ? `${earlyH}h ${earlyM}m` : `${earlyM} mins`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (isEarly && !reason.trim()) return;
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
              <i className="ri-alarm-warning-line" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isEarly ? "Early Check Out" : "Confirm Check Out"}
              </h3>
              <p className="text-[12px] text-slate-500">
                {isEarly ? `Leaving ${earlyTimeStr} before shift end` : "End your shift today"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {isEarly && (
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-[12px] text-amber-800 flex items-start gap-2.5">
              <i className="ri-information-fill text-amber-500 text-sm shrink-0 mt-0.5" />
              <span>
                You are checking out before the official work schedule end time. A reason is required for the attendance log.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {isEarly ? "Reason for Early Departure *" : "Optional Note"}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder={isEarly ? "e.g. Doctor appointment, urgent personal task..." : "e.g. Finished daily tasks..."}
              maxLength={300}
              autoFocus
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 transition-all resize-none ${
                isEarly && touched && !reason.trim()
                  ? "border-rose-300 bg-rose-50/30"
                  : "border-slate-200 focus:border-[#253C7D]"
              }`}
            />
            {isEarly && touched && !reason.trim() && (
              <p className="text-[11px] text-rose-500 mt-1">Please provide a reason before checking out.</p>
            )}
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing || (isEarly && !reason.trim())}
              className="flex-1 py-2.5 rounded-xl bg-[#29ABE2] hover:bg-[#2096C7] active:bg-[#1984B2] text-xs font-bold text-white transition-all shadow-md shadow-[#29ABE2]/25 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {processing ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-sm" />
                  <span>Checking Out...</span>
                </>
              ) : (
                <>
                  <i className="ri-logout-box-r-line text-sm" />
                  <span>Confirm Check Out</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
