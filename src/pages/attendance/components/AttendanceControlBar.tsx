import { useState, useRef, useEffect, memo } from "react";
import type { DatePreset, ViewMode, WorkLocation, Employee } from "../types";
import { STATUS_CONFIG } from "../constants";
import { AttendanceDateRangePicker } from "./AttendanceDateRangePicker";
import { formatBiometricId } from "@/lib/biometricUtils";

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
  onBulkSelectAll?: () => void;
  onBulkClear?: () => void;
}

function formatDMYStr(dStr?: string): string {
  if (!dStr) return "";
  const parts = dStr.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dStr;
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
  onBulkSelectAll,
  onBulkClear,
}: AttendanceControlBarProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const bulkMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) {
        setBulkMenuOpen(false);
      }
    }
    if (bulkMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [bulkMenuOpen]);

  const handleApplySearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchQuery(localSearch);
  };

  const handleResetFilters = () => {
    setLocalSearch("");
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

  const handlePrevDate = () => {
    if (filterDatePreset === "single" || (!fromDate && !toDate)) {
      const cur = new Date(singleDate || todayYMD);
      cur.setDate(cur.getDate() - 1);
      const prev = cur.toISOString().split("T")[0];
      setSingleDate(prev);
      setFilterDatePreset("single");
    } else {
      const start = new Date(fromDate || todayYMD);
      const end = new Date(toDate || todayYMD);
      const diff = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      start.setDate(start.getDate() - diff);
      end.setDate(end.getDate() - diff);
      setFromDate(start.toISOString().split("T")[0]);
      setToDate(end.toISOString().split("T")[0]);
      setFilterDatePreset("range");
    }
  };

  const handleNextDate = () => {
    if (filterDatePreset === "single" || (!fromDate && !toDate)) {
      const cur = new Date(singleDate || todayYMD);
      cur.setDate(cur.getDate() + 1);
      const next = cur.toISOString().split("T")[0];
      setSingleDate(next);
      setFilterDatePreset("single");
    } else {
      const start = new Date(fromDate || todayYMD);
      const end = new Date(toDate || todayYMD);
      const diff = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      start.setDate(start.getDate() + diff);
      end.setDate(end.getDate() + diff);
      setFromDate(start.toISOString().split("T")[0]);
      setToDate(end.toISOString().split("T")[0]);
      setFilterDatePreset("range");
    }
  };

  // Date label formatted e.g. 26/09/2026 - 26/09/2026
  const dateDisplayLabel = (() => {
    if (filterDatePreset === "single" || (!fromDate && !toDate)) {
      const d = formatDMYStr(singleDate || todayYMD);
      return `${d} - ${d}`;
    }
    if (fromDate && toDate) {
      return `${formatDMYStr(fromDate)} - ${formatDMYStr(toDate)}`;
    }
    return "All Dates";
  })();

  const isFiltered =
    searchQuery ||
    filterDepartment !== "all" ||
    (filterEmployeeId && filterEmployeeId !== "all") ||
    filterStatus !== "all" ||
    filterWorkLocation !== "all" ||
    filterDatePreset !== "all";

  const availableEmployees =
    filterWorkLocation === "all"
      ? employees
      : employees.filter(
          (e) => !e.default_work_location_id || e.default_work_location_id === filterWorkLocation
        );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-3.5 shadow-2xs mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* LEFT: Search bar with blue button */}
      <form onSubmit={handleApplySearch} className="flex items-center max-w-sm w-full">
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search..."
          className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-l-xl text-xs text-gray-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:border-[#253C7D] transition-colors"
        />
        <button
          type="submit"
          className="px-3.5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-r-xl border border-[#253C7D] transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
          title="Search"
        >
          <i className="ri-search-line text-sm" />
        </button>
      </form>

      {/* RIGHT: Bulk Action & Date Range Navigator */}
      <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
        {/* Bulk Action Dropdown */}
        <div ref={bulkMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setBulkMenuOpen((p) => !p)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            <span>Bulk Action</span>
            <i className="ri-arrow-down-s-line text-gray-400" />
          </button>

          {bulkMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-30 text-xs">
              <button
                type="button"
                onClick={() => {
                  setBulkMenuOpen(false);
                  if (onBulkSelectAll) onBulkSelectAll();
                }}
                className="w-full px-3 py-1.5 text-left text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-checkbox-line text-[#253C7D] dark:text-sky-400" />
                <span>Select All on Page</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkMenuOpen(false);
                  if (onBulkClear) onBulkClear();
                }}
                className="w-full px-3 py-1.5 text-left text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-checkbox-blank-line text-gray-400" />
                <span>Deselect All</span>
              </button>
              {isFiltered && (
                <button
                  type="button"
                  onClick={() => {
                    setBulkMenuOpen(false);
                    handleResetFilters();
                  }}
                  className="w-full px-3 py-1.5 text-left text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer border-t border-gray-100 dark:border-slate-700 mt-1 pt-1.5"
                >
                  <i className="ri-refresh-line text-gray-400" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Date Range Navigator: [ < ] [ 📅 26/09/2026 - 26/09/2026 ] [ > ] */}
        <div className="inline-flex items-center rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-2xs text-xs">
          <button
            type="button"
            onClick={handlePrevDate}
            className="px-2.5 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 border-r border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Previous Day / Period"
          >
            <i className="ri-arrow-left-s-line text-sm" />
          </button>

          <button
            type="button"
            onClick={() => setDatePickerOpen((p) => !p)}
            className="px-3 py-2 flex items-center gap-2 font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <i className="ri-calendar-line text-[#253C7D] dark:text-sky-400 text-xs" />
            <span>{dateDisplayLabel}</span>
          </button>

          <button
            type="button"
            onClick={handleNextDate}
            className="px-2.5 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 border-l border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Next Day / Period"
          >
            <i className="ri-arrow-right-s-line text-sm" />
          </button>
        </div>

        {/* Expanded date picker modal / popover if open */}
        {datePickerOpen && (
          <div className="fixed inset-0 bg-black/20 z-40 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl max-w-md w-full space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200">
                  Select Date Range
                </h4>
                <button
                  type="button"
                  onClick={() => setDatePickerOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                >
                  <i className="ri-close-line text-base" />
                </button>
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

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDatePickerOpen(false)}
                  className="px-3.5 py-1.5 bg-[#253C7D] text-white text-xs font-bold rounded-xl"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2.5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-xs text-gray-700 dark:text-slate-200 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium shadow-2xs"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
});
