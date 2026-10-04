import { memo } from "react";
import { DOC_TO_TASK } from "@/lib/onboarding";

const STAGE_LABELS: Record<string, { label: string; icon: string; desc: string }> = {
  document: {
    label: "Document Verification",
    icon: "ri-file-shield-line",
    desc: "Legal compliance, contracts & identity credentials",
  },
  it_setup: {
    label: "IT & Hardware Setup",
    icon: "ri-macbook-line",
    desc: "Workstation hardware, corporate credentials & access",
  },
  training: {
    label: "Orientation & Training",
    icon: "ri-book-open-line",
    desc: "Company policies, team introductions & role roadmap",
  },
  complete: {
    label: "Final Sign-off & Culture",
    icon: "ri-flag-line",
    desc: "Milestone sign-offs, manager check-ins & feedback",
  },
};

interface SetupRequirementsStageSectionProps {
  stageKey: string;
  templates: string[];
  searchQuery: string;
  selectedItems: Set<string>;
  onToggleStage: (stageKey: string) => void;
  onToggleItem: (name: string) => void;
}

export const SetupRequirementsStageSection = memo(function SetupRequirementsStageSection({
  stageKey,
  templates,
  searchQuery,
  selectedItems,
  onToggleStage,
  onToggleItem,
}: SetupRequirementsStageSectionProps) {
  const meta = STAGE_LABELS[stageKey] || {
    label: stageKey,
    icon: "ri-folder-line",
    desc: "Requirements",
  };

  const filtered = templates.filter((name) =>
    name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  if (filtered.length === 0) return null;

  const stageSelectedCount = templates.filter((t) => selectedItems.has(t)).length;
  const allStageSelected = templates.length > 0 && stageSelectedCount === templates.length;

  return (
    <div className="border border-gray-200/80 rounded-2xl overflow-hidden bg-white">
      {/* Stage Header */}
      <div className="p-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xs">
            <i className={meta.icon} />
          </div>
          <div>
            <h4 className="text-xs font-black text-gray-900 leading-tight">{meta.label}</h4>
            <p className="text-[10px] text-gray-400">{meta.desc}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleStage(stageKey)}
          className="text-[10px] font-bold text-[#253C7D] hover:underline cursor-pointer"
        >
          {allStageSelected ? "Deselect Stage" : `Select All (${stageSelectedCount}/${templates.length})`}
        </button>
      </div>

      {/* Stage Checkboxes */}
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.map((name) => {
          const isChecked = selectedItems.has(name);
          return (
            <label
              key={name}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                isChecked
                  ? "bg-blue-50/40 border-blue-200 text-gray-900 font-bold"
                  : "bg-white border-gray-200/60 hover:bg-gray-50 text-gray-600 font-medium"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggleItem(name)}
                className="mt-0.5 rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
              />
              <div className="min-w-0 flex-1">
                <span className="block truncate">{name}</span>
                <span className="text-[10px] font-normal text-gray-400 truncate block">
                  Task: {DOC_TO_TASK[name] || name}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
});
