import React from "react";

interface LeaveTypeConditionSectionProps {
  eligibleFor: "both" | "male" | "female";
  setEligibleFor: (val: "both" | "male" | "female") => void;
}

export const LeaveTypeConditionSection: React.FC<LeaveTypeConditionSectionProps> = ({
  eligibleFor,
  setEligibleFor,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
      <h2 className="text-xs font-extrabold text-[#253C7D] uppercase tracking-wider mb-2">
        Condition
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <label className="md:col-span-3 text-xs font-bold text-gray-700">
          Eligible For (Entitlement Balance)
        </label>
        <div className="md:col-span-9">
          <select
            value={eligibleFor}
            onChange={(e) => setEligibleFor(e.target.value as "both" | "male" | "female")}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="both">Both (All Employees)</option>
            <option value="male">Male Only</option>
            <option value="female">Female Only</option>
          </select>
        </div>
      </div>
    </div>
  );
};
