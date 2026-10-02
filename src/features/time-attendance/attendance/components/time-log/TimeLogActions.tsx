import { memo } from "react";

interface TimeLogActionsProps {
  saving: boolean;
  saveMenuOpen: boolean;
  setSaveMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  saveMenuRef: React.RefObject<HTMLDivElement | null>;
  onSave: (andNew?: boolean) => void;
  onDiscard: () => void;
}

export const TimeLogActions = memo(function TimeLogActions({
  saving,
  saveMenuOpen,
  setSaveMenuOpen,
  saveMenuRef,
  onSave,
  onDiscard,
}: TimeLogActionsProps) {
  return (
    <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-100 dark:border-slate-800">
      <div className="flex items-center gap-2.5">
        {/* Modern Split Save Button */}
        <div className="relative inline-flex shadow-xs rounded-xl overflow-hidden" ref={saveMenuRef}>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
          >
            <i className="ri-save-3-line text-sm" />
            <span>{saving ? "Saving Log..." : "Save Time Log"}</span>
          </button>

          <button
            type="button"
            onClick={() => setSaveMenuOpen((p) => !p)}
            disabled={saving}
            className="px-2.5 py-2.5 bg-[#1E3064] hover:bg-[#17254E] text-white text-xs border-l border-white/20 cursor-pointer flex items-center transition-all"
            title="Additional save options"
          >
            <i className="ri-arrow-down-s-line text-xs" />
          </button>

          {saveMenuOpen && (
            <div className="absolute left-0 bottom-full mb-1.5 w-44 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-30 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSaveMenuOpen(false);
                  onSave(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 cursor-pointer flex items-center gap-2 font-medium"
              >
                <i className="ri-check-line text-[#253C7D] dark:text-sky-400" />
                Save &amp; Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSaveMenuOpen(false);
                  onSave(true);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 cursor-pointer flex items-center gap-2 font-medium"
              >
                <i className="ri-add-line text-emerald-600" />
                Save &amp; New
              </button>
            </div>
          )}
        </div>

        {/* Discard Button */}
        <button
          type="button"
          onClick={onDiscard}
          disabled={saving}
          className="px-4 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
        >
          <i className="ri-close-line text-sm text-gray-400" />
          <span>Discard</span>
        </button>
      </div>

      <p className="text-[11px] text-gray-400 hidden sm:block">
        Punch will be recorded into timesheet records
      </p>
    </div>
  );
});
