import { SETTINGS_SECTIONS } from "../constants";

interface SettingsNavProps {
  active: string;
  onChange: (key: string) => void;
}

export function SettingsNav({ active, onChange }: SettingsNavProps) {
  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {SETTINGS_SECTIONS.map((s) => (
        <button
          key={s.key}
          onClick={() => onChange(s.key)}
          className={`px-4 py-2 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap ${
            active === s.key
              ? "bg-[#253C7D] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
