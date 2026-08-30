import { memo } from "react";
import type { DatePreset } from "../types";

interface AttendanceDateRangePickerProps {
  filterDatePreset: DatePreset;
  setFilterDatePreset: (preset: DatePreset) => void;
  singleDate: string;
  setSingleDate: (date: string) => void;
  fromDate: string;
  setFromDate: (date: string) => void;
  toDate: string;
  setToDate: (date: string) => void;
}

export const AttendanceDateRangePicker = memo(function AttendanceDateRangePicker({
  filterDatePreset,
  setFilterDatePreset,
  singleDate,
  setSingleDate,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
}: AttendanceDateRangePickerProps) {
  return (
    <>
      <select
        value={filterDatePreset}
        onChange={(e) => setFilterDatePreset(e.target.value as DatePreset)}
        className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold"
      >
        <option value="all">📅 All Historical Dates</option>
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="this_week">This Week</option>
        <option value="last_week">Last Week</option>
        <option value="this_month">This Month</option>
        <option value="last_month">Last Month</option>
        <option value="this_year">This Year</option>
        <option value="last_year">Last Year</option>
        <option value="single_date">Specific Date...</option>
        <option value="custom_range">Custom Date Range...</option>
      </select>

      {filterDatePreset === "single_date" && (
        <input
          type="date"
          value={singleDate}
          onChange={(e) => setSingleDate(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
        />
      )}

      {filterDatePreset === "custom_range" && (
        <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            placeholder="From"
            className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-[#253C7D]"
          />
          <span className="text-[10px] text-gray-400 font-bold">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            placeholder="To"
            className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      )}
    </>
  );
});
