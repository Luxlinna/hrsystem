import { memo } from "react";
import { ONBOARDING_DOCUMENT_TEMPLATES } from "@/lib/onboarding";

interface StartOnboardingRequirementsPickerProps {
  selectedDocNames: string[];
  setSelectedDocNames: React.Dispatch<React.SetStateAction<string[]>>;
}

const STAGE_TITLES: Record<string, string> = {
  document: "1. Document Verification",
  it_setup: "2. IT & Hardware Setup",
  training: "3. Orientation & Training",
  complete: "4. Final Sign-off",
};

export const StartOnboardingRequirementsPicker = memo(function StartOnboardingRequirementsPicker({
  selectedDocNames,
  setSelectedDocNames,
}: StartOnboardingRequirementsPickerProps) {
  const selectAll = () => {
    const all: string[] = [];
    Object.values(ONBOARDING_DOCUMENT_TEMPLATES).forEach((list) => all.push(...list));
    setSelectedDocNames(all);
  };

  const clearAll = () => setSelectedDocNames([]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
          Set Up Requirements ({selectedDocNames.length} selected)
        </label>
        <div className="flex items-center gap-2 text-[10px]">
          <button type="button" onClick={selectAll} className="font-bold text-[#253C7D] hover:underline cursor-pointer">
            Select All
          </button>
          <span className="text-gray-300">|</span>
          <button type="button" onClick={clearAll} className="font-bold text-rose-600 hover:underline cursor-pointer">
            Clear All
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50/50 max-h-48 overflow-y-auto space-y-3">
        {Object.entries(ONBOARDING_DOCUMENT_TEMPLATES).map(([stageKey, templates]) => (
          <div key={stageKey}>
            <p className="text-[10px] font-black uppercase text-gray-500 mb-1.5">{STAGE_TITLES[stageKey] || stageKey}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {templates.map((name) => {
                const isChecked = selectedDocNames.includes(name);
                return (
                  <label
                    key={name}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      isChecked ? "bg-white border-blue-200 text-gray-900 font-bold" : "bg-transparent border-gray-200 text-gray-500"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setSelectedDocNames((prev) =>
                          prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
                        );
                      }}
                      className="rounded text-[#253C7D] focus:ring-[#253C7D]"
                    />
                    <span className="truncate">{name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
