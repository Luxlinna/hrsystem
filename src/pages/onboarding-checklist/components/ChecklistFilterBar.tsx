import { memo } from "react";
import { CATEGORY_META, PRIORITY_META } from "../constants";

interface ChecklistFilterBarProps {
  viewLayout: "category" | "list" | "urgency";
  setViewLayout: (v: "category" | "list" | "urgency") => void;
  taskSearch: string;
  setTaskSearch: (q: string) => void;
  filterCategory: string;
  setFilterCategory: (c: string) => void;
  filterPriority: string;
  setFilterPriority: (p: string) => void;
  filterStatus: "all" | "completed" | "pending" | "overdue";
  setFilterStatus: (s: "all" | "completed" | "pending" | "overdue") => void;
}

export const ChecklistFilterBar = memo(function ChecklistFilterBar({
  viewLayout,
  setViewLayout,
  taskSearch,
  setTaskSearch,
  filterCategory,
  setFilterCategory,
  filterPriority,
  setFilterPriority,
  filterStatus,
  setFilterStatus,
}: ChecklistFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 mb-6">
      {/* View Switcher & Search Bar */}
      <div className="flex items-center gap-3 flex-1">
        {/* Layout Switcher */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60 shrink-0">
          <button
            onClick={() => setViewLayout("category")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewLayout === "category" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-600"
            }`}
            title="Stage Accordion View"
          >
            <i className="ri-stack-line" />
            <span className="hidden sm:inline">Stages</span>
          </button>
          <button
            onClick={() => setViewLayout("list")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewLayout === "list" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-600"
            }`}
            title="Flat List View"
          >
            <i className="ri-list-check" />
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            onClick={() => setViewLayout("urgency")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewLayout === "urgency" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-600"
            }`}
            title="Urgency Grouping View"
          >
            <i className="ri-fire-line" />
            <span className="hidden sm:inline">Urgency</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={taskSearch}
            onChange={(e) => setTaskSearch(e.target.value)}
            placeholder="Search tasks by name, description, assignee..."
            className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
          />
          {taskSearch && (
            <button
              onClick={() => setTaskSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-close-circle-fill text-xs" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_META).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          <option value="all">All Priorities</option>
          {Object.entries(PRIORITY_META).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label} Priority
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>
    </div>
  );
});
