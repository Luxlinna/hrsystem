import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { LeaveApprovalFlowStep } from "../../../services/leaveApprovalGroupService";
import { getLeaveEmployeeName } from "../../../utils/leaveDisplayUtils";

interface LeaveApprovalFlowStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (step: LeaveApprovalFlowStep) => void;
  initialStep?: LeaveApprovalFlowStep | null;
  stepIndex?: number;
  employees?: Array<{ id: string; first_name?: string; last_name?: string; role?: string; department?: string; position?: string; full_name?: string }>;
}

export const LeaveApprovalFlowStepModal: React.FC<LeaveApprovalFlowStepModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialStep,
  stepIndex = 1,
  employees = [],
}) => {
  const [approvalCondition, setApprovalCondition] = useState<"AND" | "OR">("AND");
  const [flowTitle, setFlowTitle] = useState("Notified to");
  const [flowType, setFlowType] = useState<string>("Employee");
  const [description, setDescription] = useState("");
  const [conditionPrefix, setConditionPrefix] = useState(">=");
  const [conditionValue, setConditionValue] = useState("0");
  const [stepNumber, setStepNumber] = useState(1);
  const [expiredHours, setExpiredHours] = useState("");
  const [displayInPrint, setDisplayInPrint] = useState(true);

  // Dynamic employees state
  const [dynamicEmployees, setDynamicEmployees] = useState(employees);

  useEffect(() => {
    if (employees && employees.length > 0) {
      setDynamicEmployees(employees);
    } else {
      supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, position")
        .is("deleted_at", null)
        .order("first_name")
        .then(({ data }) => {
          if (data && data.length > 0) {
            setDynamicEmployees(data as any);
          }
        });
    }
  }, [employees]);

  useEffect(() => {
    if (initialStep) {
      setApprovalCondition((initialStep.approvalCondition as "AND" | "OR") || (initialStep.conditionPrefix === "AND" ? "AND" : "OR"));
      setFlowTitle(initialStep.flowTitle || "Notified to");
      setFlowType(initialStep.flowType || "Employee");
      setDescription(initialStep.description || "");

      const match = initialStep.condition?.match(/^(.*?)\s*([-\d.]+)?$/);
      if (match) {
        setConditionPrefix(match[1]?.trim() || ">=");
        setConditionValue(match[2] || "0");
      } else {
        setConditionPrefix(">=");
        setConditionValue(initialStep.condition || "0");
      }

      setStepNumber(initialStep.step || 1);
      setExpiredHours(initialStep.expiredHours ? String(initialStep.expiredHours) : "");
      setDisplayInPrint(initialStep.displayInPrint !== false);
    } else {
      setApprovalCondition(stepIndex === 1 ? "AND" : "OR");
      setFlowTitle("Notified to");
      setFlowType("Employee");
      setDescription("");
      setConditionPrefix(">=");
      setConditionValue("0");
      setStepNumber(stepIndex);
      setExpiredHours("");
      setDisplayInPrint(true);
    }
  }, [initialStep, stepIndex, isOpen]);

  if (!isOpen) return null;

  const handleDone = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCondition = `${conditionPrefix}${conditionValue}`;
    const newStep: LeaveApprovalFlowStep = {
      id: initialStep?.id || `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      conditionPrefix: stepNumber > 1 ? approvalCondition : "",
      approvalCondition,
      flowTitle: flowTitle.trim() || "Notified to",
      flowType: flowType || "Employee",
      description: description.trim() || "Employee",
      condition: finalCondition,
      step: Number(stepNumber) || 1,
      expiredHours: expiredHours.trim() ? expiredHours.trim() : undefined,
      displayInPrint,
    };
    onSave(newStep);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden text-xs">
        {/* Header (Matching Screenshot 4) */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-[#29ABE2] tracking-wide uppercase">
            APPROVAL FLOW
          </h2>
        </div>

        {/* Form Body (Matching Screenshot 4) */}
        <form onSubmit={handleDone} className="p-6 space-y-3.5">
          {/* Approval Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-2">
            <label className="text-slate-700 dark:text-slate-300 font-normal sm:text-right pr-2">
              Approval condition <span className="text-rose-500">*</span>
            </label>
            <select
              value={approvalCondition}
              onChange={(e) => setApprovalCondition(e.target.value as "AND" | "OR")}
              className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#29ABE2] cursor-pointer"
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          </div>

          {/* Flow Title */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-2">
            <label className="text-slate-700 dark:text-slate-300 font-normal sm:text-right pr-2">
              Flow title
            </label>
            <input
              type="text"
              placeholder="Flow title"
              value={flowTitle}
              onChange={(e) => setFlowTitle(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#29ABE2]"
            />
          </div>

          {/* Flow Type */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-2">
            <label className="text-slate-700 dark:text-slate-300 font-normal sm:text-right pr-2">
              Flow Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={flowType}
              onChange={(e) => {
                const val = e.target.value;
                setFlowType(val);
                if (val === "Manager" && (!description || description === "Supervisor" || description === "Employee")) {
                  setDescription("Line Manager");
                } else if (val === "Supervisor" && (!description || description === "Line Manager" || description === "Employee")) {
                  setDescription("Direct Supervisor");
                }
              }}
              className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#29ABE2] cursor-pointer"
            >
              <option value="">Select</option>
              <option value="Employee">Employee</option>
              <option value="Role">Role</option>
              <option value="Manager">Manager</option>
              <option value="Supervisor">Supervisor</option>
            </select>
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-2">
            <label className="text-slate-700 dark:text-slate-300 font-normal sm:text-right pr-2">
              Description
            </label>
            {flowType === "Employee" && dynamicEmployees.length > 0 ? (
              <div className="space-y-1">
                <input
                  type="text"
                  list="employee-step-modal-datalist"
                  placeholder="Select or enter employee name"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#29ABE2]"
                />
                <datalist id="employee-step-modal-datalist">
                  {dynamicEmployees.map((emp) => {
                    const name = getLeaveEmployeeName(emp);
                    const label = emp.position || emp.role ? `${name} (${emp.position || emp.role})` : name;
                    return <option key={emp.id} value={name}>{label}</option>;
                  })}
                </datalist>
              </div>
            ) : (
              <input
                type="text"
                placeholder={flowType === "Role" ? "e.g. HR Manager, Director" : "Description"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#29ABE2]"
              />
            )}
          </div>

          {/* Condition (Leave >= 0) */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-2">
            <label className="text-slate-700 dark:text-slate-300 font-normal sm:text-right pr-2">
              Condition <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded overflow-hidden">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 border-r border-slate-300 dark:border-slate-700 text-xs font-normal whitespace-nowrap flex items-center gap-1 select-none">
                <span>Leave</span>
                <i className="ri-arrow-right-s-line text-xs text-slate-400" />
                <span>=</span>
              </span>
              <input
                type="number"
                value={conditionValue}
                onChange={(e) => setConditionValue(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Step */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-2">
            <label className="text-slate-700 dark:text-slate-300 font-normal sm:text-right pr-2">
              Step <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={stepNumber}
              onChange={(e) => setStepNumber(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#29ABE2]"
            />
          </div>

          {/* Expired hours */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-2">
            <label className="text-slate-700 dark:text-slate-300 font-normal sm:text-right pr-2">
              Expired hours
            </label>
            <input
              type="text"
              placeholder=""
              value={expiredHours}
              onChange={(e) => setExpiredHours(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#29ABE2]"
            />
          </div>

          {/* Display in print */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-2">
            <div />
            <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={displayInPrint}
                onChange={(e) => setDisplayInPrint(e.target.checked)}
                className="rounded border-slate-300 text-[#29ABE2] focus:ring-[#29ABE2] cursor-pointer"
              />
              <span>Display in print</span>
            </label>
          </div>

          {/* Actions (Matching Screenshot 4) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#29ABE2] hover:bg-sky-600 text-white font-medium rounded flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <i className="ri-checkbox-circle-line text-sm" />
              <span>Done</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium rounded flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <i className="ri-close-line text-sm" />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
