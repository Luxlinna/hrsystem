import { memo } from "react";
import type { CandidateApproval } from "../../../types";

interface TabProps {
  data: CandidateApproval;
  onChange: (updated: CandidateApproval) => void;
}

export const ApprovalOverviewTab = memo(function ApprovalOverviewTab({
  data,
  onChange,
}: TabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-extrabold text-gray-900">
        Section I: Candidate & Role Overview
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="text-[10px] font-bold text-gray-400 block mb-1">
            Candidate Name
          </label>
          <input
            type="text"
            value={data.candidate_name}
            onChange={(e) => onChange({ ...data, candidate_name: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white font-bold"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 block mb-1">
            Gender
          </label>
          <select
            value={data.gender}
            onChange={(e) => onChange({ ...data, gender: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
          >
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 block mb-1">
            Position Applied for
          </label>
          <input
            type="text"
            value={data.position_applied}
            onChange={(e) => onChange({ ...data, position_applied: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white font-bold"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 block mb-1">
            Business Unit
          </label>
          <input
            type="text"
            value={data.business_unit}
            onChange={(e) => onChange({ ...data, business_unit: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 block mb-1">
            Department
          </label>
          <input
            type="text"
            value={data.department}
            onChange={(e) => onChange({ ...data, department: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 block mb-1">
            Hiring Manager
          </label>
          <input
            type="text"
            value={data.hiring_manager}
            onChange={(e) => onChange({ ...data, hiring_manager: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 block mb-1">
            Current Salary
          </label>
          <input
            type="text"
            value={data.current_salary}
            onChange={(e) => onChange({ ...data, current_salary: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white font-semibold"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 block mb-1">
            Expectation Salary
          </label>
          <input
            type="text"
            value={data.expectation_salary}
            onChange={(e) => onChange({ ...data, expectation_salary: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-sky-50 font-black text-sky-800"
          />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] font-bold text-gray-400 block mb-1">
            Current Benefit
          </label>
          <input
            type="text"
            value={data.current_benefit}
            onChange={(e) => onChange({ ...data, current_benefit: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
          />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] font-bold text-gray-400 block mb-1">
            Notice Period
          </label>
          <input
            type="text"
            value={data.notice_period}
            onChange={(e) => onChange({ ...data, notice_period: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
          />
        </div>
      </div>
    </div>
  );
});
