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
  pageSize,
  setPageSize,
  setPage,
}: LeaveFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
      {/* Search Input */}
      <div className="relative flex-1">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search by employee name, role, department, reason..."
          className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setPage(1);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-circle-fill text-xs" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          <option value="all">All Statuses</option>
          {Object.keys(STATUS_CONFIG).map((s) => (
            <option key={s} value={s}>
              {STATUS_CONFIG[s].label}
            </option>
          ))}
        </select>

        <select
          value={leaveTypeFilter}
          onChange={(e) => {
            setLeaveTypeFilter(e.target.value);
            setPage(1);
          }}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          <option value="all">All Leave Types</option>
          {Object.keys(LEAVE_TYPE_CONFIG).map((t) => (
            <option key={t} value={t}>
              {LEAVE_TYPE_CONFIG[t].label}
            </option>
          ))}
        </select>

        {departments.length > 0 && (
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[140px] truncate"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}

        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
        </select>
      </div>
    </div>
  );
});
