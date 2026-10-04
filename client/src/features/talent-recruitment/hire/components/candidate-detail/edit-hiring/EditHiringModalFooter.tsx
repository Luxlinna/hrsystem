import { memo } from "react";
import { HIRING_STEPS } from "./types";

interface EditHiringModalFooterProps {
  currentStepIndex: number;
  autoSaveEnabled: boolean;
  lastSavedAt: Date | null;
  saving: boolean;
  onPrevStep: () => void;
  onNextStep: () => void;
  onClose: () => void;
}

export const EditHiringModalFooter = memo(function EditHiringModalFooter({
  currentStepIndex,
  autoSaveEnabled,
  lastSavedAt,
  saving,
  onPrevStep,
  onNextStep,
  onClose,
}: EditHiringModalFooterProps) {
  return (
    <div className="px-6 py-3.5 bg-slate-50/95 border-t border-slate-200/80 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span className="px-2.5 py-1 rounded-lg bg-slate-200/70 text-slate-700 font-extrabold text-[11px]">
          Step {currentStepIndex + 1} of 5: {HIRING_STEPS[currentStepIndex].shortLabel}
        </span>
        <span className="hidden sm:inline text-slate-400">•</span>
        {autoSaveEnabled ? (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
            <i className="ri-flashlight-line text-emerald-600" />
            <span>Auto-Save Active</span>
            {lastSavedAt && (
              <span className="text-emerald-600/70 font-normal text-[10px]">
                ({lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })})
              </span>
            )}
          </span>
        ) : (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-500 font-medium bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            <i className="ri-pause-circle-line text-slate-400" />
            <span>Auto-Save Paused (Manual Save Only)</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {currentStepIndex > 0 ? (
          <button
            type="button"
            onClick={onPrevStep}
            disabled={saving}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <i className="ri-arrow-left-s-line text-sm" />
            <span>Previous</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}

        {currentStepIndex < HIRING_STEPS.length - 1 && (
          <button
            type="button"
            onClick={onNextStep}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold text-[#253C7D] bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <span>Next: {HIRING_STEPS[currentStepIndex + 1].shortLabel}</span>
            <i className="ri-arrow-right-s-line text-sm" />
          </button>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <i className="ri-save-line text-sm" />
              <span>Save All Fields</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
});
