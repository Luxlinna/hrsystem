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
    <div className="border border-gray-200 rounded-xl bg-white shadow-2xs relative">
      {/* Header bar */}
      <div className="bg-[#3b82f6] text-white px-4 py-2 flex items-center justify-between rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs">{step.stepTitle}</span>
          <span className="text-[10px] px-2 py-0.5 bg-white/20 rounded font-mono">
            {step.condition === "OR" ? "Any Approver (OR)" : "All Approvers (AND)"}
          </span>
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={() => onDeleteStep(step.id)}
            className="text-white/80 hover:text-white text-xs cursor-pointer"
            title="Delete Step"
          >
            <i className="ri-delete-bin-line text-sm" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-3 text-xs">
        {/* Step settings */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Condition:</span>
            <select
              value={step.condition}
              onChange={(e) =>
                onUpdateStep({ ...step, condition: e.target.value as "OR" | "AND" })
              }
              className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs bg-white text-gray-700 font-semibold focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="OR">OR (Any one approver can approve)</option>
              <option value="AND">AND (All approvers must approve)</option>
            </select>
          </div>
        </div>

        {/* Approver list */}
        <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden bg-gray-50/40">
          {step.approvers.map((appr, idx) => (
            <div key={appr.id}>
              {idx > 0 && (
                <div className="text-center py-0.5 text-[10px] font-bold text-gray-400 bg-gray-50 uppercase tracking-widest border-y border-gray-100">
                  {step.condition}
                </div>
              )}
              <div className="p-2.5 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2.5">
                  {appr.avatar_url ? (
                    <img
                      src={appr.avatar_url}
                      alt={appr.name}
                      className="w-7 h-7 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center">
                      {appr.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-800">{appr.name}</div>
                    <div className="text-[10px] text-gray-400">{appr.role}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveApprover(appr.id)}
                  className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                  title="Remove Approver"
                >
                  <i className="ri-close-line text-sm" />
                </button>
              </div>
            </div>
          ))}
          {step.approvers.length === 0 && (
            <div className="p-3 text-center text-gray-400 italic">No approvers in this step</div>
          )}
        </div>

        {/* Searchable Approver Selector */}
        <LeaveApproverSearchSelect
          availableEmployees={allEmployees.filter((e) => !step.approvers.some((a) => a.id === e.id))}
          onAddApprover={handleAddApprover}
        />
      </div>
    </div>
  );
});
