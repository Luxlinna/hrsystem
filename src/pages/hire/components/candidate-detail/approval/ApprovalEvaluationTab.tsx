import { memo, useState, useEffect, useCallback } from "react";
import type { Candidate, Interview, CandidateApproval } from "../../../types";
import {
  fetchBuEmployeesForCandidate,
  type BuEmployeeOption,
} from "../../../services/candidateApprovalService";

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

      const nowFormatted =
        new Date().toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) + " 3:00PM";

      const updated = [
        ...panels,
        {
          name: emp.name,
          date_time: nowFormatted,
          position: emp.role || emp.department || "Panel Member",
          signature: "Verified",
        },
      ];

      onChange({ ...data, interview_panels: updated });
    },
    [buEmployees, panels, data, onChange]
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
    const existingNames = new Set(panels.map((p) => p.name.trim().toLowerCase()));

    const imported = interviews
      .filter((iv) => {
        const empName = iv.employees
          ? `${iv.employees.first_name} ${iv.employees.last_name}`.trim()
          : "";
        return empName && !existingNames.has(empName.toLowerCase());
      })
      .map((iv) => {
        const empName = `${iv.employees!.first_name} ${iv.employees!.last_name}`.trim();
        const dt = iv.scheduled_at
          ? new Date(iv.scheduled_at).toLocaleString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Completed";
        const pos =
          iv.type === "hr" || (iv.notes || "").toLowerCase().includes("hr")
            ? "HR Recruiter"
            : iv.type === "technical"
            ? "Technical Lead"
            : "Executive Interviewer";

        return {
          name: empName,
          date_time: dt,
          position: pos,
          signature: "Verified",
        };
      });

    if (imported.length > 0) {
      onChange({ ...data, interview_panels: [...panels, ...imported] });
    }
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

  const hasLegacyMockPanels = panels.some(
    (p) => p.name.includes("Meas Chhengseang") || p.name.includes("Sun Reasey")
  );

  const handleClearLegacyMocks = useCallback(() => {
    const cleaned = panels.filter(
      (p) => !p.name.includes("Meas Chhengseang") && !p.name.includes("Sun Reasey")
    );
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

            {/* Sync from scheduled candidate interviews */}
            {interviews && interviews.length > 0 && (
              <button
                type="button"
                onClick={handleImportInterviews}
                className="text-[10px] text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Import interviewers from scheduled candidate interviews"
              >
                <i className="ri-calendar-check-line text-xs" />
                Import Scheduled ({interviews.length})
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
