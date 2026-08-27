import { memo } from "react";

interface OffboardTabsBarProps {
  tab: "active" | "completed" | "tasks" | "analytics";
  setTab: (t: "active" | "completed" | "tasks" | "analytics") => void;
  activeCount: number;
  completedCount: number;
  tasksCount: number;
  viewMode: "cards" | "list";
  setViewMode: (mode: "cards" | "list") => void;
}

export const OffboardTabsBar = memo(function OffboardTabsBar({
  tab,
  setTab,
  activeCount,
  completedCount,
  tasksCount,
  viewMode,
  setViewMode,
}: OffboardTabsBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-2xl border border-gray-200/60 overflow-x-auto">
        <button
          onClick={() => setTab("active")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            tab === "active"
              ? "bg-white text-[#253C7D] shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <i className="ri-user-shared-line" />
          <span>Active Offboarding</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              tab === "active" ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-200 text-gray-700"
            }`}
          >
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => setTab("completed")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            tab === "completed"
              ? "bg-white text-[#253C7D] shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <i className="ri-checkbox-circle-line" />
          <span>Completed</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              tab === "completed" ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-200 text-gray-700"
            }`}
          >
            {completedCount}
          </span>
        </button>

        <button
          onClick={() => setTab("tasks")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            tab === "tasks"
              ? "bg-white text-[#253C7D] shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <i className="ri-task-line" />
          <span>Exit Tasks</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              tab === "tasks" ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-200 text-gray-700"
            }`}
          >
            {tasksCount}
          </span>
        </button>

        <button
          onClick={() => setTab("analytics")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            tab === "analytics"
              ? "bg-white text-[#253C7D] shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <i className="ri-pie-chart-line" />
          <span>Analytics</span>
        </button>
      </div>

      {/* View Switcher for Active / Completed */}
      {(tab === "active" || tab === "completed") && (
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60 self-end sm:self-auto">
          <button
            onClick={() => setViewMode("cards")}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-600"
            }`}
            title="Card View"
          >
            <i className="ri-layout-grid-line" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "list" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-600"
            }`}
            title="List View"
          >
            <i className="ri-list-check" />
          </button>
        </div>
      )}
    </div>
  );
});
