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
    <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-6 w-fit max-w-full overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id as AdminTab)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === t.id ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <i className={t.icon} />
          {t.label}
          {"count" in t && (t.count ?? 0) > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === t.id ? "bg-white text-gray-900" : "bg-rose-100 text-rose-700"
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
