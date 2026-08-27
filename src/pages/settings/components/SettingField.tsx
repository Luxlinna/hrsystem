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
      <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
        {label}
      </label>
      {description && (
        <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>
      )}
      <div className="flex gap-2 mt-1">
        {options ? (
          <select
            value={getVal(settingKey)}
            onChange={(e) => updateValue(settingKey, e.target.value)}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
          >
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={inputType}
            value={getVal(settingKey)}
            onChange={(e) => updateValue(settingKey, e.target.value)}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
          />
        )}
        {edited[settingKey] !== undefined && (
          <button
            onClick={() => saveSetting(settingKey)}
            disabled={saving}
            className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
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
        className="w-4 h-4 rounded border-gray-300 text-[#253C7D]"
      />
      <label htmlFor={id} className="text-[13px] text-gray-700 cursor-pointer">
        {label}
      </label>
      {edited[settingKey] !== undefined && (
        <button
          onClick={() => saveSetting(settingKey)}
          disabled={saving}
          className="px-3 py-1 bg-[#253C7D] text-white text-[11px] font-semibold rounded-md hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
        >
          Save
        </button>
      )}
    </div>
  );
}
