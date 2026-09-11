import { memo } from "react";
import type { CandidateApproval } from "../../../types";

interface TabProps {
  data: CandidateApproval;
  onChange: (updated: CandidateApproval) => void;
}

export const ApprovalEvaluationTab = memo(function ApprovalEvaluationTab({
  data,
  onChange,
}: TabProps) {
  const panels = data.interview_panels || [];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-extrabold text-gray-900">
        Section II: Candidate Evaluation Summary
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-gray-400 block mb-1">
            Education and Skill
          </label>
          <textarea
            rows={3}
            value={data.education_and_skill}
            onChange={(e) => onChange({ ...data, education_and_skill: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#253C7D] bg-white"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 block mb-1">
            Work Experience
          </label>
          <textarea
            rows={3}
            value={data.work_experience}
            onChange={(e) => onChange({ ...data, work_experience: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#253C7D] bg-white"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 block mb-1">
            Strengths
          </label>
          <textarea
            rows={3}
            value={data.strengths}
            onChange={(e) => onChange({ ...data, strengths: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#253C7D] bg-white"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 block mb-1">
            Improvement
          </label>
          <textarea
            rows={3}
            value={data.improvement}
            onChange={(e) => onChange({ ...data, improvement: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#253C7D] bg-white"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-gray-400 block mb-1">
          Overall Assessment
        </label>
        <textarea
          rows={3}
          value={data.overall_assessment}
          onChange={(e) => onChange({ ...data, overall_assessment: e.target.value })}
          className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#253C7D] bg-white"
        />
      </div>

      {/* Interview Panels Table */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-gray-700">
            Interview Panels
          </label>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...data,
                interview_panels: [
                  ...panels,
                  {
                    name: "Interviewer Name",
                    date_time: new Date().toLocaleDateString() + " 3:00PM",
                    position: "Panel Member",
                    signature: "Verified",
                  },
                ],
              })
            }
            className="text-[10px] text-[#253C7D] hover:text-[#1d3065] font-bold flex items-center gap-1 cursor-pointer"
          >
            <i className="ri-add-line" /> Add Panel
          </button>
        </div>

        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[10px] font-bold uppercase">
              <tr>
                <th className="p-2.5">Interview Panel</th>
                <th className="p-2.5">Date Time</th>
                <th className="p-2.5">Position</th>
                <th className="p-2.5">Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {panels.map((panel, idx) => (
                <tr key={idx}>
                  <td className="p-2">
                    <input
                      type="text"
                      value={panel.name}
                      onChange={(e) => {
                        const next = [...panels];
                        next[idx].name = e.target.value;
                        onChange({ ...data, interview_panels: next });
                      }}
                      className="w-full p-1 rounded-lg border border-gray-200 text-xs font-semibold"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={panel.date_time}
                      onChange={(e) => {
                        const next = [...panels];
                        next[idx].date_time = e.target.value;
                        onChange({ ...data, interview_panels: next });
                      }}
                      className="w-full p-1 rounded-lg border border-gray-200 text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={panel.position}
                      onChange={(e) => {
                        const next = [...panels];
                        next[idx].position = e.target.value;
                        onChange({ ...data, interview_panels: next });
                      }}
                      className="w-full p-1 rounded-lg border border-gray-200 text-xs"
                    />
                  </td>
                  <td className="p-2 text-center text-blue-900 italic font-medium">
                    {panel.signature || "Verified"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
