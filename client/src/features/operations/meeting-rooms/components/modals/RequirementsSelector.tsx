import { memo } from "react";
import { SPECIAL_REQUIREMENTS_OPTIONS } from "../../constants";

interface RequirementsSelectorProps {
  selectedRequirements: string[];
  onToggleRequirement: (label: string) => void;
}

export const RequirementsSelector = memo(function RequirementsSelector({
  selectedRequirements,
  onToggleRequirement,
}: RequirementsSelectorProps) {
  return (
    <div>
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
        Required Equipment &amp; Support
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SPECIAL_REQUIREMENTS_OPTIONS.map((req) => {
          const isSelected = selectedRequirements.includes(req.label);
          return (
            <button
              key={req.label}
              type="button"
              onClick={() => onToggleRequirement(req.label)}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all text-xs font-semibold cursor-pointer shadow-2xs ${
                isSelected
                  ? "bg-[#253C7D] text-white border-[#253C7D]"
                  : "bg-gray-50/70 border-gray-200/80 text-gray-700 hover:bg-gray-100/80 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <i className={`${req.icon} text-sm shrink-0 ${isSelected ? "text-white" : "text-[#253C7D]"}`} />
                <span className="truncate">{req.label}</span>
              </div>
              <span
                className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] shrink-0 ${
                  isSelected ? "bg-white/20 border-white/40 text-white" : "border-gray-300 bg-white"
                }`}
              >
                {isSelected && <i className="ri-check-line font-bold" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
