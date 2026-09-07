import { memo } from "react";
import type { AdminTab } from "../types";

interface AdminNavTabsProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  pendingResetCount: number;
}

export const AdminNavTabs = memo(function AdminNavTabs({
  activeTab,
  setActiveTab,
  pendingResetCount,
}: AdminNavTabsProps) {
  const tabs = [
    { id: "roles", label: "Roles & Permissions", icon: "ri-shield-user-line" },
    { id: "users", label: "User Management", icon: "ri-team-line" },
    {
      id: "password-resets",
      label: "Password Resets",
      icon: "ri-lock-password-line",
      count: pendingResetCount,
    },
  ];

  return (
    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-1 mb-6 w-fit max-w-full overflow-x-auto shadow-2xs">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id as AdminTab)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === t.id
              ? "bg-gray-900 dark:bg-slate-800 text-white shadow-xs font-semibold"
              : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/60"
          }`}
        >
          <i className={t.icon} />
          {t.label}
          {"count" in t && (t.count ?? 0) > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === t.id
                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
              }`}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
});
