import { memo } from "react";
import type { Employee, TaskViewMode } from "../types";

interface TasksFilterBarProps {
  viewMode: TaskViewMode;
  setViewMode: (v: TaskViewMode) => void;
  search: string;
  setSearch: (s: string) => void;
  assigneeFilter: string;
  setAssigneeFilter: (a: string) => void;
  priorityFilter: string;
  setPriorityFilter: (p: string) => void;
  quickTab: "all" | "team" | "my" | "urgent";
  setQuickTab: (t: "all" | "team" | "my" | "urgent") => void;
  employees: Employee[];
  isManager?: boolean;
  hasSubordinates?: boolean;
}

export const TasksFilterBar = memo(function TasksFilterBar({
  viewMode,
  setViewMode,
  search,
  setSearch,
  assigneeFilter,
  setAssigneeFilter,
  priorityFilter,
  setPriorityFilter,
  quickTab,
  setQuickTab,
  employees,
  isManager,
  hasSubordinates,
}: TasksFilterBarProps) {
  return (
    <div className="space-y-3 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: View Mode Tabs */}
        <div className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-2xl border border-gray-200/70 w-fit flex-wrap">
          {[
            { mode: "board" as const, label: "Board", icon: "ri-layout-masonry-line" },
            { mode: "list" as const, label: "List", icon: "ri-list-check" },
            { mode: "calendar" as const, label: "Calendar", icon: "ri-calendar-line" },
            { mode: "report" as const, label: "Task Reports", icon: "ri-file-chart-line" },
          ].map((item) => (
            <button
              key={item.mode}
              onClick={() => setViewMode(item.mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === item.mode
                  ? "bg-white text-[#253C7D] shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
              }`}
            >
              <i className={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Search & Filters */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, assignee..."
              className="w-full pl-8 pr-7 py-2 bg-white border border-gray-200/90 rounded-2xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[#253C7D] shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-circle-fill text-xs" />
              </button>
            )}
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200/90 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-2xs"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200/90 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-2xs"
          >
            <option value="all">All Assignees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.first_name} {e.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Filter Pills Row */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setQuickTab("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
            quickTab === "all"
              ? "bg-[#253C7D] text-white shadow-2xs"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          All Tasks
        </button>

        {isManager && (
          <button
            onClick={() => setQuickTab("team")}
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
              quickTab === "team"
                ? "bg-[#253C7D] text-white shadow-2xs"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <i className="ri-team-line text-xs" />
            <span>My Direct Team</span>
          </button>
        )}

        <button
          onClick={() => setQuickTab("my")}
          className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
            quickTab === "my"
              ? "bg-[#253C7D] text-white shadow-2xs"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <i className="ri-user-line text-xs" />
          <span>Assigned to Me</span>
        </button>

        <button
          onClick={() => setQuickTab("urgent")}
          className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
            quickTab === "urgent"
              ? "bg-amber-500 text-white shadow-2xs"
              : "bg-white border border-amber-200 text-amber-700 hover:bg-amber-50/50"
          }`}
        >
          <i className="ri-fire-line text-xs text-amber-500" />
          <span>High / Urgent</span>
        </button>
      </div>
    </div>
  );
});
