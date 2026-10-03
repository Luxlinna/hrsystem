import { memo } from "react";
import type { UnityApp } from "../types";

interface AppDetailHeaderProps {
  app: UnityApp;
  activeTab: "access" | "activity" | "info";
  setActiveTab: (t: "access" | "activity" | "info") => void;
  onClose: () => void;
}

export const AppDetailHeader = memo(function AppDetailHeader({
  app,
  activeTab,
  setActiveTab,
  onClose,
}: AppDetailHeaderProps) {
  return (
    <div>
      {/* Top App Info Bar */}
      <div className="p-6 border-b border-gray-100 flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg shrink-0 shadow-2xs"
          style={{ backgroundColor: app.color }}
        >
          <i className={`${app.icon} w-6 h-6 flex items-center justify-center`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-bold text-gray-900 leading-tight">{app.name}</p>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {app.vendor} &middot; v{app.version}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <i className="ri-close-line text-gray-500 text-lg" />
        </button>
      </div>

      {/* Tab Bar */}
      <div className="px-6 py-3 border-b border-gray-100 flex gap-1 bg-gray-50/80">
        {(["access", "activity", "info"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === t
                ? "bg-white text-[#253C7D] shadow-2xs"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
});
