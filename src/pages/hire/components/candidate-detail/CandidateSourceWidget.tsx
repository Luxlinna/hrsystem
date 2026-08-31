import { memo } from "react";

interface CandidateSourceWidgetProps {
  source?: string | null;
}

export const CandidateSourceWidget = memo(function CandidateSourceWidget({
  source,
}: CandidateSourceWidgetProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-2">
      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
        SOURCING CHANNEL
      </span>
      <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
        <i className="ri-share-forward-line text-gray-400 text-sm" />
        <span>{source || "LinkedIn"}</span>
      </div>
    </div>
  );
});
