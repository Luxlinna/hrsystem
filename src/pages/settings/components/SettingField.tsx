interface SettingFieldProps {
  label: string;
  description?: string;
  inputType: string;
  options?: string[];
  settingKey: string;
  getVal: (key: string) => string;
  updateValue: (key: string, value: string) => void;
  saveSetting: (key: string) => Promise<void>;
  saving: boolean;
  edited: Record<string, string>;
}

export function SettingField({
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
            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-[13px] text-gray-700 dark:text-slate-200 focus:outline-none focus:border-[#253C7D] dark:focus:border-blue-500"
          >
            {options.map((o) => (
              <option key={o} value={o} className="dark:bg-slate-800 dark:text-slate-200">
                {o}
              </option>
            ))}
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
            Save
          </button>
        )}
      </div>
    </div>
  );
}

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

export function ToggleField({
  id,
  label,
  settingKey,
  getVal,
  updateValue,
  saveSetting,
  saving,
  edited,
}: ToggleFieldProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <input
        type="checkbox"
        id={id}
        checked={getVal(settingKey) === "true"}
        onChange={(e) => updateValue(settingKey, String(e.target.checked))}
        className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-[#253C7D] accent-[#253C7D] cursor-pointer"
      />
      <label htmlFor={id} className="text-[13px] text-gray-700 dark:text-slate-200 cursor-pointer">
        {label}
      </label>
      {edited[settingKey] !== undefined && (
        <button
          onClick={() => saveSetting(settingKey)}
          disabled={saving}
          className="px-3 py-1 bg-[#253C7D] dark:bg-blue-600 text-white text-[11px] font-semibold rounded-md hover:bg-[#1F336A] dark:hover:bg-blue-700 transition-colors disabled:opacity-40 whitespace-nowrap cursor-pointer"
        >
          Save
        </button>
      )}
    </div>
  );
}
