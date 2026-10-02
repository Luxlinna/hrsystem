import { useTheme } from "@/context/ThemeContext";

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <label className="text-[12px] font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
          Display Mode
        </label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {[
            { key: "light", label: "Light", icon: "ri-sun-line" },
            { key: "dark", label: "Dark", icon: "ri-moon-line" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setTheme(option.key as "light" | "dark")}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-[13px] font-semibold transition-colors cursor-pointer ${
                theme === option.key
                  ? "border-[#253C7D] bg-[#253C7D] dark:bg-blue-600 dark:border-blue-500 text-white shadow-xs"
                  : "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              <i className={`${option.icon} text-base`} />
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-2">
          This preference is saved on this browser and applies across the system.
        </p>
      </div>
    </div>
  );
}
