import { memo } from "react";

interface CandidateActionsWidgetProps {
  onUpdateStage: (stage: string) => void;
  onDelete: () => void;
}

export const CandidateActionsWidget = memo(function CandidateActionsWidget({
  onUpdateStage,
  onDelete,
}: CandidateActionsWidgetProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-3">
      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-2">
        APPLICATION ACTIONS
      </span>
      <button
        type="button"
        onClick={() => onUpdateStage("hired")}
        className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        <i className="ri-check-line text-sm" /> Mark as Hired
      </button>
      <button
        type="button"
        onClick={() => onUpdateStage("rejected")}
        className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        <i className="ri-close-circle-line text-sm" /> Reject Applicant
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="w-full pt-2 text-center text-xs text-gray-400 hover:text-rose-600 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        <i className="ri-delete-bin-line text-xs" /> Move to Recycle Bin
      </button>
    </div>
  );
});
