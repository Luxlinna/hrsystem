import { memo } from "react";
import { REFRESHMENTS_OPTIONS } from "../../constants";

interface RefreshmentsSelectorProps {
  selectedRefreshments: string[];
  onToggleRefreshment: (label: string) => void;
}

export const RefreshmentsSelector = memo(function RefreshmentsSelector({
  selectedRefreshments,
  onToggleRefreshment,
}: RefreshmentsSelectorProps) {
  return (
    <div>
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
        Refreshments &amp; Catering
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {REFRESHMENTS_OPTIONS.map((ref) => {
          const isSelected = selectedRefreshments.includes(ref.label);
          return (
            <button
              key={ref.label}
              type="button"
              onClick={() => onToggleRefreshment(ref.label)}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all text-xs font-semibold cursor-pointer shadow-2xs ${
                isSelected
                  ? "bg-emerald-700 text-white border-emerald-800"
                  : "bg-gray-50/70 border-gray-200/80 text-gray-700 hover:bg-gray-100/80 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <i className={`${ref.icon} text-sm shrink-0 ${isSelected ? "text-white" : "text-emerald-600"}`} />
                <span className="truncate">{ref.label}</span>
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
