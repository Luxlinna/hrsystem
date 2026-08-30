import { memo } from "react";

interface ApprovalReviewItemsListProps {
  approvedReqs: string[];
  declinedReqs: string[];
  onToggleReq: (item: string) => void;
  approvedRef: string[];
  declinedRef: string[];
  onToggleRef: (item: string) => void;
}

export const ApprovalReviewItemsList = memo(function ApprovalReviewItemsList({
  approvedReqs,
  declinedReqs,
  onToggleReq,
  approvedRef,
  declinedRef,
  onToggleRef,
}: ApprovalReviewItemsListProps) {
  const allReqs = [...approvedReqs, ...declinedReqs];
  const allRef = [...approvedRef, ...declinedRef];

  return (
    <>
      {allReqs.length > 0 && (
        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Requested Equipment ({allReqs.length})
          </label>
          <div className="space-y-1 bg-gray-50/70 p-2.5 rounded-2xl border border-gray-100">
            {allReqs.map((item) => {
              const isApproved = approvedReqs.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onToggleReq(item)}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                    isApproved
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-gray-100 text-gray-400 line-through"
                  }`}
                >
                  <span>{item}</span>
                  <span className="text-[10px] font-bold">
                    {isApproved ? "✓ Approved" : "✕ Declined"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {allRef.length > 0 && (
        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Refreshments ({allRef.length})
          </label>
          <div className="space-y-1 bg-gray-50/70 p-2.5 rounded-2xl border border-gray-100">
            {allRef.map((item) => {
              const isApproved = approvedRef.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onToggleRef(item)}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                    isApproved
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-gray-100 text-gray-400 line-through"
                  }`}
                >
                  <span>{item}</span>
                  <span className="text-[10px] font-bold">
                    {isApproved ? "✓ Approved" : "✕ Declined"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
});
