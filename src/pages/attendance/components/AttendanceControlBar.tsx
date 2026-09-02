import { memo } from "react";
import type { DatePreset, ViewMode, WorkLocation, Employee } from "../types";
import { STATUS_CONFIG } from "../constants";
import { AttendanceDateRangePicker } from "./AttendanceDateRangePicker";

interface AttendanceControlBarProps {
  canManage: boolean;
  filteredRecordsCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterDatePreset: DatePreset;
  setFilterDatePreset: (preset: DatePreset) => void;
  singleDate: string;
  setSingleDate: (date: string) => void;
  fromDate: string;
  setFromDate: (date: string) => void;
  toDate: string;
  setToDate: (date: string) => void;
  departments: string[];
  filterDepartment: string;
  setFilterDepartment: (dept: string) => void;
  employees?: Employee[];
  filterEmployeeId?: string;
  setFilterEmployeeId?: (empId: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  workLocations: WorkLocation[];
  filterWorkLocation: string;
  setFilterWorkLocation: (id: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  todayYMD: string;
}

export const AttendanceControlBar = memo(function AttendanceControlBar({
  canManage,
  filteredRecordsCount,
  searchQuery,
  setSearchQuery,
  filterDatePreset,
  setFilterDatePreset,
  singleDate,
  setSingleDate,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  departments,
  filterDepartment,
  setFilterDepartment,
  employees = [],
  filterEmployeeId = "all",
  setFilterEmployeeId,
  filterStatus,
  setFilterStatus,
  workLocations,
  filterWorkLocation,
  setFilterWorkLocation,
  viewMode,
  setViewMode,
  todayYMD,
}: AttendanceControlBarProps) {
  const isFiltered =
    searchQuery ||
    filterDepartment !== "all" ||
    (filterEmployeeId && filterEmployeeId !== "all") ||
    filterStatus !== "all" ||
    filterWorkLocation !== "all" ||
    filterDatePreset !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterDepartment("all");
    if (setFilterEmployeeId) setFilterEmployeeId("all");
    setFilterStatus("all");
    setFilterWorkLocation("all");
    setFilterDatePreset("all");
    setFromDate("");
    setToDate("");
    setSingleDate(todayYMD);
  };

  // Filter employee list if a specific work location is selected
  const availableEmployees = filterWorkLocation === "all"
    ? employees
    : employees.filter((e) => !e.default_work_location_id || e.default_work_location_id === filterWorkLocation);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
      {/* Records Header / Count */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#253C7D]/10 text-[#253C7D] rounded-xl font-bold text-xs">
          <i className="ri-calendar-check-line text-sm" />
          <span>Attendance Records</span>
          <span className="bg-[#253C7D] text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold leading-none">
            {filteredRecordsCount}
          </span>
        </div>
      </div>

      {/* Filters: Search, Date Range, Work Site, Employee, Department, Status */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative w-full sm:w-44">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, notes..."
            className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-close-circle-fill text-xs" />
            </button>
          )}
        </div>

        <AttendanceDateRangePicker
          filterDatePreset={filterDatePreset}
          setFilterDatePreset={setFilterDatePreset}
          singleDate={singleDate}
          setSingleDate={setSingleDate}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
        />

        {/* Employee Filter */}
        {canManage && employees.length > 0 && setFilterEmployeeId && (
          <select
            value={filterEmployeeId}
            onChange={(e) => setFilterEmployeeId(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold max-w-[170px] truncate"
            title="Filter by specific employee"
          >
            <option value="all">All Employees ({availableEmployees.length})</option>
            {availableEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name} ({emp.role || emp.department || "Staff"})
              </option>
            ))}
          </select>
        )}

        {/* Department Filter */}
        {canManage && departments.length > 0 && (
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {isFiltered && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 text-xs font-bold transition-colors cursor-pointer"
            title="Reset Filters"
          >
            <i className="ri-refresh-line mr-1" />
            Reset
          </button>
        )}

        {/* View Mode Switcher */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "table" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-400 hover:text-gray-600"
            }`}
            title="Table View"
          >
            <i className="ri-table-line" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-400 hover:text-gray-600"
            }`}
            title="Cards View"
          >
            <i className="ri-grid-fill" />
          </button>
        </div>
      </div>
    </div>
  );
});
