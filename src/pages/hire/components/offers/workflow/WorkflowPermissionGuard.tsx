import { memo } from "react";

interface WorkflowPermissionGuardProps {
  effectiveBranchName?: string;
  canSwitchToHr: boolean;
  roleName?: string;
  onSwitchToHr: () => void;
  onClose: () => void;
}

export const WorkflowPermissionGuard = memo(function WorkflowPermissionGuard({
  effectiveBranchName,
  canSwitchToHr,
  roleName,
  onSwitchToHr,
  onClose,
}: WorkflowPermissionGuardProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center text-2xl mx-auto">
          <i className="ri-shield-keyhole-line" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            HR Division Exclusive Permission
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The <strong>HR Manager Review</strong>, <strong>HR Admin Director Authorization</strong>, <strong>Chairwoman Authorization</strong>, and <strong>Offer Issuance</strong> stages are strictly handled by the <strong>HR Division</strong>.
          </p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Your current active scope is <strong>{effectiveBranchName || "Business Unit"}</strong>.
          {canSwitchToHr ? (
            <span className="block mt-1 text-blue-700 dark:text-blue-300 font-semibold">
              You have authorized HR credentials. Click below to switch active scope to HR Division and proceed directly with your review.
            </span>
          ) : (
            <span className="block mt-1 text-rose-600 dark:text-rose-400 font-medium">
              Your account ({roleName || "Standard User"}) is restricted to {effectiveBranchName || "this Business Unit"}. Only HR Division authorized personnel can review this stage.
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {canSwitchToHr && (
            <button
              type="button"
              onClick={onSwitchToHr}
              className="flex-1 py-2.5 bg-[#253C7D] text-white rounded-xl text-xs font-bold hover:bg-[#1e3066] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <i className="ri-arrow-left-right-line" />
              Switch to HR Division &amp; Review
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`${canSwitchToHr ? "px-4" : "w-full"} py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});
