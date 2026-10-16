import { memo, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee } from "@/features/time-attendance/leave/types";
import {
  type LeaveApprovalFlowStep,
  DEFAULT_SAMPLE_STEPS,
  getStoredTableSteps,
  saveStoredTableSteps,
  fetchLeaveApprovalFlowFromDb,
  saveLeaveApprovalFlowToDb,
} from "@/features/time-attendance/leave/services/leaveApprovalGroupService";
import { LeaveApprovalFlowStepModal } from "@/features/time-attendance/leave/components/settings/approval-flow/LeaveApprovalFlowStepModal";

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
  // Synchronously initialize steps from storage so table displays immediately
  const [steps, setSteps] = useState<LeaveApprovalFlowStep[]>(() =>
    getStoredTableSteps(branchId, branchName)
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  // Modal state for adding/editing steps (Matches Screenshot 4)
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

  // Sync steps whenever branchId or branchName changes
  useEffect(() => {
    setSteps(getStoredTableSteps(branchId, branchName));
    let active = true;
    fetchLeaveApprovalFlowFromDb(branchId, branchName).then((dbSteps) => {
      if (active && dbSteps && dbSteps.length > 0) {
        setSteps(dbSteps);
      }
    });
    return () => {
      active = false;
    };
  }, [branchId, branchName]);

  // Load employee list in background for modal auto-completion
  useEffect(() => {
    let isMounted = true;
    let query = supabase
      .from("employees")
      .select("id, first_name, last_name, role, department, avatar_url, email, branch_id, position")
      .is("deleted_at", null)
      .order("first_name");

    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    query.then(({ data }) => {
      if (!isMounted) return;
      const buEmps = (data as Employee[]) || [];
      if (buEmps.length > 0) {
        setEmployees(buEmps);
      } else {
        supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, avatar_url, email, branch_id, position")
          .is("deleted_at", null)
          .order("first_name")
          .then(({ data: all }) => {
            if (isMounted) {
              setEmployees((all as Employee[]) || []);
            }
          });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [branchId]);

  const handleOpenAddStep = () => {
    setEditingStepIndex(null);
    setIsStepModalOpen(true);
  };

  const handleOpenEditStep = (index: number) => {
    setEditingStepIndex(index);
    setIsStepModalOpen(true);
  };

  const handleSaveStep = (step: LeaveApprovalFlowStep) => {
    setSteps((prev) => {
      let updated: LeaveApprovalFlowStep[];
      if (editingStepIndex !== null && editingStepIndex >= 0 && editingStepIndex < prev.length) {
        updated = prev.map((s, i) => (i === editingStepIndex ? step : s));
      } else {
        updated = [...prev, step];
      }
      // Re-normalize prefixes
      updated = updated.map((st, i) => ({
        ...st,
        conditionPrefix: (i === 0 ? "" : (st.conditionPrefix === "AND" || st.approvalCondition === "AND" ? "AND" : "OR")) as "OR" | "AND" | "",
      }));
      saveStoredTableSteps(updated, branchId, branchName);
      saveLeaveApprovalFlowToDb(updated, branchId, branchName, false).catch(() => {});
      return updated;
    });
    setIsStepModalOpen(false);
    setEditingStepIndex(null);
  };

  const handleDeleteStep = (index: number) => {
    setSteps((prev) => {
      const updated: LeaveApprovalFlowStep[] = prev.filter((_, i) => i !== index).map((st, i) => ({
        ...st,
        conditionPrefix: (i === 0 ? "" : (st.conditionPrefix === "AND" || st.approvalCondition === "AND" ? "AND" : "OR")) as "OR" | "AND" | "",
      }));
      saveStoredTableSteps(updated, branchId, branchName);
      saveLeaveApprovalFlowToDb(updated, branchId, branchName, false).catch(() => {});
      return updated;
    });
  };

  const handleResetDefault = async () => {
    setSteps(DEFAULT_SAMPLE_STEPS);
    saveStoredTableSteps(DEFAULT_SAMPLE_STEPS, branchId, branchName);
    await saveLeaveApprovalFlowToDb(DEFAULT_SAMPLE_STEPS, branchId, branchName, false);
    setSavedToast("Reset to default approval flow successfully.");
    setTimeout(() => setSavedToast(null), 3000);
  };

  const handleSave = async () => {
    saveStoredTableSteps(steps, branchId, branchName);
    const ok = await saveLeaveApprovalFlowToDb(steps, branchId, branchName, false);
    if (ok) {
      setSavedToast(`Approval flow for "${branchName}" saved to database successfully.`);
    } else {
      setSavedToast(`Approval flow for "${branchName}" saved successfully.`);
    }
    setTimeout(() => setSavedToast(null), 3000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden font-sans">
      {/* Toast */}
      {savedToast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-150">
          <i className="ri-checkbox-circle-fill text-emerald-600 text-sm" />
          <span>{savedToast}</span>
        </div>
      )}

      {/* Section Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-800/40">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i className="ri-flow-chart text-[#0088cc] text-lg" />
              Approval Flow Configuration
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#0088cc]/10 text-[#0088cc] border border-[#0088cc]/20">
              {branchName}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure multi-level approval steps &amp; approver roles specifically for this Business Unit.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
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

      {/* Table UI (Exact Match to Screenshot 2) */}
      <div className="p-4 sm:p-6 space-y-0 w-full">
        <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-t">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">No.</th>
                <th className="py-2.5 px-3">Approval condition</th>
                <th className="py-2.5 px-3">Flow title</th>
                <th className="py-2.5 px-3">Flow Type</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Condition</th>
                <th className="py-2.5 px-3">Step</th>
                <th className="py-2.5 px-3">Expired hours</th>
                <th className="py-2.5 px-3 text-center w-28">Display in print</th>
                <th className="py-2.5 px-3 w-16 text-center">
                  {canManage && (
                    <button
                      type="button"
                      onClick={handleOpenAddStep}
                      className="text-[#29ABE2] hover:text-sky-600 transition-transform hover:scale-110 cursor-pointer text-base"
                      title="Add flow step"
                    >
                      <i className="ri-add-circle-line text-lg" />
                    </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {steps.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-medium text-xs">
                    No records found
                  </td>
                </tr>
              ) : (
                steps.map((st, idx) => (
                  <tr
                    key={st.id || idx}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100">
                      {idx === 0 ? "" : (st.conditionPrefix || st.approvalCondition || "OR")}
                    </td>
                    <td className="py-2.5 px-3">{st.flowTitle || "Notified to"}</td>
                    <td className="py-2.5 px-3">{st.flowType || "Employee"}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-normal border border-slate-200/60 dark:border-slate-700">
                        {st.description}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{st.condition || ">=0"}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{st.step || 1}</td>
                    <td className="py-2.5 px-3 text-slate-500">{st.expiredHours || ""}</td>
                    <td className="py-2.5 px-3 text-center">
                      {st.displayInPrint ? (
                        <i className="ri-check-line text-slate-500 dark:text-slate-300 font-bold text-sm" />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {canManage && (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditStep(idx)}
                            className="text-slate-400 hover:text-sky-600 cursor-pointer p-0.5"
                            title="Edit step"
                          >
                            <i className="ri-edit-line text-xs" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStep(idx)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5"
                            title="Delete step"
                          >
                            <i className="ri-delete-bin-line text-xs" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Apply To Summary Bar (Exact Match to Screenshot 2) */}
        <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-100">Apply To:</span>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-700 dark:text-slate-200">Site</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px]">
              {branchName || "All"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-700 dark:text-slate-200">Department</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px]">
              All
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-700 dark:text-slate-200">Position</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px]">
              All
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-700 dark:text-slate-200">Employee Type</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px]">
              All
            </span>
          </div>
        </div>
      </div>

      {/* Step Modal (Matches Screenshot 4) */}
      {isStepModalOpen && (
        <LeaveApprovalFlowStepModal
          isOpen={isStepModalOpen}
          onClose={() => setIsStepModalOpen(false)}
          onSave={handleSaveStep}
          initialStep={editingStepIndex !== null ? steps[editingStepIndex] : null}
          stepIndex={editingStepIndex !== null ? steps[editingStepIndex].step : steps.length + 1}
          employees={employees}
        />
      )}
    </div>
  );
});
