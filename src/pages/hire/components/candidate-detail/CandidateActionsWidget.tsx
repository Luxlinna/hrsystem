import { memo } from "react";
import { Link } from "react-router-dom";

interface CandidateActionsWidgetProps {
  currentStage?: string;
  onUpdateStage: (stage: string) => void;
  onDelete: () => void;
}

export const CandidateActionsWidget = memo(function CandidateActionsWidget({
  currentStage,
  onUpdateStage,
  onDelete,
}: CandidateActionsWidgetProps) {
  const isHired = currentStage === "hired";
  const isRejected = currentStage === "rejected";

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-3">
      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-2">
        APPLICATION ACTIONS
      </span>

      {/* When already hired, show the green onboarding status & shortcut */}
      {isHired && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-black text-xs">
            <i className="ri-checkbox-circle-fill text-emerald-600 text-base" /> Candidate Hired
          </div>
          <Link
            to="/onboarding"
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors block"
          >
            <i className="ri-user-received-2-line" /> View in Onboarding
          </Link>
        </div>
      )}

      {/* Show "Mark as Hired" only if not yet hired */}
      {!isHired && (
        <button
          type="button"
          onClick={() => onUpdateStage("hired")}
          className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <i className="ri-check-line text-sm" /> Mark as Hired
        </button>
      )}

      {/* Always keep "Reject Applicant" button (or Reopen if currently rejected) */}
      {isRejected ? (
        <button
          type="button"
          onClick={() => onUpdateStage("screening")}
          className="w-full py-2.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <i className="ri-restart-line text-sm" /> Reopen Application
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onUpdateStage("rejected")}
          className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <i className="ri-close-circle-line text-sm" /> Reject Applicant
        </button>
      )}

      {/* Always keep "Move to Recycle Bin" (Delete) */}
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
