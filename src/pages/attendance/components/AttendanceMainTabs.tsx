import { memo } from "react";

interface Props {
  activeMainTab: "attendance" | "attendance-schedule" | "schedule-templates" | "shifts";
  setActiveMainTab: (tab: "attendance" | "attendance-schedule" | "schedule-templates" | "shifts") => void;
}

export const AttendanceMainTabs = memo(function AttendanceMainTabs({
  activeMainTab,
  setActiveMainTab,
}: Props) {
  const tabs: Array<{
    id: "attendance" | "attendance-schedule" | "schedule-templates" | "shifts";
    label: string;
    icon: string;
  }> = [
    { id: "attendance", label: "Attendance Logs", icon: "ri-calendar-check-line" },
    { id: "attendance-schedule", label: "Attendance Schedule", icon: "ri-table-line" },
    { id: "schedule-templates", label: "Schedule Templates", icon: "ri-calendar-schedule-line" },
    { id: "shifts", label: "Shifts", icon: "ri-time-line" },
  ];

  return (
    <div className="inline-flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200/80 dark:border-slate-700 overflow-x-auto max-w-full">
      {tabs.map((tab) => {
        const isActive = activeMainTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveMainTab(tab.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              isActive
                ? "bg-[#253C7D] text-white shadow-xs"
                : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <i className={`${tab.icon} text-xs`} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
});
