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
    <div>
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
        Room Accent Theme
      </label>
      <div className="flex items-center gap-2 flex-wrap">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setColor(c);
              setCustomColor("");
            }}
            className={`w-7 h-7 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
              color === c && !customColor ? "ring-2 ring-offset-2 ring-gray-900 scale-110 shadow-xs" : "hover:scale-105"
            }`}
            style={{ backgroundColor: c }}
          >
            {color === c && !customColor && <i className="ri-check-line text-white text-xs font-bold" />}
          </button>
        ))}

        <input
          type="text"
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
          placeholder="#HEX"
          className="w-20 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
        />
      </div>
    </div>
  );
});
