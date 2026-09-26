import { memo, useState } from "react";
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
  const [deductFrom, setDeductFrom] = useState("all");

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 p-3 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      {/* Search Input with Integrated Blue Search Button */}
      <div className="flex items-center w-full lg:max-w-xs border border-gray-300 rounded-lg overflow-hidden focus-within:border-[#253C7D] transition-colors">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search..."
          className="flex-1 px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setPage(1);
            }}
            className="px-1.5 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-line text-xs" />
          </button>
        )}
        <button
          type="button"
          className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center cursor-pointer transition-colors"
          title="Search"
        >
          <i className="ri-search-line text-xs" />
        </button>
      </div>

      {/* Pill Filter Buttons Matching Screenshot */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Bulk Action */}
        <div className="relative">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-sky-300 hover:border-sky-400 bg-white text-sky-600 text-xs font-medium cursor-pointer transition-colors"
          >
            <span>Bulk Action</span>
            <i className="ri-arrow-down-s-line text-xs" />
          </button>
        </div>

        {/* Cloud Download (Export) */}
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById("leave-export-trigger");
            if (el) el.click();
          }}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-sky-300 hover:border-sky-400 bg-white text-sky-600 text-sm cursor-pointer transition-colors"
          title="Export Leaves"
        >
          <i className="ri-cloud-line" />
        </button>

        {/* Cloud Upload (Import) */}
        <button
          type="button"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-sky-300 hover:border-sky-400 bg-white text-sky-600 text-sm cursor-pointer transition-colors"
          title="Import Leaves"
        >
          <i className="ri-upload-cloud-2-line" />
        </button>

        {/* Deduct From */}
        <div className="relative">
          <select
            value={deductFrom}
            onChange={(e) => setDeductFrom(e.target.value)}
            className="appearance-none px-3 py-1.5 pr-6 rounded-full border border-sky-300 hover:border-sky-400 bg-white text-sky-600 text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">Deduct From</option>
            <option value="annual">Annual Leave</option>
            <option value="unpaid">Unpaid Leave</option>
            <option value="sick">Sick Leave</option>
          </select>
          <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-sky-600 text-xs pointer-events-none" />
        </div>

        {/* Leave Type */}
        <div className="relative">
          <select
            value={leaveTypeFilter}
            onChange={(e) => {
              setLeaveTypeFilter(e.target.value);
              setPage(1);
            }}
            className="appearance-none px-3 py-1.5 pr-6 rounded-full border border-sky-300 hover:border-sky-400 bg-white text-sky-600 text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">Leave Type</option>
            {Object.keys(LEAVE_TYPE_CONFIG).map((t) => (
              <option key={t} value={t}>
                {LEAVE_TYPE_CONFIG[t].label}
              </option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-sky-600 text-xs pointer-events-none" />
        </div>

        {/* Filter (Department) */}
        <div className="relative">
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
            className="appearance-none px-3 py-1.5 pr-6 rounded-full border border-sky-300 hover:border-sky-400 bg-white text-sky-600 text-xs font-medium focus:outline-none cursor-pointer max-w-[130px] truncate"
          >
            <option value="all">Filter</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-sky-600 text-xs pointer-events-none" />
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="appearance-none px-3 py-1.5 pr-6 rounded-full border border-sky-300 hover:border-sky-400 bg-white text-sky-600 text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">Status</option>
            {Object.keys(STATUS_CONFIG).map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-sky-600 text-xs pointer-events-none" />
        </div>
      </div>
    </div>
  );
});
