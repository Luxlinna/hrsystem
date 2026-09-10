import { ONBOARDING_DOCUMENT_TEMPLATES } from "@/lib/onboarding";
import { useSetupRequirements } from "./setup-requirements/useSetupRequirements";
import { SetupRequirementsStageSection } from "./setup-requirements/SetupRequirementsStageSection";

interface SetupRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onboardingRequestId: string;
  employeeName: string;
  onSaved?: () => void;
}

export function SetupRequirementsModal({
  isOpen,
  onClose,
  onboardingRequestId,
  employeeName,
  onSaved,
}: SetupRequirementsModalProps) {
  const {
    selectedItems,
    loading,
    saving,
    searchQuery,
    setSearchQuery,
    toggleItem,
    selectAll,
    clearAll,
    toggleStage,
    handleSave,
    totalPossible,
  } = useSetupRequirements(isOpen, onboardingRequestId, employeeName, onClose, onSaved);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-7 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#253C7D]/10 text-[#253C7D] text-sm flex items-center">
                <i className="ri-settings-4-line" />
              </span>
              <h3 className="text-base font-extrabold text-gray-900">Set Up Onboarding Requirements</h3>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Select which requirements are needed for <strong className="text-gray-700">{employeeName}</strong>.
              Only checked requirements will appear in the Onboarding journey & Action Checklist.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Search & Bulk Selection Controls */}
        <div className="py-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100">
          <div className="relative flex-1 min-w-[200px]">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter requirements by name..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#253C7D] focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
              {selectedItems.size} of {totalPossible} selected
            </span>
            <button
              type="button"
              onClick={selectAll}
              className="px-2.5 py-1 text-[11px] font-bold text-[#253C7D] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={clearAll}
              className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Requirements Selection List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-[250px]">
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
              <span>Loading current employee requirements...</span>
            </div>
          ) : (
            Object.entries(ONBOARDING_DOCUMENT_TEMPLATES).map(([stageKey, templates]) => (
              <SetupRequirementsStageSection
                key={stageKey}
                stageKey={stageKey}
                templates={templates}
                searchQuery={searchQuery}
                selectedItems={selectedItems}
                onToggleStage={toggleStage}
                onToggleItem={toggleItem}
              />
            ))
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            {selectedItems.size === 0 ? (
              <span className="text-amber-600 font-bold">⚠️ No requirements selected</span>
            ) : (
              <span>{selectedItems.size} requirements will be set for this employee</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>Save Requirements</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
