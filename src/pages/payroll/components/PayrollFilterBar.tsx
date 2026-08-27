import { memo } from "react";
import { formatMonthLabel } from "../payrollUtils";

interface PayrollFilterBarProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  periodMode: "month" | "all";
  setPeriodMode: (mode: "month" | "all") => void;
  availableMonths: string[];
  departments: string[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterDepartment: string;
  setFilterDepartment: (d: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  viewMode: "table" | "cards";
  setViewMode: (v: "table" | "cards") => void;
  onNavigateMonth: (offset: number) => void;
}

export const PayrollFilterBar = memo(function PayrollFilterBar({
  selectedMonth,
  setSelectedMonth,
  periodMode,
  setPeriodMode,
  availableMonths,
  departments,
  searchQuery,
  setSearchQuery,
  filterDepartment,
  setFilterDepartment,
  filterStatus,
  setFilterStatus,
  viewMode,
  setViewMode,
  onNavigateMonth,
}: PayrollFilterBarProps) {
  const selectedMonthLabel = formatMonthLabel(selectedMonth);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-700 p-4 sm:p-5 shadow-2xs space-y-3.5 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Month Selector & Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl border border-gray-200/60 dark:border-slate-700">
            <button
              onClick={() => onNavigateMonth(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-xl text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer"
              title="Previous Month"
            >
              <i className="ri-arrow-left-s-line text-base" />
            </button>

            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPeriodMode("month");
              }}
              className="px-2.5 py-1 bg-transparent text-xs font-black text-gray-800 dark:text-white focus:outline-none cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m} className="dark:bg-slate-900">
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>

            <button
              onClick={() => onNavigateMonth(1)}
              className="w-7 h-7 flex items-center justify-center rounded-xl text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer"
              title="Next Month"
            >
              <i className="ri-arrow-right-s-line text-base" />
            </button>
          </div>

          {/* Period Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl border border-gray-200/60 dark:border-slate-700 text-xs">
            <button
              onClick={() => setPeriodMode("month")}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                periodMode === "month"
                  ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-300 shadow-2xs font-extrabold"
                  : "text-gray-500 dark:text-slate-400"
              }`}
            >
              {selectedMonthLabel}
            </button>
            <button
              onClick={() => setPeriodMode("all")}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                periodMode === "all"
                  ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-300 shadow-2xs font-extrabold"
                  : "text-gray-500 dark:text-slate-400"
              }`}
            >
              All Periods
            </button>
          </div>
        </div>

        {/* View Switcher: Table vs Cards */}
        <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200/60 dark:border-slate-700 self-end lg:self-auto">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "table"
                ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-300 shadow-xs"
                : "text-gray-500 dark:text-slate-400"
            }`}
          >
            <i className="ri-table-line" />
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "cards"
                ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-300 shadow-xs"
                : "text-gray-500 dark:text-slate-400"
            }`}
          >
            <i className="ri-grid-line" />
            <span className="hidden sm:inline">Cards</span>
          </button>
        </div>
      </div>

      {/* Filter Row: Search & Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100 dark:border-slate-800">
        {/* Search */}
        <div className="relative">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee, role, or month..."
            className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#253C7D] font-medium"
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

        {/* Department Filter */}
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-700 dark:text-slate-200 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-700 dark:text-slate-200 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="processed">Processed</option>
          <option value="pending">Pending</option>
        </select>
      </div>
    </div>
  );
});
