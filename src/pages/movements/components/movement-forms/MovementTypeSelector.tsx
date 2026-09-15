import React from "react";
import type { MovementType } from "../../types";
import { MOVEMENT_TYPES } from "../../constants";

interface Props {
  selectedType: MovementType;
  onChange: (type: MovementType) => void;
}

export const MovementTypeSelector: React.FC<Props> = ({ selectedType, onChange }) => {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2">
        2. Movement Action Type <span className="text-rose-500">*</span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Object.entries(MOVEMENT_TYPES).map(([typeKey, cfg]) => {
          const active = selectedType === typeKey;
          return (
            <button
              key={typeKey}
              type="button"
              onClick={() => onChange(typeKey as MovementType)}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                active
                  ? "border-[#253C7D] bg-indigo-50/80 dark:bg-indigo-950/40 ring-2 ring-[#253C7D]/20 shadow-xs"
                  : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-gray-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                    active ? "bg-[#253C7D] text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-500"
                  }`}
                >
                  <i className={cfg.icon} />
                </div>
                {active && (
                  <i className="ri-checkbox-circle-fill text-[#253C7D] dark:text-indigo-400 text-sm" />
                )}
              </div>
              <div className="font-bold text-xs text-gray-900 dark:text-white leading-tight">
                {cfg.label}
              </div>
              <div className="text-[9px] text-gray-400 mt-1 line-clamp-1">
                {cfg.shortLabel}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
