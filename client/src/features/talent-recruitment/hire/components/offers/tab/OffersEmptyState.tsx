import { memo } from "react";

interface OffersEmptyStateProps {
  onOpenCreateProposal: () => void;
}

export const OffersEmptyState = memo(function OffersEmptyState({
  onOpenCreateProposal,
}: OffersEmptyStateProps) {
  return (
    <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
      <div className="w-16 h-16 rounded-full bg-blue-50 text-[#253C7D] flex items-center justify-center text-3xl mx-auto">
        <i className="ri-mail-check-line" />
      </div>
      <h3 className="text-base font-extrabold text-slate-900">No Offer Letters Found</h3>
      <p className="text-xs text-slate-500 max-w-md mx-auto">
        Generate your first offer letter directly from candidate and requisition records without manual retyping.
      </p>
      <button
        type="button"
        onClick={onOpenCreateProposal}
        className="px-4 py-2 bg-[#253C7D] hover:bg-[#1e3066] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
      >
        <i className="ri-add-line" />
        Create First Salary Proposal
      </button>
    </div>
  );
});
