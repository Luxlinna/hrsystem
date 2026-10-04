import { memo, useState, useEffect } from "react";
import type { Employee } from "../../types";
import {
  type ApproverStepConfig,
  getStoredApproverFlow,
  saveApproverFlow,
  DEFAULT_APPROVAL_FLOW,
} from "../../services/leaveApprovalFlowService";
import { LeaveApproverStepCard } from "./LeaveApproverStepCard";

interface LeaveApproverFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onSuccess?: (msg: string) => void;
}

export const LeaveApproverFlowModal = memo(function LeaveApproverFlowModal({
  isOpen,
  onClose,
  employees,
  onSuccess,
}: LeaveApproverFlowModalProps) {
  const [steps, setSteps] = useState<ApproverStepConfig[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSteps(getStoredApproverFlow());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateStep = (updated: ApproverStepConfig) => {
    setSteps((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddStep = () => {
    const nextNum = steps.length + 1;
    const newStep: ApproverStepConfig = {
      id: `step-${Date.now()}`,
      stepNumber: nextNum,
      stepTitle: `Step ${nextNum}`,
      condition: "OR",
      approvers: [],
    };
    setSteps((prev) => [...prev, newStep]);
  };

  const handleResetDefault = () => {
    setSteps(DEFAULT_APPROVAL_FLOW);
  };

  const handleSave = () => {
    saveApproverFlow(steps);
    if (onSuccess) onSuccess("Approver flow configuration saved successfully.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <i className="ri-node-tree text-sky-600 text-lg" />
              Control & Adjust Approver Flow
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Customize the multi-tier approval steps, approver assignments, and OR/AND rules.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {steps.map((step) => (
            <LeaveApproverStepCard
              key={step.id}
              step={step}
              allEmployees={employees}
              canDelete={steps.length > 1}
              onUpdateStep={handleUpdateStep}
              onDeleteStep={handleDeleteStep}
            />
          ))}

          <button
            type="button"
            onClick={handleAddStep}
            className="w-full py-2.5 border-2 border-dashed border-sky-300 hover:border-sky-500 text-sky-600 hover:text-sky-700 bg-sky-50/40 hover:bg-sky-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <i className="ri-add-line text-sm" />
            <span>Add Next Approval Step</span>
          </button>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefault}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
          >
            Reset to Default
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Save Approver Flow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
