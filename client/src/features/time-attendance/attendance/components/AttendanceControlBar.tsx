import { memo } from "react";
import type { DatePreset, ViewMode, WorkLocation } from "../types";
import { AttendanceDateRangePicker } from "./AttendanceDateRangePicker";
import { AttendanceFilterSelects } from "./AttendanceFilterSelects";

interface AttendanceControlBarProps {
  canManage: boolean;
  filteredRecordsCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterDatePreset: DatePreset;
  setFilterDatePreset: (preset: DatePreset) => void;
  singleDate: string; setSingleDate: (date: string) => void;
  fromDate: string; setFromDate: (date: string) => void;
  toDate: string; setToDate: (date: string) => void;
  departments: string[]; filterDepartment: string; setFilterDepartment: (dept: string) => void;
  roles?: string[]; filterRole?: string; setFilterRole?: (role: string) => void;
  employmentTypes?: string[]; filterEmploymentType?: string; setFilterEmploymentType?: (type: string) => void;
  employeeLevels?: string[]; filterEmployeeLevel?: string; setFilterEmployeeLevel?: (level: string) => void;
  filterStatus: string; setFilterStatus: (status: string) => void;
  workLocations: WorkLocation[];
  branches?: { id: string; name: string }[];
  filterBranch?: string; setFilterBranch?: (branch: string) => void;
  filterWorkLocation: string; setFilterWorkLocation: (id: string) => void;
  viewMode?: ViewMode; setViewMode?: (mode: ViewMode) => void;
  todayYMD: string;
}

export const AttendanceControlBar = memo(function AttendanceControlBar({
  filteredRecordsCount, searchQuery, setSearchQuery, filterDatePreset, setFilterDatePreset,
  singleDate, setSingleDate, fromDate, setFromDate, toDate, setToDate,
  departments, filterDepartment, setFilterDepartment, roles = [], filterRole = "all", setFilterRole,
  employmentTypes = [], filterEmploymentType = "all", setFilterEmploymentType,
  employeeLevels = [], filterEmployeeLevel = "", setFilterEmployeeLevel,
  filterStatus, setFilterStatus, workLocations, branches = [],
  filterBranch = "", setFilterBranch,
  filterWorkLocation, setFilterWorkLocation,
  todayYMD,
}: AttendanceControlBarProps) {
  const isFiltered = Boolean(
    searchQuery || (filterBranch && filterBranch !== "all") || (filterDepartment && filterDepartment !== "all") || (filterRole && filterRole !== "all") ||
    (filterEmploymentType && filterEmploymentType !== "all") || Boolean(filterEmployeeLevel) ||
    (filterStatus && filterStatus !== "all") || (filterWorkLocation && filterWorkLocation !== "all") ||
    (filterDatePreset && filterDatePreset !== "all")
  );

  const handleResetFilters = () => {
    setSearchQuery(""); setFilterBranch?.(""); setFilterDepartment("all"); setFilterRole?.("all");
    setFilterEmploymentType?.("all"); setFilterEmployeeLevel?.(""); setFilterStatus("all");
    setFilterWorkLocation("all"); setFilterDatePreset("all"); setFromDate(""); setToDate(""); setSingleDate(todayYMD);
    if (typeof window !== "undefined") {
      localStorage.removeItem("hrm_attendance_filters_v1");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 pb-3 pt-1 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Records Count Pill */}
        <div className="px-3.5 py-1 rounded-full bg-slate-100/90 dark:bg-slate-800 text-xs font-semibold text-[#253C7D] dark:text-sky-300 flex items-center gap-2 shadow-2xs">
          <i className="ri-calendar-check-line text-xs text-[#253C7D] dark:text-sky-400" />
          <span>Attendance Records</span>
          <span className="px-2 py-0.2 rounded-full bg-[#253C7D] text-white text-[10px] font-bold">
            {filteredRecordsCount}
          </span>
        </div>

        {/* Right: Search, Date Range, Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1 h-8 w-56 md:w-64 focus-within:border-[#253C7D] shadow-2xs">
            <i className="ri-search-line text-slate-400 text-xs mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, notes"
              className="flex-1 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 bg-transparent focus:outline-none"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <i className="ri-close-line text-xs" />
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
            todayYMD={todayYMD}
          />

          <AttendanceFilterSelects
            departments={departments}
            filterDepartment={filterDepartment}
            setFilterDepartment={setFilterDepartment}
            roles={roles}
            filterRole={filterRole}
            setFilterRole={setFilterRole}
            employmentTypes={employmentTypes}
            filterEmploymentType={filterEmploymentType}
            setFilterEmploymentType={setFilterEmploymentType}
            employeeLevels={employeeLevels}
            filterEmployeeLevel={filterEmployeeLevel}
            setFilterEmployeeLevel={setFilterEmployeeLevel}
            workLocations={workLocations}
            branches={branches}
            filterBranch={filterBranch}
            setFilterBranch={setFilterBranch}
            filterWorkLocation={filterWorkLocation}
            setFilterWorkLocation={setFilterWorkLocation}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
          />

          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
              title="Reset Filters"
            >
              <i className="ri-refresh-line text-xs" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
