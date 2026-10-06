import { memo } from "react";
import { LEAVE_TYPE_CONFIG, STATUS_CONFIG } from "../../constants";

interface LeaveFilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  leaveTypeFilter: string;
  setLeaveTypeFilter: (type: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (dept: string) => void;
  departments: string[];
  pageSize: number;
  setPageSize: (size: number) => void;
  setPage: (page: number) => void;
}

export const LeaveFilterBar = memo(function LeaveFilterBar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  leaveTypeFilter,
  setLeaveTypeFilter,
  departmentFilter,
  setDepartmentFilter,
  departments,
  pageSize: _pageSize,
  setPageSize: _setPageSize,
  setPage,
}: LeaveFilterBarProps) {
  return (
    <div className="hidden lg:flex bg-white rounded-xl border border-slate-200/80 p-2 sm:p-2.5 shadow-2xs flex-col md:flex-row md:items-center justify-between gap-2">
      {/* Search Input */}
      <div className="relative w-full md:max-w-xs">
        <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search employee or reason..."
          className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#253C7D] rounded-lg pl-7 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setPage(1);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <i className="ri-close-line text-xs" />
          </button>
        )}
      </div>

      {/* Filter Selects */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Leave Type */}
        <div className="relative flex-1 sm:flex-initial">
          <select
            value={leaveTypeFilter}
            onChange={(e) => {
              setLeaveTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full appearance-none px-3 py-1.5 pr-7 rounded-lg border border-slate-200/90 hover:border-slate-300 bg-white text-slate-700 text-xs font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer transition-colors"
          >
            <option value="all">All Leave Types</option>
            {Object.keys(LEAVE_TYPE_CONFIG).map((t) => (
              <option key={t} value={t}>
                {LEAVE_TYPE_CONFIG[t].label}
              </option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
        </div>

        {/* Department */}
        <div className="relative flex-1 sm:flex-initial">
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
            className="w-full appearance-none px-3 py-1.5 pr-7 rounded-lg border border-slate-200/90 hover:border-slate-300 bg-white text-slate-700 text-xs font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer transition-colors max-w-[140px] truncate"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
        </div>

        {/* Status */}
        <div className="relative flex-1 sm:flex-initial">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full appearance-none px-3 py-1.5 pr-7 rounded-lg border border-slate-200/90 hover:border-slate-300 bg-white text-slate-700 text-xs font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer transition-colors"
          >
            <option value="all">All Statuses</option>
            {Object.keys(STATUS_CONFIG).map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
        </div>
      </div>
    </div>
  );
});
