import { memo, useState, useEffect, useCallback } from "react";
import type { Candidate, Interview, CandidateApproval } from "../../../types";
import {
  fetchBuEmployeesForCandidate,
  type BuEmployeeOption,
} from "../../../services/candidateApprovalService";
import {
  formatInterviewEndTime,
  extractFeedbackFromInterviews,
  parseInterviewPanelFromNotes,
} from "../../../utils/interviewPanelHelper";
import { toast } from "@/components/Toast";

interface TabProps {
  data: CandidateApproval;
  onChange: (updated: CandidateApproval) => void;
  candidate?: Candidate;
  interviews?: Interview[];
}

export const ApprovalEvaluationTab = memo(function ApprovalEvaluationTab({
  data,
  onChange,
  interviews = [],
}: TabProps) {
  const panels = data.interview_panels || [];
  const [buEmployees, setBuEmployees] = useState<BuEmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Fetch employees belonging to this candidate's Business Unit / Requisition Branch
  useEffect(() => {
    let active = true;
    setLoadingEmployees(true);
    fetchBuEmployeesForCandidate(data.branch_id, data.business_unit)
      .then((list) => {
        if (active) {
          setBuEmployees(list);
          setLoadingEmployees(false);
        }
      })
      .catch(() => {
        if (active) setLoadingEmployees(false);
      });

    return () => {
      active = false;
    };
  }, [data.branch_id, data.business_unit]);

  const handleInviteEmployee = useCallback(
    (empId: string) => {
      if (!empId) return;
      const emp = buEmployees.find((e) => e.id === empId);
      if (!emp) return;

      // Check if employee participated in any completed interview
      const matchingIv = interviews.find((iv) => {
        if (iv.interviewer_id === emp.id) return true;
        const { panelIds, panelMembers } = parseInterviewPanelFromNotes(iv.notes);
        if (panelIds.includes(emp.id)) return true;
        return panelMembers.some((m) => m.name.toLowerCase() === emp.name.toLowerCase());
      });

      const isCompleted = matchingIv
        ? matchingIv.status === "completed" || Boolean(matchingIv.feedback || matchingIv.score)
        : false;

      const dateFormatted = matchingIv
        ? formatInterviewEndTime(matchingIv.scheduled_at, matchingIv.duration_minutes || 60)
        : new Date().toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }) + " 3:00PM";

      const updated = [
        ...panels,
        {
          name: emp.name,
          date_time: dateFormatted,
          position: emp.role || emp.department || "Panel Member",
          signature: isCompleted ? "Signed" : "Verified",
        },
      ];

      onChange({ ...data, interview_panels: updated });
    },
    [buEmployees, panels, interviews, data, onChange]
  );

  const handleAddCustomPanel = useCallback(() => {
    const nowFormatted =
      new Date().toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) + " 3:00PM";

    onChange({
      ...data,
      interview_panels: [
        ...panels,
        {
          name: "",
          date_time: nowFormatted,
          position: "Panel Member",
          signature: "Verified",
        },
      ],
    });
  }, [panels, data, onChange]);

  const handleImportInterviews = useCallback(() => {
    if (!interviews || interviews.length === 0) return;

    const nextPanels = [...panels];

    for (const iv of interviews) {
      const isCompleted = iv.status === "completed" || Boolean(iv.feedback || iv.score);
      const endTimeFormatted = formatInterviewEndTime(iv.scheduled_at, iv.duration_minutes || 60);
      const signatureStatus = isCompleted ? "Signed" : "Verified";

      const { panelMembers } = parseInterviewPanelFromNotes(iv.notes);

      const membersToProcess: { name: string; role: string }[] =
        panelMembers.length > 0
          ? panelMembers.map((m) => ({ name: m.name, role: m.role || "Interviewer" }))
          : iv.employees
          ? [
              {
                name: `${iv.employees.first_name} ${iv.employees.last_name}`.trim(),
                role: iv.employees.role || iv.employees.department || "Hiring Manager",
              },
            ]
          : [];

      for (const m of membersToProcess) {
        if (!m.name) continue;
        const existingIdx = nextPanels.findIndex(
          (p) => p.name.trim().toLowerCase() === m.name.trim().toLowerCase()
        );

        const rawFb = (iv.feedback || "").toLowerCase();
        const cleanMName = m.name.trim().toLowerCase();
        const hasEvaluated =
          isCompleted &&
          (!rawFb.includes("[evaluation form:") ||
            rawFb.includes(`evaluator: ${cleanMName}`) ||
            rawFb.includes(cleanMName));

        const signatureVal = hasEvaluated ? "Signed" : "Verified";

        if (existingIdx >= 0) {
          nextPanels[existingIdx] = {
            ...nextPanels[existingIdx],
            date_time: endTimeFormatted,
            signature: hasEvaluated ? "Signed" : nextPanels[existingIdx].signature || "Verified",
            position: nextPanels[existingIdx].position || m.role,
          };
        } else {
          nextPanels.push({
            name: m.name,
            date_time: endTimeFormatted,
            position: m.role,
            signature: signatureVal,
          });
        }
      }
    }

    // Synthesize evaluator feedback
    const feedbackSynthesis = extractFeedbackFromInterviews(interviews);
    const updated = {
      ...data,
      interview_panels: nextPanels,
      strengths: feedbackSynthesis.strengths || data.strengths,
      improvement: feedbackSynthesis.improvement || data.improvement,
      overall_assessment: feedbackSynthesis.overallAssessment || data.overall_assessment,
    };

    onChange(updated);
    toast(
      "Evaluations & Panels Synced",
      "Interview panels updated to Signed with interview end time, and evaluator remarks fetched.",
      "success"
    );
  }, [interviews, panels, data, onChange]);

  const handleRemovePanel = useCallback(
    (index: number) => {
      const next = panels.filter((_, i) => i !== index);
      onChange({ ...data, interview_panels: next });
    },
    [panels, data, onChange]
  );

  const handleNameChange = useCallback(
    (idx: number, val: string) => {
      const next = [...panels];
      next[idx].name = val;

      // Autocomplete role/position if matches any BU employee
      const matched = buEmployees.find(
        (e) => e.name.toLowerCase() === val.trim().toLowerCase()
      );
      if (matched && matched.role) {
        next[idx].position = matched.role;
      }

      onChange({ ...data, interview_panels: next });
    },
    [panels, buEmployees, data, onChange]
  );

  const isMockName = (name: string) => {
    const lower = (name || "").trim().toLowerCase();
    return (
      lower.includes("meas chhengseang") ||
      lower.includes("sun reasey") ||
      lower.includes("interviewer name") ||
      lower === "panel member"
    );
  };

  const hasLegacyMockPanels = panels.some((p) => isMockName(p.name));

  const handleClearLegacyMocks = useCallback(() => {
    const cleaned = panels.filter((p) => !isMockName(p.name));
    onChange({ ...data, interview_panels: cleaned });
  }, [panels, data, onChange]);

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

      {/* Datalist for BU Employee Autocomplete */}
      <datalist id="bu-employees-datalist">
        {buEmployees.map((emp) => (
          <option key={emp.id} value={emp.name}>
            {emp.role} &bull; {emp.department}
          </option>
        ))}
      </datalist>

      {/* Dynamic Interview Panels Table */}
      <div className="pt-2 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-black text-gray-800 flex items-center gap-1.5">
              <i className="ri-team-line text-sm text-[#253C7D]" />
              Interview Panels
            </label>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D] border border-[#253C7D]/20">
              {data.business_unit || "Business Unit"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick clean button for legacy mock data */}
            {hasLegacyMockPanels && (
              <button
                type="button"
                onClick={handleClearLegacyMocks}
                className="text-[10px] text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Remove placeholder mock names"
              >
                <i className="ri-eraser-line" /> Clear Placeholder Names
              </button>
            )}

            {/* Sync from scheduled & completed candidate interviews */}
            {interviews && interviews.length > 0 && (
              <button
                type="button"
                onClick={handleImportInterviews}
                className="text-[10px] text-[#253C7D] bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Fetch completed interview evaluations, auto-mark Signed with end time, and import feedback"
              >
                <i className="ri-sparkling-line text-xs" />
                Import Evaluated & Scheduled ({interviews.length})
              </button>
            )}

            {/* Dynamic BU Employee Invitation Picker */}
            <div className="relative">
              <select
                disabled={loadingEmployees}
                onChange={(e) => {
                  handleInviteEmployee(e.target.value);
                  e.target.value = "";
                }}
                defaultValue=""
                className="text-[10px] font-bold bg-[#253C7D]/10 hover:bg-[#253C7D]/15 text-[#253C7D] border border-[#253C7D]/30 rounded-lg px-2.5 py-1 transition-colors cursor-pointer focus:outline-none"
              >
                <option value="" disabled>
                  {loadingEmployees
                    ? "Loading employees..."
                    : `+ Invite ${data.business_unit || "BU"} Employee (${buEmployees.length})`}
                </option>
                {buEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.role || emp.department || "Staff"}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Custom Blank Row */}
            <button
              type="button"
              onClick={handleAddCustomPanel}
              className="text-[10px] text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <i className="ri-add-line text-xs" /> Custom Panel
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          {panels.length === 0 ? (
            <div className="py-8 text-center text-gray-400 space-y-2">
              <i className="ri-user-add-line text-2xl text-gray-300" />
              <p className="text-xs font-bold text-gray-500">
                No interview panels added yet.
              </p>
              <p className="text-[10px] text-gray-400">
                Use the dropdown above to invite employees from{" "}
                <span className="font-semibold text-gray-600">
                  {data.business_unit || "this Business Unit"}
                </span>
                .
              </p>
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-2.5 pl-3">Interview Panel (Employee)</th>
                  <th className="p-2.5">Date Time</th>
                  <th className="p-2.5">Position</th>
                  <th className="p-2.5">Signature</th>
                  <th className="p-2.5 text-center w-10">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {panels.map((panel, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-2 pl-3">
                      <div className="relative">
                        <input
                          type="text"
                          list="bu-employees-datalist"
                          value={panel.name}
                          placeholder="Employee name or select from BU..."
                          onChange={(e) => handleNameChange(idx, e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-gray-200 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#253C7D] bg-white"
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={panel.date_time}
                        placeholder="e.g. 11 Sep 2026 3:00PM"
                        onChange={(e) => {
                          const next = [...panels];
                          next[idx].date_time = e.target.value;
                          onChange({ ...data, interview_panels: next });
                        }}
                        className="w-full p-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D] bg-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={panel.position}
                        placeholder="Role / Title"
                        onChange={(e) => {
                          const next = [...panels];
                          next[idx].position = e.target.value;
                          onChange({ ...data, interview_panels: next });
                        }}
                        className="w-full p-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D] bg-white"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={panel.signature || "Verified"}
                        onChange={(e) => {
                          const next = [...panels];
                          next[idx].signature = e.target.value;
                          onChange({ ...data, interview_panels: next });
                        }}
                        className="p-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-blue-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#253C7D]"
                      >
                        <option value="Verified">Verified</option>
                        <option value="Signed">Signed</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemovePanel(idx)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove panel member"
                      >
                        <i className="ri-delete-bin-line text-sm" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
});
