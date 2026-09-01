import { memo } from "react";
import { TYPE_CONFIG } from "../constants";
import type { DisciplinaryType } from "../types";

interface DisciplinaryTypePickerProps {
  selectedType: DisciplinaryType;
  onSelectType: (type: DisciplinaryType) => void;
}

export const DisciplinaryTypePicker = memo(function DisciplinaryTypePicker({
  selectedType,
  onSelectType,
}: DisciplinaryTypePickerProps) {
  return (
    <div>
      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
        Action / Incident Type <span className="text-rose-500">*</span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {(Object.keys(TYPE_CONFIG) as DisciplinaryType[]).map((typeKey) => {
          const cfg = TYPE_CONFIG[typeKey];
          const isSelected = selectedType === typeKey;
          return (
            <button
              key={typeKey}
              type="button"
              onClick={() => onSelectType(typeKey)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? `${cfg.bg} ring-2 ring-[#253C7D]/20 shadow-xs`
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${cfg.bg} ${cfg.color}`}>
                <i className={cfg.icon} />
              </div>
              <span className={`text-xs font-bold leading-tight ${isSelected ? cfg.color : "text-gray-700"}`}>
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
