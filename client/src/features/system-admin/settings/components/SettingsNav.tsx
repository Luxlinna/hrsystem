import { SETTINGS_SECTIONS } from "../constants";
import { usePermissions } from "@/hooks/usePermissions";

interface SettingsNavProps {
  active: string;
  onChange: (key: string) => void;
}

export function SettingsNav({ active, onChange }: SettingsNavProps) {
  const { isAdmin, can } = usePermissions();

  const visibleSections = SETTINGS_SECTIONS.filter((s) => {
    if (s.key === "branches") return can("branches");
    if (s.key === "permissions") return isAdmin;
    return true;
  });

  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {visibleSections.map((s) => (
        <button
          key={s.key}
          onClick={() => onChange(s.key)}
          className={`px-4 py-2 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
            active === s.key
              ? "bg-[#253C7D] dark:bg-blue-600 text-white shadow-xs"
              : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
