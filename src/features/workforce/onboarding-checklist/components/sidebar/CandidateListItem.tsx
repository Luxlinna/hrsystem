import { memo } from "react";
import type { OnboardingHire } from "../../types";
import { getHireName, getHireInitials } from "../../checklistUtils";

interface CandidateListItemProps {
  hire: OnboardingHire;
  isSelected: boolean;
  progress: number;
  onSelect: (hire: OnboardingHire) => void;
}

export const CandidateListItem = memo(function CandidateListItem({
  hire,
  isSelected,
  progress,
  onSelect,
}: CandidateListItemProps) {
  const name = getHireName(hire);
  const initials = getHireInitials(hire);
  const emp = hire.employees;

  return (
    <div
      onClick={() => onSelect(hire)}
      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
        isSelected
          ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs"
          : "bg-white border-gray-200/80 hover:bg-slate-50 text-gray-900"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
              isSelected ? "bg-white/20 text-white" : "bg-[#253C7D]/10 text-[#253C7D]"
            }`}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-xs truncate">{name}</h4>
            <p className={`text-[10px] truncate ${isSelected ? "text-white/80" : "text-gray-400"}`}>
              {emp?.role || "Staff"} &middot; {emp?.department || "General"}
            </p>
          </div>
        </div>

        <span
          className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ${
            isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          {progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className={`w-full h-1 rounded-full overflow-hidden ${isSelected ? "bg-white/20" : "bg-gray-100"}`}>
        <div
          className={`h-full rounded-full transition-all ${
            isSelected ? "bg-white" : progress === 100 ? "bg-emerald-500" : "bg-[#253C7D]"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
});
