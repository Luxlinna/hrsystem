import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { OnboardingHire, ChecklistTask } from "../types";
import { getHireName, getHireInitials } from "../checklistUtils";

interface CandidateDetailHeaderProps {
  selectedHire: OnboardingHire | null;
  tasks: ChecklistTask[];
  onOpenAddModal: () => void;
  onOpenAuditLogs: () => void;
}

export const CandidateDetailHeader = memo(function CandidateDetailHeader({
  selectedHire,
  tasks,
  onOpenAddModal,
  onOpenAuditLogs,
}: CandidateDetailHeaderProps) {
  const navigate = useNavigate();

  const hireTasks = useMemo(() => {
    if (!selectedHire) return [];
    return tasks.filter((t) => t.onboarding_request_id === selectedHire.id);
  }, [selectedHire, tasks]);

  const stats = useMemo(() => {
    const total = hireTasks.length;
    const completed = hireTasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, pct };
  }, [hireTasks]);

  // Stage progress counts
  const stageStats = useMemo(() => {
    const getCount = (cat: string) => {
      const catTasks = hireTasks.filter((t) => t.category === cat);
      const done = catTasks.filter((t) => t.completed).length;
      return { done, total: catTasks.length };
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

  const handleOpenHub = () => {
    navigate(`/onboarding?highlight=${selectedHire.id}`);
  };

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
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                isPending ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
              }`}>
                {selectedHire.status}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                Stage: {selectedHire.stage}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-semibold mt-1">
              Day {selectedHire.day_count} &middot; {emp?.role || "Staff"} &middot; {emp?.department || "HR"} &middot; {emp?.branches?.name || "Headquarters"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenAuditLogs}
            className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-colors cursor-pointer"
          >
            View Details
          </button>
          <button
            onClick={handleOpenHub}
            className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-colors cursor-pointer"
          >
            Open in Onboarding Hub
          </button>
          <button
            onClick={copyReport}
            className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-colors cursor-pointer"
          >
            Copy Report
          </button>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
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
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${stats.pct}%` }}
          />
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
          <button
            onClick={handleOpenHub}
            className="px-3.5 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-[11px] font-bold rounded-xl shadow-2xs whitespace-nowrap cursor-pointer"
          >
            Open in Onboarding Hub
          </button>
        </div>
      )}

      {/* 4-Stage Onboarding Progression */}
      <div>
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
          4-Stage Onboarding Progression
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            { label: "Document Collection", key: "document", count: stageStats.documents, step: 1 },
            { label: "IT & Equipment Setup", key: "it_setup", count: stageStats.it_setup, step: 2 },
            { label: "Training & Orientation", key: "training", count: stageStats.training, step: 3 },
            { label: "Final Sign-off", key: "complete", count: stageStats.general, step: 4 },
          ].map((item, idx) => {
            const hireStageIdx = ["document", "it_setup", "training", "complete"].indexOf(selectedHire.stage);
            const isActive = selectedHire.stage === item.key;
            const isCompleted = hireStageIdx > idx;
            const isLocked = hireStageIdx < idx;

            return (
              <div
                key={item.key}
                className={`px-4 py-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                  isActive
                    ? "bg-[#253C7D]/5 border-[#253C7D] text-[#253C7D]"
                    : isCompleted
                    ? "bg-emerald-50/50 border-emerald-200 text-emerald-700"
                    : "bg-gray-50/50 border-gray-200 text-gray-400"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isCompleted ? (
                    <i className="ri-checkbox-circle-fill text-emerald-500 text-sm shrink-0" />
                  ) : isActive ? (
                    <i className="ri-focus-2-line text-[#253C7D] text-sm shrink-0 animate-pulse" />
                  ) : (
                    <i className="ri-lock-line text-gray-400 text-sm shrink-0" />
                  )}
                  <span className="text-[12px] font-bold truncate">{item.label}</span>
                </div>
                <span className="text-[11px] font-black shrink-0">
                  {item.count.done}/{item.count.total}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
