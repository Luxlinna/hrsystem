import { memo } from "react";
import { SHIFT_TEMPLATES } from "../../constants";
import type { ShiftForm, ShiftTemplate } from "../../types";

interface ShiftPresetTemplatesProps {
  shiftForm: ShiftForm;
  onApplyTemplate: (tpl: ShiftTemplate) => void;
}

export const ShiftPresetTemplates = memo(function ShiftPresetTemplates({
  shiftForm,
  onApplyTemplate,
}: ShiftPresetTemplatesProps) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
        Quick Shift Presets
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {SHIFT_TEMPLATES.map((tpl) => {
          const isActive = shiftForm.start_time === tpl.start && shiftForm.end_time === tpl.end;
          return (
            <button
              key={tpl.name}
              type="button"
              onClick={() => onApplyTemplate(tpl)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                isActive
                  ? "bg-blue-50 border-[#253C7D] ring-1 ring-[#253C7D] shadow-2xs"
                  : "bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
              }`}
            >
              <p className="text-xs font-bold text-slate-900 truncate flex items-center justify-between">
                <span>{tpl.label}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tpl.color }} />
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {tpl.start} – {tpl.end}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
});
