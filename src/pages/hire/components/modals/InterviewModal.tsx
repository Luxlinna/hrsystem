import { memo, useState, useEffect, useMemo, useCallback } from "react";
import type { Candidate, Interview, NewInterviewFormState } from "../../types";
import {
  fetchBuEmployeesForCandidate,
  resolveCandidateRequisitionDetails,
  type BuEmployeeOption,
} from "../../services/candidateApprovalService";
import {
  serializeInterviewPanelNotes,
  parseInterviewPanelFromNotes,
  type PanelMemberSummary,
} from "../../utils/interviewPanelHelper";

interface InterviewModalProps {
  isOpen: boolean;
  editingInterview: Interview | null;
  form: NewInterviewFormState;
  setForm: React.Dispatch<React.SetStateAction<NewInterviewFormState>>;
  candidates: Candidate[];
  schedulingInterview: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const InterviewModal = memo(function InterviewModal({
  isOpen,
  editingInterview,
  form,
  setForm,
  candidates,
  schedulingInterview,
  onClose,
  onSubmit,
}: InterviewModalProps) {
  const [buEmployees, setBuEmployees] = useState<BuEmployeeOption[]>([]);
  const [buName, setBuName] = useState<string>("");
  const [loadingBuEmployees, setLoadingBuEmployees] = useState<boolean>(false);

  // If only 1 candidate passed (e.g. CandidateDetail page) and form.candidate_id is empty, auto-select
  useEffect(() => {
    if (isOpen && !form.candidate_id && candidates.length === 1) {
      setForm((prev) => ({ ...prev, candidate_id: candidates[0].id }));
    }
  }, [isOpen, form.candidate_id, candidates, setForm]);

  // Selected candidate object
  const selectedCandidate = useMemo(() => {
    return (
      candidates.find((c) => c.id === form.candidate_id) ||
      (candidates.length === 1 ? candidates[0] : null)
    );
  }, [candidates, form.candidate_id]);

  // Parse existing stage from notes
  const currentStageKey = useMemo(() => {
    if (form.notes?.includes("Stage: hr_interview")) return "hr_interview";
    if (form.notes?.includes("Stage: hiring_manager_interview")) return "hiring_manager_interview";
    if (form.notes?.includes("Stage: final_interview")) return "final_interview";
    return "hr_interview";
  }, [form.notes]);

  // Selected panel members list
  const selectedPanelMembers = useMemo<PanelMemberSummary[]>(() => {
    const list: PanelMemberSummary[] = [];
    const ids = form.interviewer_ids || (form.interviewer_id ? [form.interviewer_id] : []);
    const names = form.interviewer_names || (form.interviewer_name ? [form.interviewer_name] : []);

    ids.forEach((id, idx) => {
      const matchEmp = buEmployees.find((e) => e.id === id);
      const name = names[idx] || matchEmp?.name || "Interviewer";
      const role = matchEmp?.role || matchEmp?.department || "";
      list.push({ id, name, role });
    });

    // If there are names without IDs (e.g. from parsed notes)
    if (names.length > ids.length) {
      for (let i = ids.length; i < names.length; i++) {
        list.push({ name: names[i] });
      }
    }

    return list;
  }, [form.interviewer_ids, form.interviewer_names, form.interviewer_id, form.interviewer_name, buEmployees]);

  // Fetch employees from candidate's requisition Business Unit
  useEffect(() => {
    let isCancelled = false;

    async function loadBuInterviewers() {
      if (!isOpen || !selectedCandidate) {
        setBuEmployees([]);
        setBuName("");
        return;
      }

      setLoadingBuEmployees(true);
      try {
        const details = await resolveCandidateRequisitionDetails(selectedCandidate);
        if (isCancelled) return;

        const resolvedBuName =
          details.businessUnit ||
          selectedCandidate.job_postings?.branches?.name ||
          "Business Unit";
        setBuName(resolvedBuName);

        const emps = await fetchBuEmployeesForCandidate(
          details.branchId || selectedCandidate.job_postings?.branch_id,
          resolvedBuName
        );

        if (isCancelled) return;
        setBuEmployees(emps);

        // Pre-fill if empty
        const hasExisting = Boolean(
          form.interviewer_id ||
          (form.interviewer_ids && form.interviewer_ids.length > 0)
        );

        if (!hasExisting && emps.length > 0) {
          // If notes already has a panel, parse it
          const parsed = parseInterviewPanelFromNotes(form.notes);
          if (parsed.panelMembers.length > 0) {
            const matchedIds = parsed.panelIds.length > 0 ? parsed.panelIds : [];
            const matchedNames = parsed.panelMembers.map((m) => m.name);
            setForm((prev) => ({
              ...prev,
              interviewer_id: matchedIds[0] || "",
              interviewer_name: matchedNames[0] || "",
              interviewer_ids: matchedIds,
              interviewer_names: matchedNames,
            }));
          } else if (details.hiringManager) {
            const matchHiringMgr = emps.find(
              (e) =>
                e.name.toLowerCase().includes(details.hiringManager.toLowerCase()) ||
                details.hiringManager.toLowerCase().includes(e.name.toLowerCase())
            );
            if (matchHiringMgr) {
              setForm((prev) => ({
                ...prev,
                interviewer_id: matchHiringMgr.id,
                interviewer_name: matchHiringMgr.name,
                interviewer_ids: [matchHiringMgr.id],
                interviewer_names: [matchHiringMgr.name],
              }));
            }
          }
        }
      } catch (err) {
        console.warn("Could not load BU employees for interview invite:", err);
      } finally {
        if (!isCancelled) setLoadingBuEmployees(false);
      }
    }

    loadBuInterviewers();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, selectedCandidate?.id]);

  // Handler to add an interviewer to the panel
  const handleAddInterviewer = useCallback(
    (empId: string) => {
      if (!empId) return;
      const emp = buEmployees.find((e) => e.id === empId);
      if (!emp) return;

      const currentIds = form.interviewer_ids || (form.interviewer_id ? [form.interviewer_id] : []);
      const currentNames = form.interviewer_names || (form.interviewer_name ? [form.interviewer_name] : []);

      if (currentIds.includes(emp.id)) return;

      const newIds = [...currentIds, emp.id];
      const newNames = [...currentNames, emp.name];

      // Update notes tag
      const { cleanNotes } = parseInterviewPanelFromNotes(form.notes);
      const members: PanelMemberSummary[] = newIds.map((id, i) => {
        const found = buEmployees.find((e) => e.id === id);
        return {
          id,
          name: newNames[i] || found?.name || "Interviewer",
          role: found?.role || found?.department || "",
        };
      });

      const updatedNotes = serializeInterviewPanelNotes({
        notes: cleanNotes,
        stageKey: currentStageKey,
        panelMembers: members,
      });

      setForm((prev) => ({
        ...prev,
        interviewer_id: newIds[0] || "",
        interviewer_name: newNames[0] || "",
        interviewer_ids: newIds,
        interviewer_names: newNames,
        notes: updatedNotes,
      }));
    },
    [buEmployees, form.interviewer_ids, form.interviewer_id, form.interviewer_names, form.interviewer_name, form.notes, currentStageKey, setForm]
  );

  // Handler to remove an interviewer from the panel
  const handleRemoveInterviewer = useCallback(
    (idxToRemove: number) => {
      const currentIds = form.interviewer_ids || (form.interviewer_id ? [form.interviewer_id] : []);
      const currentNames = form.interviewer_names || (form.interviewer_name ? [form.interviewer_name] : []);

      const newIds = currentIds.filter((_, i) => i !== idxToRemove);
      const newNames = currentNames.filter((_, i) => i !== idxToRemove);

      const { cleanNotes } = parseInterviewPanelFromNotes(form.notes);
      const members: PanelMemberSummary[] = newIds.map((id, i) => {
        const found = buEmployees.find((e) => e.id === id);
        return {
          id,
          name: newNames[i] || found?.name || "Interviewer",
          role: found?.role || found?.department || "",
        };
      });

      const updatedNotes = serializeInterviewPanelNotes({
        notes: cleanNotes,
        stageKey: currentStageKey,
        panelMembers: members,
      });

      setForm((prev) => ({
        ...prev,
        interviewer_id: newIds[0] || "",
        interviewer_name: newNames[0] || "",
        interviewer_ids: newIds,
        interviewer_names: newNames,
        notes: updatedNotes,
      }));
    },
    [form.interviewer_ids, form.interviewer_id, form.interviewer_names, form.interviewer_name, form.notes, currentStageKey, buEmployees, setForm]
  );

  if (!isOpen) return null;

  // Employees available to add (exclude already selected)
  const availableEmployees = buEmployees.filter(
    (emp) => !(form.interviewer_ids || []).includes(emp.id) && emp.id !== form.interviewer_id
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !schedulingInterview && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#253C7D] flex items-center justify-center font-bold text-sm">
              <i className={editingInterview ? "ri-edit-line" : "ri-calendar-todo-line"} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {editingInterview ? "Reschedule Interview" : "Schedule New Interview"}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {editingInterview
                  ? "Modify interview schedule & invited panel"
                  : "Invite Business Unit interviewers to join with Recruiter"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Candidate <span className="text-rose-500">*</span>
            </label>
            <select
              required
              disabled={Boolean(editingInterview) || candidates.length === 1}
              value={form.candidate_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  candidate_id: e.target.value,
                  interviewer_id: "",
                  interviewer_name: "",
                  interviewer_ids: [],
                  interviewer_names: [],
                })
              }
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer disabled:opacity-60"
            >
              <option value="">Select candidate...</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.job_postings?.title || "Applicant"})
                </option>
              ))}
            </select>
          </div>

          {/* Multiple BU Interviewers Invitation Section */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xs font-bold">
                  <i className="ri-team-line" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block">
                    Invited Interview Panel (Requisition BU)
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    Invite multiple employees from candidate's BU to join with Recruiter
                  </span>
                </div>
              </div>
              {buName && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#253C7D] border border-blue-200/80 shrink-0 max-w-[170px] truncate"
                  title={buName}
                >
                  <i className="ri-building-line text-xs" />
                  {buName}
                </span>
              )}
            </div>

            {/* List of currently invited interviewers (chips) */}
            {selectedPanelMembers.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <span>Invited BU Interviewers ({selectedPanelMembers.length})</span>
                  <span className="text-emerald-600 font-medium">Will receive alert notifications</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedPanelMembers.map((member, idx) => (
                    <div
                      key={member.id || idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200/80 shadow-xs rounded-xl text-xs text-gray-800 animate-in fade-in zoom-in-95 duration-100"
                    >
                      <i className="ri-user-follow-line text-[#253C7D] text-xs" />
                      <span className="font-bold text-gray-900">{member.name}</span>
                      {member.role && (
                        <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded-md">
                          {member.role}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveInterviewer(idx)}
                        className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove interviewer"
                      >
                        <i className="ri-close-line text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dropdown to add another BU employee */}
            <div>
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">
                {selectedPanelMembers.length > 0
                  ? `+ Add Another Interviewer from ${buName || "BU"}`
                  : `Select Interviewer from ${buName || "Business Unit"}`}
              </label>

              {loadingBuEmployees ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                  <i className="ri-loader-4-line animate-spin text-[#253C7D]" />
                  <span>Loading employees from {buName || "Business Unit"}...</span>
                </div>
              ) : (
                <select
                  value=""
                  onChange={(e) => {
                    handleAddInterviewer(e.target.value);
                  }}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  <option value="">
                    {availableEmployees.length > 0
                      ? selectedPanelMembers.length > 0
                        ? `+ Add another employee from ${buName || "Requesting BU"}...`
                        : `-- Select interviewer from ${buName || "Requesting BU"} --`
                      : buEmployees.length > 0
                      ? "All employees from this BU already invited"
                      : `-- No employees found for ${buName || "Business Unit"} --`}
                  </option>
                  {availableEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.role} {emp.department ? `(${emp.department})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-600 bg-white/80 px-2.5 py-1.5 rounded-xl border border-gray-200/50">
              <i className="ri-shield-user-line text-[#253C7D] text-sm" />
              <span>
                <strong>Recruiter Co-Host:</strong> Recruiter joins session as scheduler & facilitator. Alert notifications will be sent to all invited interviewers & recruiter via System and Telegram.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Date & Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Duration (minutes)
              </label>
              <select
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes (1 hour)</option>
                <option value="90">90 minutes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Interview Stage Round
              </label>
              <select
                value={currentStageKey}
                onChange={(e) => {
                  const stageKey = e.target.value;
                  const { cleanNotes } = parseInterviewPanelFromNotes(form.notes);
                  const updatedNotes = serializeInterviewPanelNotes({
                    notes: cleanNotes,
                    stageKey,
                    panelMembers: selectedPanelMembers,
                  });
                  setForm({ ...form, notes: updatedNotes });
                }}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="hr_interview">Stage 4: HR Interview</option>
                <option value="hiring_manager_interview">Stage 5: Hiring Manager Interview</option>
                <option value="final_interview">Stage 6: Final Interview</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Interview Format
              </label>
              <select
                value={["video", "in-person", "phone"].includes(form.type) ? form.type : "video"}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="video">Online Video Call</option>
                <option value="in-person">In-Person Office</option>
                <option value="phone">Phone Screening</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Interview Notes & Agenda
            </label>
            <textarea
              rows={2}
              value={parseInterviewPanelFromNotes(form.notes).cleanNotes}
              onChange={(e) => {
                const userText = e.target.value;
                const updatedNotes = serializeInterviewPanelNotes({
                  notes: userText,
                  stageKey: currentStageKey,
                  panelMembers: selectedPanelMembers,
                });
                setForm({ ...form, notes: updatedNotes });
              }}
              placeholder="Meeting link, interview focus topics, technical challenges to cover..."
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={schedulingInterview || !form.candidate_id || !form.scheduled_at}
              className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {schedulingInterview ? "Saving..." : editingInterview ? "Update Schedule" : "Book Interview"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

