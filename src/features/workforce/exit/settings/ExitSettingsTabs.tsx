import { memo } from "react";
import type { ExitSettingTab } from "./types";

interface ExitSettingsTabsProps {
  activeTab: ExitSettingTab;
  onChangeTab: (tab: ExitSettingTab) => void;
  exitTypesCount: number;
  reasonTypesCount: number;
}

export const ExitSettingsTabs = memo(function ExitSettingsTabs({
  activeTab,
  onChangeTab,
  exitTypesCount,
  reasonTypesCount,
}: ExitSettingsTabsProps) {
  return (
    <div className="flex items-center gap-6 border-b border-gray-200 dark:border-slate-800 mb-5">
      <button
        type="button"
        onClick={() => onChangeTab("exit-type")}
        className={`pb-2.5 text-xs font-semibold transition-all relative flex items-center gap-1.5 cursor-pointer ${
          activeTab === "exit-type"
            ? "text-[#253C7D] dark:text-sky-400 font-bold border-b-2 border-[#253C7D] dark:border-sky-400"
            : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
        }`}
      >
        Exit Type
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400">
          {exitTypesCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onChangeTab("reason-type")}
        className={`pb-2.5 text-xs font-semibold transition-all relative flex items-center gap-1.5 cursor-pointer ${
          activeTab === "reason-type"
            ? "text-[#253C7D] dark:text-sky-400 font-bold border-b-2 border-[#253C7D] dark:border-sky-400"
            : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
        }`}
      >
        Reason Type
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400">
          {reasonTypesCount}
        </span>
      </button>
    </div>
  );
});
