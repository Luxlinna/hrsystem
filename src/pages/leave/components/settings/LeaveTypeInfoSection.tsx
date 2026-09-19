import React from "react";

interface LeaveTypeInfoSectionProps {
  periodType: "daily" | "hourly";
  setPeriodType: (val: "daily" | "hourly") => void;
  code: string;
  setCode: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  rate: number;
  setRate: (val: number) => void;
  allowCompensatory: boolean;
  setAllowCompensatory: (val: boolean) => void;
  isUnpaid: boolean;
  setIsUnpaid: (val: boolean) => void;
}

export const LeaveTypeInfoSection: React.FC<LeaveTypeInfoSectionProps> = ({
  periodType,
  setPeriodType,
  code,
  setCode,
  name,
  setName,
  rate,
  setRate,
  allowCompensatory,
  setAllowCompensatory,
  isUnpaid,
  setIsUnpaid,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
      <h2 className="text-xs font-extrabold text-[#253C7D] uppercase tracking-wider mb-2">
        Leave Type Info
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <label className="md:col-span-3 text-xs font-bold text-gray-700">
          Period Type <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9 flex items-center gap-6">
          <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="radio"
              name="period_type"
              checked={periodType === "daily"}
              onChange={() => setPeriodType("daily")}
              className="accent-[#253C7D]"
            />
            Daily
          </label>
          <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="radio"
              name="period_type"
              checked={periodType === "hourly"}
              onChange={() => setPeriodType("hourly")}
              className="accent-[#253C7D]"
            />
            Hourly
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <label className="md:col-span-3 text-xs font-bold text-gray-700">
          Leave Type Code <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9">
          <input
            type="text"
            required
            placeholder="e.g. AL, SL, CL"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <label className="md:col-span-3 text-xs font-bold text-gray-700">
          Leave Type Name <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9">
          <input
            type="text"
            required
            placeholder="e.g. Annual Leave, Compensatory Leave"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <label className="md:col-span-3 text-xs font-bold text-gray-700">Rate *</label>
        <div className="md:col-span-9">
          <input
            type="number"
            step="0.1"
            min="0"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      <div className="md:col-start-4 md:col-span-9 space-y-2 pt-1">
        <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={allowCompensatory}
            onChange={(e) => setAllowCompensatory(e.target.checked)}
            className="accent-[#253C7D] rounded"
          />
          Allow compensatory leave
        </label>
        <div>
          <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={isUnpaid}
              onChange={(e) => setIsUnpaid(e.target.checked)}
              className="accent-[#253C7D] rounded"
            />
            Unpaid Leave
          </label>
        </div>
      </div>
    </div>
  );
};
