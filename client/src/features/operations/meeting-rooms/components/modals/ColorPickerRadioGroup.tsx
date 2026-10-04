import { memo } from "react";
import { COLOR_PRESETS } from "../../constants";

interface ColorPickerRadioGroupProps {
  color: string;
  setColor: (c: string) => void;
  customColor: string;
  setCustomColor: (c: string) => void;
}

export const ColorPickerRadioGroup = memo(function ColorPickerRadioGroup({
  color,
  setColor,
  customColor,
  setCustomColor,
}: ColorPickerRadioGroupProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 shrink-0">
        Accent Theme
      </label>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {COLOR_PRESETS.slice(0, 8).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setColor(c);
              setCustomColor("");
            }}
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-all flex items-center justify-center cursor-pointer ${
              color === c && !customColor
                ? "ring-2 ring-offset-2 ring-[#253C7D] dark:ring-sky-400 dark:ring-offset-slate-900 scale-110 shadow-xs"
                : "hover:scale-110 opacity-80 hover:opacity-100"
            }`}
            style={{ backgroundColor: c }}
          >
            {color === c && !customColor && <i className="ri-check-line text-white text-xs font-bold drop-shadow-xs" />}
          </button>
        ))}

        <input
          type="text"
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
          placeholder="#HEX"
          className="w-20 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]"
        />
      </div>
    </div>
  );
});
