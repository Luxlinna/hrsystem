import { useState, memo } from "react";
import type { MatrixViewMode } from "./types";
import { FilterFlyoutMenu } from "../filters/FilterFlyoutMenu";
import type { WorkLocation } from "../../types";

interface ScheduleMatrixToolbarProps {
  search: string;
  setSearch: (val: string) => void;
  dateRangeLabel: string;
  prevMonth: () => void;
  nextMonth: () => void;
  filterDept: string;
  setFilterDept: (val: string) => void;
  filterWorkLocation: string;
  setFilterWorkLocation: (val: string) => void;
  filterRole: string;
  setFilterRole: (val: string) => void;
  filterEmploymentType: string;
  setFilterEmploymentType: (val: string) => void;
  filterEmployeeLevel: string;
  setFilterEmployeeLevel: (val: string) => void;
  departmentList: string[];
  branches: { id: string; name: string }[];
  workLocations: { id: string; name: string; branch_id: string }[];
  filterBranch?: string;
  setFilterBranch?: (val: string) => void;
  positionList: string[];
  employeeTypeList: string[];
  employeeLevelList: string[];
  matrixViewMode?: MatrixViewMode;
  setMatrixViewMode?: (mode: MatrixViewMode) => void;
  onViewModeChange?: (mode: string) => void;
}

export const ScheduleMatrixToolbar = memo(function ScheduleMatrixToolbar({
  search,
  setSearch,
  dateRangeLabel,
  prevMonth,
  nextMonth,
  filterBranch,
  setFilterBranch,
  filterDept,
  setFilterDept,
  filterWorkLocation,
  setFilterWorkLocation,
  filterRole,
  setFilterRole,
  filterEmploymentType,
  setFilterEmploymentType,
  filterEmployeeLevel,
  setFilterEmployeeLevel,
  departmentList,
  branches,
  workLocations,
  positionList,
  employeeTypeList,
  employeeLevelList,
  matrixViewMode = "timesheet",
  setMatrixViewMode,
}: ScheduleMatrixToolbarProps) {
  const [viewMenuOpen, setViewMenuOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="flex items-center w-full sm:w-80">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="flex-1 px-3.5 py-2 text-xs border border-r-0 border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        />
        <button
          type="button"
          className="px-3.5 py-2 bg-[#253C7D] text-white rounded-r-lg hover:bg-[#1E3064] transition-colors cursor-pointer"
        >
          <i className="ri-search-line text-sm" />
        </button>
      </div>

      {/* Timesheet Indicator Legend */}
      {matrixViewMode === "timesheet" && (
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full text-[11px] text-gray-500 shadow-2xs font-mono select-none">
          <span className="flex items-center gap-1 font-semibold text-gray-700">
            <span className="w-3.5 h-3.5 bg-[#253C7D] text-white text-[8px] flex items-center justify-center rounded-[2px] font-bold">S</span>
            Scheduled
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1 font-semibold text-gray-700">
            <span className="w-3.5 h-3.5 bg-white border border-[#253C7D]/50 text-[#253C7D] text-[8px] flex items-center justify-center rounded-[2px] font-bold">C</span>
            Clocked
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1 font-semibold text-gray-700">
            <span className="w-3.5 h-3.5 bg-[#1E3064] text-white text-[8px] flex items-center justify-center rounded-[2px] font-bold">L</span>
            Deficit
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1 font-semibold text-gray-700">
            <span className="w-3.5 h-3.5 bg-[#1E293B] text-white text-[8px] flex items-center justify-center rounded-[2px] font-bold">O</span>
            OFF
          </span>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* View Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setViewMenuOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#253C7D] text-white rounded-full text-xs font-bold hover:bg-[#1E3064] cursor-pointer shadow-xs transition-colors"
          >
            <span>{matrixViewMode === "timesheet" ? "Time Sheet" : "Roster"}</span>
            <i className={`ri-arrow-down-s-line text-white/90 transition-transform ${viewMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {viewMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setViewMenuOpen(false)} />
              <div className="absolute left-0 top-full mt-1.5 w-36 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1 text-xs select-none">
                <button
                  type="button"
                  onClick={() => { setMatrixViewMode?.("roster"); setViewMenuOpen(false); }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between cursor-pointer ${matrixViewMode === "roster" ? "font-bold text-[#253C7D] bg-indigo-50/70" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <span>Roster</span>
                  {matrixViewMode === "roster" && <i className="ri-check-line text-[#253C7D] font-bold" />}
                </button>
                <button
                  type="button"
                  onClick={() => { setMatrixViewMode?.("timesheet"); setViewMenuOpen(false); }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between cursor-pointer ${matrixViewMode === "timesheet" ? "font-bold text-[#253C7D] bg-indigo-50/70" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <span>Time Sheet</span>
                  {matrixViewMode === "timesheet" && <i className="ri-check-line text-[#253C7D] font-bold" />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Month Navigator */}
        <div className="inline-flex items-center bg-white border border-gray-300 rounded-lg shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={prevMonth}
            title="Previous Month"
            className="px-2 py-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-900 border-r border-gray-200 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-s-line text-sm" />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-white min-w-[210px] justify-center">
            <i className="ri-calendar-line text-blue-500" />
            <span>{dateRangeLabel}</span>
          </div>
          <button
            type="button"
            onClick={nextMonth}
            title="Next Month"
            className="px-2 py-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-900 border-l border-gray-200 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-right-s-line text-sm" />
          </button>
        </div>

        {/* Full Filter — identical to Attendance Logs */}
        <FilterFlyoutMenu
          filterBranch={filterBranch}
          setFilterBranch={setFilterBranch}
          filterWorkLocation={filterWorkLocation}
          setFilterWorkLocation={setFilterWorkLocation}
          filterDepartment={filterDept}
          setFilterDepartment={setFilterDept}
          filterRole={filterRole}
          setFilterRole={setFilterRole}
          filterEmploymentType={filterEmploymentType}
          setFilterEmploymentType={setFilterEmploymentType}
          filterEmployeeLevel={filterEmployeeLevel}
          setFilterEmployeeLevel={setFilterEmployeeLevel}
          branches={branches}
          workLocations={workLocations as WorkLocation[]}
          depts={departmentList}
          positions={positionList}
          employeeTypes={employeeTypeList}
          employeeLevels={employeeLevelList}
        />
      </div>
    </div>
  );
});
