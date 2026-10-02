import React from "react";

export type OverviewTabKey =
  | "personal"
  | "joining"
  | "movement"
  | "complaints"
  | "warning"
  | "payroll"
  | "assets";

export interface TabConfig {
  key: OverviewTabKey;
  label: string;
}

interface EmployeeOverviewTabsProps {
  activeTab: OverviewTabKey;
  onSelectTab: (tab: OverviewTabKey) => void;
  canViewSalary?: boolean;
}

export const EmployeeOverviewTabs: React.FC<EmployeeOverviewTabsProps> = ({
  activeTab,
  onSelectTab,
  canViewSalary = true,
}) => {
  const allTabs: TabConfig[] = [
    { key: "personal", label: "Employee Profile" },
    { key: "joining", label: "Joining Info" },
    { key: "movement", label: "Employee Movements" },
    { key: "complaints", label: "Complaint/Suggestion Info" },
    { key: "warning", label: "Warning Info" },
    { key: "payroll", label: "Payroll Info" },
    { key: "assets", label: "Asset" },
  ];

  const tabs = canViewSalary ? allTabs : allTabs.filter((t) => t.key !== "payroll");

  return (
    <div className="flex items-center gap-6 sm:gap-8 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 mb-6">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelectTab(tab.key)}
            className={`pb-2.5 text-[13px] whitespace-nowrap transition-colors cursor-pointer relative outline-none focus:outline-none select-none ${
              isActive
                ? "text-[#253C7D] dark:text-blue-400 font-bold border-b-2 border-[#253C7D] dark:border-blue-400"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
