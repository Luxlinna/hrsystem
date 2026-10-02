import { memo } from "react";

export type SettingOption = string | { value: string; label: string };

interface SettingFieldProps {
  label: string;
  description?: string;
  inputType: string;
  options?: SettingOption[];
  settingKey: string;
  getVal: (key: string) => string;
  updateValue: (key: string, value: string) => void;
  saveSetting: (key: string) => Promise<void>;
  saving: boolean;
  edited: Record<string, string>;
}

export const SettingField = memo(function SettingField({
  label,
  description,
  inputType,
  options,
  settingKey,
  getVal,
  updateValue,
  saveSetting,
  saving,
  edited,
}: SettingFieldProps) {
  return (
    <div>
      <label className="text-[12px] font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
        {label}
      </label>
      {description && (
        <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-0.5">{description}</p>
      )}
      <div className="flex gap-2 mt-1">
        {options ? (
          <select
            value={getVal(settingKey)}
            onChange={(e) => updateValue(settingKey, e.target.value)}
            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-[13px] text-gray-700 dark:text-slate-200 focus:outline-none focus:border-[#253C7D] dark:focus:border-blue-500 cursor-pointer"
          >
            {options.map((o) => {
              const val = typeof o === "string" ? o : o.value;
              const lbl = typeof o === "string" ? o : o.label;
              return (
                <option key={val} value={val} className="dark:bg-slate-800 dark:text-slate-200">
                  {lbl}
                </option>
              );
            })}
          </select>
        ) : (
          <input
            type={inputType}
            value={getVal(settingKey)}
            onChange={(e) => updateValue(settingKey, e.target.value)}
            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-[13px] text-gray-700 dark:text-slate-200 focus:outline-none focus:border-[#253C7D] dark:focus:border-blue-500"
          />
        )}
        {edited[settingKey] !== undefined && (
          <button
            onClick={() => saveSetting(settingKey)}
            disabled={saving}
            className="px-4 py-2 bg-[#253C7D] dark:bg-blue-600 text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] dark:hover:bg-blue-700 transition-colors disabled:opacity-40 whitespace-nowrap cursor-pointer"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        )}
      </div>
    </div>
  );
});

interface ToggleFieldProps {
  id: string;
  label: string;
  settingKey: string;
  getVal: (key: string) => string;
  updateValue: (key: string, value: string) => void;
  saveSetting: (key: string) => Promise<void>;
  saving: boolean;
  edited: Record<string, string>;
}

export const ToggleField = memo(function ToggleField({
  id,
  label,
  settingKey,
  getVal,
  updateValue,
  saveSetting,
  saving,
  edited,
}: ToggleFieldProps) {
  const checked = getVal(settingKey) === "true";
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800">
      <label htmlFor={id} className="text-[13px] text-gray-700 dark:text-slate-300 font-medium cursor-pointer">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => updateValue(settingKey, String(e.target.checked))}
          className="w-4 h-4 text-[#253C7D] rounded border-gray-300 focus:ring-[#253C7D] cursor-pointer"
        />
        {edited[settingKey] !== undefined && (
          <button
            onClick={() => saveSetting(settingKey)}
            disabled={saving}
            className="px-3 py-1 bg-[#253C7D] dark:bg-blue-600 text-white text-[11px] font-semibold rounded hover:bg-[#1F336A] transition-colors disabled:opacity-40 cursor-pointer"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        )}
      </div>
    </div>
  );
});
