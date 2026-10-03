import { memo } from "react";
import type { DatePreset } from "../types";

interface FinanceDateRangeInputsProps {
  datePreset: DatePreset;
  fromDate: string;
  setFromDate: (date: string) => void;
  toDate: string;
  setToDate: (date: string) => void;
  onResetPage: () => void;
}

export const FinanceDateRangeInputs = memo(function FinanceDateRangeInputs({
  datePreset,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  onResetPage,
}: FinanceDateRangeInputsProps) {
  if (datePreset !== "custom") return null;

  return (
    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-xl">
      <span className="text-[10px] text-gray-400 font-bold uppercase">From:</span>
      <input
        type="date"
        value={fromDate}
        onChange={(e) => {
          setFromDate(e.target.value);
          onResetPage();
        }}
        className="bg-transparent text-xs text-gray-700 font-semibold focus:outline-none cursor-pointer"
      />
      <span className="text-[10px] text-gray-400 font-bold uppercase ml-1">To:</span>
      <input
        type="date"
        value={toDate}
        onChange={(e) => {
          setToDate(e.target.value);
          onResetPage();
        }}
        className="bg-transparent text-xs text-gray-700 font-semibold focus:outline-none cursor-pointer"
      />
    </div>
  );
});
