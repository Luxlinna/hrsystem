import { memo } from "react";
import type { Employee } from "../../types";
import {
  type ApproverStepConfig,
  mapEmployeeToApprover,
} from "../../services/leaveApprovalFlowService";
import { LeaveApproverSearchSelect } from "./LeaveApproverSearchSelect";

interface LeaveApproverStepCardProps {
  step: ApproverStepConfig;
  allEmployees: Employee[];
  canDelete: boolean;
  onUpdateStep: (updated: ApproverStepConfig) => void;
  onDeleteStep: (id: string) => void;
}

export const LeaveApproverStepCard = memo(function LeaveApproverStepCard({
  step,
  allEmployees,
  canDelete,
  onUpdateStep,
  onDeleteStep,
}: LeaveApproverStepCardProps) {
  const handleAddApprover = (emp: Employee) => {
    if (step.approvers.some((a) => a.id === emp.id)) return;
    onUpdateStep({
      ...step,
      approvers: [...step.approvers, mapEmployeeToApprover(emp)],
    });
  };

  const handleRemoveApprover = (id: string) => {
    onUpdateStep({
      ...step,
      approvers: step.approvers.filter((a) => a.id !== id),
    });
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-2xs relative">
      {/* Header bar */}
      <div className="bg-[#0088cc] text-white px-4 py-2.5 flex items-center justify-between rounded-t-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs tracking-wide">{step.stepTitle}</span>
          <span className="text-[10.5px] px-2.5 py-0.5 bg-white/20 rounded-full font-medium backdrop-blur-xs">
            {step.condition === "OR" ? "Any Approver (OR)" : "All Approvers (AND)"}
          </span>
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={() => onDeleteStep(step.id)}
            className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
            title="Delete Step"
          >
            <i className="ri-delete-bin-line text-xs" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-3.5 text-xs">
        {/* Step settings */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-50/80 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-slate-500 dark:text-slate-400 font-semibold text-xs flex items-center gap-1.5">
              <i className="ri-sound-module-line text-[#0088cc]" />
              Condition:
            </span>
            <select
              value={step.condition}
              onChange={(e) =>
                onUpdateStep({ ...step, condition: e.target.value as "OR" | "AND" })
              }
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:border-[#0088cc] shadow-2xs cursor-pointer"
            >
              <option value="OR">OR (Any one approver can approve)</option>
              <option value="AND">AND (All approvers must approve)</option>
            </select>
          </div>
        </div>

        {/* Searchable Approver Selector (at top) */}
        <LeaveApproverSearchSelect
          availableEmployees={allEmployees.filter((e) => !step.approvers.some((a) => a.id === e.id))}
          onAddApprover={handleAddApprover}
        />

        {/* Approver list */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/30 dark:bg-slate-900">
          {step.approvers.map((appr, idx) => (
            <div key={appr.id}>
              {idx > 0 && (
                <div className="text-center py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/60 uppercase tracking-widest border-y border-slate-100 dark:border-slate-800">
                  {step.condition}
                </div>
              )}
              <div className="p-2.5 flex items-center justify-between bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  {appr.avatar_url ? (
                    <img
                      src={appr.avatar_url}
                      alt={appr.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#0088cc]/10 text-[#0088cc] font-bold text-xs flex items-center justify-center shrink-0 border border-[#0088cc]/20">
                      {appr.name[0]?.toUpperCase() || "A"}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                      {appr.name}
                    </div>
                    <div className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium mt-0.2">
                      {appr.role}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveApprover(appr.id)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center cursor-pointer transition-colors"
                  title="Remove Approver"
                >
                  <i className="ri-close-line text-sm" />
                </button>
              </div>
            </div>
          ))}
          {step.approvers.length === 0 && (
            <div className="p-4 text-center text-slate-400 text-xs italic flex items-center justify-center gap-1.5">
              <i className="ri-information-line text-sm" />
              <span>No approvers in this step yet. Search above to add approvers.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

