import { memo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee } from "@/features/time-attendance/leave/types";
import {
  type ApproverStepConfig,
  getStoredApproverFlow,
  saveApproverFlow,
  DEFAULT_APPROVAL_FLOW,
} from "@/features/time-attendance/leave/services/leaveApprovalFlowService";
import { LeaveApproverStepCard } from "@/features/time-attendance/leave/components/settings/LeaveApproverStepCard";

interface BranchApprovalFlowSectionProps {
  branchId: string;
  branchName?: string;
  canManage: boolean;
}

export const BranchApprovalFlowSection = memo(function BranchApprovalFlowSection({
  branchId,
  branchName = "Business Unit",
  canManage,
}: BranchApprovalFlowSectionProps) {
  const [steps, setSteps] = useState<ApproverStepConfig[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  useEffect(() => {
    setSteps(getStoredApproverFlow(branchId));
    setLoading(true);
    let query = supabase
      .from("employees")
      .select("id, first_name, last_name, role, department, avatar_url, email, branch_id")
      .is("deleted_at", null)
      .order("first_name");

    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    query.then(({ data }) => {
      const buEmps = (data as Employee[]) || [];
      if (buEmps.length > 0) {
        setEmployees(buEmps);
        setLoading(false);
      } else {
        // If BU has no assigned staff yet, include unassigned or all staff as fallback
        supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, avatar_url, email, branch_id")
          .is("deleted_at", null)
          .order("first_name")
          .then(({ data: all }) => {
            setEmployees((all as Employee[]) || []);
            setLoading(false);
          });
      }
    });
  }, [branchId]);

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
    saveApproverFlow(steps, branchId);
    setSavedToast(`Approval flow for "${branchName}" saved successfully.`);
    setTimeout(() => setSavedToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0088cc] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Toast */}
      {savedToast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-150">
          <i className="ri-checkbox-circle-fill text-emerald-600 text-sm" />
          <span>{savedToast}</span>
        </div>
      )}

      {/* Section Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <i className="ri-flow-chart text-[#0088cc] text-lg" />
              Approval Flow Configuration
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#0088cc]/10 text-[#0088cc] border border-[#0088cc]/20">
              {branchName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure multi-level approval steps & approver roles specifically for this Business Unit.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Reset Default
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Save BU Flow
            </button>
          </div>
        )}
      </div>

      {/* Steps List */}
      <div className="p-4 sm:p-6 space-y-4 max-w-3xl">
        {steps.map((step) => (
          <LeaveApproverStepCard
            key={step.id}
            step={step}
            allEmployees={employees}
            canDelete={canManage && steps.length > 1}
            onUpdateStep={handleUpdateStep}
            onDeleteStep={handleDeleteStep}
          />
        ))}

        {canManage && (
          <button
            type="button"
            onClick={handleAddStep}
            className="w-full py-3 border-2 border-dashed border-[#0088cc]/40 hover:border-[#0088cc] text-[#0088cc] hover:bg-[#0088cc]/5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <i className="ri-add-line text-base" />
            <span>Add Next Approval Step</span>
          </button>
        )}
      </div>
    </div>
  );
});
