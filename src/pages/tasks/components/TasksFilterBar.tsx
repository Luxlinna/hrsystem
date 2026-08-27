import { memo } from "react";
import type { Employee, TaskSortField, TaskSortOrder } from "../types";

interface TasksFilterBarProps {
  search: string;
  setSearch: (s: string) => void;
  assigneeFilter: string;
  setAssigneeFilter: (a: string) => void;
  priorityFilter: string;
  setPriorityFilter: (p: string) => void;
  outsideWorkOnly: boolean;
  setOutsideWorkOnly: (b: boolean) => void;
  overdueOnly: boolean;
  setOverdueOnly: (b: boolean) => void;
  sortField: TaskSortField;
  setSortField: (f: TaskSortField) => void;
  sortOrder: TaskSortOrder;
  setSortOrder: (o: TaskSortOrder) => void;
  employees: Employee[];
}

export const TasksFilterBar = memo(function TasksFilterBar({
  search,
  setSearch,
  assigneeFilter,
  setAssigneeFilter,
  priorityFilter,
  setPriorityFilter,
  outsideWorkOnly,
  setOutsideWorkOnly,
  overdueOnly,
  setOverdueOnly,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  employees,
}: TasksFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-2xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, description, or assignee..."
            className="w-full pl-9 pr-8 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 focus:border-[#253C7D]"
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

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Assignee select */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="all">All Assignees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.first_name} {e.last_name}
              </option>
            ))}
          </select>

          {/* Priority select */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          {/* Sort Menu */}
          <div className="flex items-center bg-gray-50/80 border border-gray-200 rounded-xl overflow-hidden">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as TaskSortField)}
              className="px-2.5 py-2 text-xs font-medium text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="created_at">Created Date</option>
              <option value="due_date">Deadline</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
              className="px-2 py-2 hover:bg-gray-100 text-gray-600 border-l border-gray-200 cursor-pointer"
            >
              <i className={sortOrder === "asc" ? "ri-sort-asc" : "ri-sort-desc"} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick toggle chips */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
        <button
          onClick={() => setOutsideWorkOnly(!outsideWorkOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            outsideWorkOnly
              ? "bg-indigo-600 text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <i className="ri-map-pin-2-line text-xs" />
          Outside Field Work Only
        </button>

        <button
          onClick={() => setOverdueOnly(!overdueOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            overdueOnly
              ? "bg-rose-600 text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <i className="ri-alarm-warning-line text-xs" />
          Overdue Only
        </button>

        {(assigneeFilter !== "all" ||
          priorityFilter !== "all" ||
          outsideWorkOnly ||
          overdueOnly ||
          search) && (
          <button
            onClick={() => {
              setSearch("");
              setAssigneeFilter("all");
              setPriorityFilter("all");
              setOutsideWorkOnly(false);
              setOverdueOnly(false);
            }}
            className="text-xs text-[#253C7D] font-semibold hover:underline ml-auto cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
});
