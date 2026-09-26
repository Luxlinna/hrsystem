import { useState, memo } from "react";

interface ScheduleMatrixToolbarProps {
  search: string;
  setSearch: (val: string) => void;
  dateRangeLabel: string;
  prevMonth: () => void;
  nextMonth: () => void;
  filterDept: string;
  setFilterDept: (val: string) => void;
  departmentList: string[];
  onViewModeChange?: (mode: string) => void;
}

export const ScheduleMatrixToolbar = memo(function ScheduleMatrixToolbar({
  search,
  setSearch,
  dateRangeLabel,
  prevMonth,
  nextMonth,
  filterDept,
  setFilterDept,
  departmentList,
  onViewModeChange,
}: ScheduleMatrixToolbarProps) {
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [rosterMenuOpen, setRosterMenuOpen] = useState(false);

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
          className="px-3 py-2 bg-[#2563EB] text-white rounded-r-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <i className="ri-search-line text-sm" />
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Roster View Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setRosterMenuOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer shadow-2xs"
          >
            <span>Roster</span>
            <i className={`ri-arrow-down-s-line text-gray-400 transition-transform ${rosterMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {rosterMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setRosterMenuOpen(false)} />
              <div className="absolute left-0 top-full mt-1.5 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 text-xs">
                <button
                  type="button"
                  onClick={() => setRosterMenuOpen(false)}
                  className="w-full px-3 py-2 text-left font-bold text-blue-600 bg-blue-50 flex items-center justify-between"
                >
                  <span>Monthly Roster</span>
                  <i className="ri-check-line font-bold" />
                </button>
                {onViewModeChange && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRosterMenuOpen(false);
                        onViewModeChange("week");
                      }}
                      className="w-full px-3 py-2 text-left font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <i className="ri-calendar-view text-gray-400" />
                      <span>Week Planner</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRosterMenuOpen(false);
                        onViewModeChange("day");
                      }}
                      className="w-full px-3 py-2 text-left font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <i className="ri-time-line text-gray-400" />
                      <span>Day View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRosterMenuOpen(false);
                        onViewModeChange("list");
                      }}
                      className="w-full px-3 py-2 text-left font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <i className="ri-list-check text-gray-400" />
                      <span>List View</span>
                    </button>
                  </>
                )}
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

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterMenuOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs ${
              filterDept !== "all"
                ? "border-blue-500 text-blue-600 bg-blue-50/50"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <i className="ri-filter-3-line text-gray-500" />
            <span>Filter</span>
            <i className="ri-arrow-down-s-line text-gray-400" />
          </button>

          {filterMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setFilterMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-30 p-3 space-y-2 text-xs">
                <p className="font-bold text-gray-900 text-[11px] uppercase tracking-wider">Department</p>
                <select
                  value={filterDept}
                  onChange={(e) => {
                    setFilterDept(e.target.value);
                    setFilterMenuOpen(false);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Departments</option>
                  {departmentList.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
