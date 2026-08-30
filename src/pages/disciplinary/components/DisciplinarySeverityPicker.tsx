import { memo } from "react";
import { SEVERITY_CONFIG } from "../constants";
import type { DisciplinarySeverity } from "../types";

interface DisciplinarySeverityPickerProps {
  selectedSeverity: DisciplinarySeverity;
  onSelectSeverity: (sev: DisciplinarySeverity) => void;
}

export const DisciplinarySeverityPicker = memo(function DisciplinarySeverityPicker({
  selectedSeverity,
  onSelectSeverity,
}: DisciplinarySeverityPickerProps) {
  return (
    <div>
      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
        Severity Level <span className="text-rose-500">*</span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(["low", "medium", "high", "critical"] as DisciplinarySeverity[]).map((sev) => {
          const cfg = SEVERITY_CONFIG[sev];
          const isSelected = selectedSeverity === sev;
          return (
            <button
              key={sev}
              type="button"
              onClick={() => onSelectSeverity(sev)}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isSelected
                  ? `${cfg.bg} ${cfg.border} ${cfg.color} font-black shadow-xs ring-1 ring-current`
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-xs font-semibold"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="text-xs">{cfg.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
