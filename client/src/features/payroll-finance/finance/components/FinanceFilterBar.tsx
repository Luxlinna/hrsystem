import { memo } from "react";
import type { Branch, DatePreset, ViewMode } from "../types";
import { CATEGORIES } from "../constants";
import { FinanceDateRangeInputs } from "./FinanceDateRangeInputs";

interface FinanceFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  branchFilter: string;
  setBranchFilter: (branch: string) => void;
  datePreset: DatePreset;
  setDatePreset: (preset: DatePreset) => void;
  fromDate: string;
  setFromDate: (date: string) => void;
  toDate: string;
  setToDate: (date: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  branches: Branch[];
  onResetPage: () => void;
}

export const FinanceFilterBar = memo(function FinanceFilterBar({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  branchFilter,
  setBranchFilter,
  datePreset,
  setDatePreset,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  viewMode,
  setViewMode,
  branches,
  onResetPage,
}: FinanceFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
      {/* Search Input */}
      <div className="relative w-full sm:w-60">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onResetPage();
          }}
          placeholder="Search category, desc, user..."
          className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all font-medium"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              onResetPage();
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
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            onResetPage();
          }}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold max-w-[140px] truncate"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            onResetPage();
          }}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
        </select>

        {branches.length > 0 && (
          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              onResetPage();
            }}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[130px] truncate font-medium"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={datePreset}
          onChange={(e) => {
            setDatePreset(e.target.value as DatePreset);
            onResetPage();
          }}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold"
        >
          <option value="all">📅 All Dates</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_quarter">This Quarter</option>
          <option value="this_year">This Year</option>
          <option value="last_year">Last Year</option>
          <option value="custom">Custom Range...</option>
        </select>

        <FinanceDateRangeInputs
          datePreset={datePreset}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
          onResetPage={onResetPage}
        />

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60 ml-1">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            title="Table View"
            className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewMode === "table" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-table-line" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            title="Cards View"
            className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-layout-grid-fill" />
          </button>
        </div>
      </div>
    </div>
  );
});
