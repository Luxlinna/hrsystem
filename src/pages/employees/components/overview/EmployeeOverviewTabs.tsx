import React from "react";

export type OverviewTabKey =
  | "info"
  | "movement"
  | "warning"
  | "nssf"
  | "complaints"
  | "training"
  | "assets"
  | "payroll";

export interface TabConfig {
  key: OverviewTabKey;
  label: string;
  shortLabel: string;
  icon: string;
  badge?: number | string;
}

interface EmployeeOverviewTabsProps {
  activeTab: OverviewTabKey;
  onSelectTab: (tab: OverviewTabKey) => void;
  counts?: Partial<Record<OverviewTabKey, number>>;
}

export const EmployeeOverviewTabs: React.FC<EmployeeOverviewTabsProps> = ({
  activeTab,
  onSelectTab,
  counts = {},
}) => {
  const tabs: TabConfig[] = [
    { key: "info", label: "Employee Information", shortLabel: "Employee Info", icon: "ri-user-3-line" },
    { key: "movement", label: "Movement Info", shortLabel: "Movement", icon: "ri-route-line", badge: counts.movement },
    { key: "warning", label: "Warning Info", shortLabel: "Warnings", icon: "ri-alarm-warning-line", badge: counts.warning },
    { key: "nssf", label: "NSSF Info", shortLabel: "NSSF", icon: "ri-shield-cross-line" },
    { key: "complaints", label: "Complaints & Suggestions", shortLabel: "Complaints", icon: "ri-feedback-line", badge: counts.complaints },
    { key: "training", label: "Training Info", shortLabel: "Training", icon: "ri-graduation-cap-line", badge: counts.training },
    { key: "assets", label: "Asset Info", shortLabel: "Assets", icon: "ri-macbook-line", badge: counts.assets },
    { key: "payroll", label: "Payroll Info", shortLabel: "Payroll", icon: "ri-wallet-3-line", badge: counts.payroll },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6 overflow-hidden">
      <div className="flex items-center gap-1 p-1.5 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-[#253C7D] text-white shadow-sm font-bold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80"
              }`}
            >
              <i className={`${tab.icon} text-sm ${isActive ? "text-white" : "text-gray-400"}`} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              {typeof tab.badge === "number" && tab.badge > 0 && (
                <span
                  className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
