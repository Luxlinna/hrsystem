import { memo, useState, useMemo } from "react";
import type { Candidate, Interview } from "../../types";
import { STAGE_CONFIG, STAGE_TIMELINE_ORDER } from "../../constants";
import { RECRUITMENT_PHASES, STAGE_GUIDANCE_MAP, getPhaseForStage, getPhaseIndex } from "../../constants/processPhasesConfig";
import { checkInterviewStageProgressionGate } from "../../constants/evidenceConfig";

interface CandidateProcessTrackerProps {
  candidate: Candidate;
  interviews?: Interview[];
  onUpdateStage: (stage: string) => void;
  onOpenSchedule?: () => void;
  onOpenCandidateApproval?: () => void;
  onOpenSalaryProposal?: () => void;
}

export const CandidateProcessTracker = memo(function CandidateProcessTracker({
  candidate,
  interviews = [],
  onUpdateStage,
  onOpenSchedule,
  onOpenCandidateApproval,
  onOpenSalaryProposal,
}: CandidateProcessTrackerProps) {
  const [showAllSteps, setShowAllSteps] = useState(false);
  const normStage = candidate.stage === "applied" ? "cv_received" : candidate.stage === "interview" ? "hr_interview" : candidate.stage;
  const currentStageIdx = STAGE_TIMELINE_ORDER.indexOf(normStage);
  const currentPhase = getPhaseForStage(normStage);
  const currentPhaseIdx = currentPhase ? getPhaseIndex(currentPhase.id) : 0;
  const currentCfg = STAGE_CONFIG[normStage] || STAGE_CONFIG.cv_received;
  const guidance = STAGE_GUIDANCE_MAP[normStage] || STAGE_GUIDANCE_MAP.cv_received;

  const nextStageKey = currentStageIdx >= 0 && currentStageIdx < STAGE_TIMELINE_ORDER.length - 1 ? STAGE_TIMELINE_ORDER[currentStageIdx + 1] : null;
  const nextCfg = nextStageKey ? STAGE_CONFIG[nextStageKey] : null;

  const advanceCheck = useMemo(() => {
    if (!nextStageKey) return { allowed: false, reason: "Candidate is at the final stage" };
    return checkInterviewStageProgressionGate(normStage, nextStageKey, candidate, interviews);
  }, [normStage, nextStageKey, candidate, interviews]);

  const handleActionClick = () => {
    if (guidance.actionType === "schedule_interview" && onOpenSchedule) onOpenSchedule();
    else if (guidance.actionType === "open_caf" && onOpenCandidateApproval) onOpenCandidateApproval();
    else if (guidance.actionType === "create_proposal" && onOpenSalaryProposal) onOpenSalaryProposal();
    else if (nextStageKey && advanceCheck.allowed) onUpdateStage(nextStageKey);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 mb-6 space-y-5">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-[#253C7D] uppercase px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200">
              Recruitment Process
            </span>
            <span className="text-xs font-bold text-gray-500">
              Phase {currentPhaseIdx + 1} of 4 • Stage {currentStageIdx + 1} of {STAGE_TIMELINE_ORDER.length}
            </span>
          </div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight mt-1">Candidate Hiring Progression</h2>
        </div>

        <button
          type="button"
          onClick={() => setShowAllSteps(!showAllSteps)}
          className="text-xs font-bold text-[#253C7D] hover:text-blue-800 flex items-center gap-1.5 self-start sm:self-center transition-colors cursor-pointer"
        >
          <i className={showAllSteps ? "ri-contract-up-line" : "ri-expand-diagonal-line"} />
          {showAllSteps ? "Hide 14 Micro-Steps" : "View All 14 Steps"}
        </button>
      </div>

      {/* 4 Macro Phases Milestone Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {RECRUITMENT_PHASES.map((phase, pIdx) => {
          const isPassedPhase = currentPhaseIdx > pIdx && normStage !== "rejected";
          const isCurrentPhase = currentPhaseIdx === pIdx && normStage !== "rejected";
          const completedCount = phase.stages.filter((s) => STAGE_TIMELINE_ORDER.indexOf(s) < currentStageIdx).length;

          return (
            <div
              key={phase.id}
              className={`rounded-2xl p-4 border transition-all flex flex-col justify-between relative overflow-hidden ${
                isCurrentPhase
                  ? "bg-gradient-to-br from-blue-50/90 to-indigo-50/50 border-[#253C7D] ring-2 ring-[#253C7D]/20 shadow-xs"
                  : isPassedPhase
                  ? "bg-emerald-50/40 border-emerald-200/80"
                  : "bg-gray-50/70 border-gray-200/70 opacity-75"
              }`}
            >
              {isCurrentPhase && <div className="absolute top-0 right-0 w-16 h-16 bg-[#253C7D]/5 rounded-bl-full pointer-events-none" />}
              <div className="flex items-center justify-between mb-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  isPassedPhase ? "bg-emerald-600 text-white" : isCurrentPhase ? "bg-[#253C7D] text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {isPassedPhase ? <i className="ri-check-line" /> : pIdx + 1}
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isPassedPhase ? "bg-emerald-100 text-emerald-800" : isCurrentPhase ? "bg-[#253C7D] text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {isPassedPhase ? "Completed" : isCurrentPhase ? `${completedCount}/${phase.stages.length} Done` : "Upcoming"}
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-gray-900 leading-tight flex items-center gap-1.5">
                  <i className={`${phase.icon} text-sm ${isCurrentPhase ? "text-[#253C7D]" : "text-gray-500"}`} />
                  {phase.name}
                </p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">{phase.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Stage & Next Guidance Banner */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-white shadow-xs shrink-0"
            style={{ backgroundColor: currentCfg.hex }}
          >
            <i className={currentCfg.icon} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-gray-900">Current: {currentCfg.label}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">•</span>
              <span className="text-xs text-gray-600 font-medium">{guidance.description}</span>
            </div>
            <p className="text-xs font-bold text-[#253C7D] mt-1 flex items-center gap-1.5">
              <i className="ri-arrow-right-circle-line text-sm" />
              <span>{guidance.nextPrompt}</span>
            </p>
          </div>
        </div>

        {nextStageKey && normStage !== "hired" && normStage !== "rejected" && (
          <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleActionClick}
              disabled={!advanceCheck.allowed}
              title={advanceCheck.reason || undefined}
              className={`w-full md:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                advanceCheck.allowed ? "bg-[#253C7D] hover:bg-[#1b2b5a] text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span>Advance to {nextCfg?.label}</span>
              <i className="ri-arrow-right-line" />
            </button>
          </div>
        )}
      </div>

      {/* Expandable 14 Micro-Steps View */}
      {showAllSteps && (
        <div className="pt-2 border-t border-gray-100 animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {STAGE_TIMELINE_ORDER.map((st, idx) => {
              const cfg = STAGE_CONFIG[st] || { label: st, icon: "ri-circle-line" };
              const isPast = currentStageIdx > idx && normStage !== "rejected";
              const isNow = normStage === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => onUpdateStage(st)}
                  className={`p-2 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                    isNow
                      ? "bg-[#253C7D] text-white border-[#253C7D] font-bold shadow-xs"
                      : isPast
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1 opacity-80">
                    <span>#{idx + 1}</span>
                    {isPast ? <i className="ri-check-line font-bold" /> : isNow ? <span>Active</span> : null}
                  </div>
                  <p className="truncate font-semibold text-[11px]">{cfg.label}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
