import { memo } from "react";
import type { Branch } from "../types";
import { STATUS_CONFIG, TASK_TYPE_COLORS } from "../constants";

interface OffboardFilterBarProps {
  tab: "active" | "completed" | "tasks" | "analytics";
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterDepartment: string;
  setFilterDepartment: (dept: string) => void;
  filterBranch: string;
  setFilterBranch: (branchId: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterTaskType: string;
  setFilterTaskType: (type: string) => void;
  departments: string[];
  branches: Branch[];
}

export const OffboardFilterBar = memo(function OffboardFilterBar({
  tab,
  searchQuery,
  setSearchQuery,
  filterDepartment,
  setFilterDepartment,
  filterBranch,
  setFilterBranch,
  filterStatus,
  setFilterStatus,
  filterTaskType,
  setFilterTaskType,
  departments,
  branches,
}: OffboardFilterBarProps) {
  if (tab === "analytics") return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3.5 mb-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            tab === "tasks"
              ? "Filter tasks by title, employee name, assignee..."
              : "Filter departures by employee name, role, department, reason..."
          }
          className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-circle-fill text-xs" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Department Filter */}
        {departments.length > 0 && (
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}

        {/* Branch Filter (if not tasks tab) */}
        {tab !== "tasks" && branches.length > 0 && (
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}

        {/* Lifecycle Status Filter for Active Tab */}
        {tab === "active" && (
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="all">All Active Stages</option>
            {Object.keys(STATUS_CONFIG)
              .filter((s) => s !== "completed")
              .map((s) => (
                <option key={s} value={s}>
                  {STATUS_CONFIG[s].label}
                </option>
              ))}
          </select>
        )}

        {/* Task Type Filter for Tasks Tab */}
        {tab === "tasks" && (
          <select
            value={filterTaskType}
            onChange={(e) => setFilterTaskType(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="all">All Task Departments</option>
            {Object.keys(TASK_TYPE_COLORS).map((t) => (
              <option key={t} value={t}>
                {t} Tasks
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
});
