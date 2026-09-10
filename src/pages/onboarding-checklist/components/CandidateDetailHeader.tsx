import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { OnboardingHire, ChecklistTask } from "../types";
import { getHireName, getHireInitials } from "../checklistUtils";
import { CandidateProgressionStages } from "./CandidateProgressionStages";

interface CandidateDetailHeaderProps {
  selectedHire: OnboardingHire | null;
  tasks: ChecklistTask[];
  onOpenAddModal: () => void;
  onOpenAuditLogs: () => void;
  onOpenSetupRequirements?: () => void;
}

export const CandidateDetailHeader = memo(function CandidateDetailHeader({
  selectedHire,
  tasks,
  onOpenAddModal,
  onOpenAuditLogs,
  onOpenSetupRequirements,
}: CandidateDetailHeaderProps) {
  const navigate = useNavigate();

  const hireTasks = useMemo(() => {
    if (!selectedHire) return [];
    return tasks.filter((t) => t.onboarding_request_id === selectedHire.id);
  }, [selectedHire, tasks]);

  const stats = useMemo(() => {
    const total = hireTasks.length;
    const completed = hireTasks.filter((t) => t.completed).length;
    return { total, completed, pending: total - completed, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [hireTasks]);

  const stageStats = useMemo(() => {
    const getCount = (cat: string) => {
      const catTasks = hireTasks.filter((t) => t.category === cat);
      return { done: catTasks.filter((t) => t.completed).length, total: catTasks.length };
    };
    return {
      documents: getCount("documents"),
      it_setup: getCount("it_setup"),
      training: getCount("training"),
      general: getCount("general"),
    };
  }, [hireTasks]);

  if (!selectedHire) return null;

  const hireName = getHireName(selectedHire);
  const initials = getHireInitials(selectedHire);
  const emp = selectedHire.employees;
  const isPending = selectedHire.status === "pending";

  const handleOpenHub = () => navigate(`/onboarding?highlight=${selectedHire.id}`);

  const copyReport = () => {
    const reportText = `Onboarding Checklist Report for ${hireName}\nProgress: ${stats.pct}%\nCompleted: ${stats.completed}/${stats.total}\nStage: ${selectedHire.stage}`;
    navigator.clipboard.writeText(reportText);
    alert("Report copied to clipboard!");
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-4 mb-6">
      {/* Top Profile & Row Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#253C7D] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-gray-900 leading-tight">{hireName}</h2>
              {emp?.candidate_code && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-blue-50 text-[#253C7D] border border-blue-200/60 inline-flex items-center gap-1">
                  <i className="ri-fingerprint-line text-[12px]" />
                  {emp.candidate_code}
                </span>
              )}
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${isPending ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                {selectedHire.status}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                Stage: {selectedHire.stage}
              </span>
              {emp?.resume_url && (
                <a
                  href={emp.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60 hover:bg-rose-100 inline-flex items-center gap-1"
                >
                  <i className="ri-file-pdf-fill" /> Candidate CV
                </a>
              )}
            </div>
            <p className="text-[11px] text-gray-400 font-semibold mt-1">
              Day {selectedHire.day_count} &middot; {emp?.role || "Staff"} &middot; {emp?.department || "HR"} &middot; {emp?.branches?.name || "Headquarters"}
              {emp?.location && ` · ${emp.location}`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={onOpenAuditLogs} className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-colors cursor-pointer">
            View Details
          </button>
          <button type="button" onClick={handleOpenHub} className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-colors cursor-pointer">
            Open in Onboarding Hub
          </button>
          <button type="button" onClick={copyReport} className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-colors cursor-pointer">
            Copy Report
          </button>
          {onOpenSetupRequirements && (
            <button
              type="button"
              onClick={onOpenSetupRequirements}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#253C7D] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              title="Set up which requirements from Onboarding are needed for this employee"
            >
              <i className="ri-settings-4-line text-sm" />
              <span>Set up Requirements</span>
            </button>
          )}
          <button type="button" onClick={onOpenAddModal} className="px-4 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer">
            + Add Task
          </button>
        </div>
      </div>

      {/* Completion Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-bold text-gray-700">
          <span>Checklist Completion ({stats.completed} of {stats.total} done)</span>
          <span>{stats.pct}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${stats.pct}%` }} />
        </div>
        <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">
          <span>Total: {stats.total}</span>
          <span>&bull;</span>
          <span className="text-emerald-600">Completed: {stats.completed}</span>
          <span>&bull;</span>
          <span className="text-amber-600">Pending: {stats.pending}</span>
        </div>
      </div>

      {/* Pending Journey Warning Banner */}
      {isPending && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <i className="ri-error-warning-fill text-amber-500 text-lg shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900">Journey Pending Approval</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Checklist tasks are in View-Only mode. You can review, start, and approve this candidate's journey directly in the Onboarding Hub.
              </p>
            </div>
          </div>
          <button type="button" onClick={handleOpenHub} className="px-3.5 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-[11px] font-bold rounded-xl shadow-2xs whitespace-nowrap cursor-pointer">
            Open in Onboarding Hub
          </button>
        </div>
      )}

      {/* 4-Stage Onboarding Progression */}
      <CandidateProgressionStages selectedHire={selectedHire} stageStats={stageStats} />
    </div>
  );
});
