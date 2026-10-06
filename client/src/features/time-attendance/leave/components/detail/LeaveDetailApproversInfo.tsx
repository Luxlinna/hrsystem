import { memo, useEffect, useState, useCallback } from "react";
import type { LeaveRequest, Employee } from "../../types";
import { supabase } from "@/lib/supabase";
import { formatDateTime } from "../../utils/leaveDisplayUtils";
import {
  type ApproverStepConfig,
  getStoredApproverFlow,
  mapEmployeeToApprover,
} from "../../services/leaveApprovalFlowService";

interface LeaveDetailApproversInfoProps {
  request: LeaveRequest;
  onOpenFlowSettings?: () => void;
}

export const LeaveDetailApproversInfo = memo(function LeaveDetailApproversInfo({
  request: r,
}: LeaveDetailApproversInfoProps) {
  const [steps, setSteps] = useState<ApproverStepConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFlow = useCallback(async () => {
    try {
      setLoading(true);
      let branchId = r.employees?.branch_id;
      let branchName: string | undefined;
      let reportsTo = (r.employees as any)?.reports_to;

      // Query employee record with branches to accurately match the BU
      const { data: emp } = await supabase
        .from("employees")
        .select("id, branch_id, reports_to, department, role, branches(id, name, company_name)")
        .eq("id", r.employee_id)
        .maybeSingle();

      if (emp) {
        branchId = emp.branch_id || (emp as any)?.branches?.id || branchId;
        branchName = (emp as any)?.branches?.company_name || (emp as any)?.branches?.name;
        reportsTo = emp.reports_to ?? reportsTo;
      }

      const isSuperAdminPerson = (p: { role?: string | null; name?: string | null; first_name?: string | null; last_name?: string | null }) => {
        const roleStr = (p.role || "").toLowerCase();
        const nameStr = `${p.name || ""}${p.first_name || ""} ${p.last_name || ""}`.toLowerCase();
        return roleStr.includes("super admin") || roleStr.includes("superadmin") || nameStr.includes("superadmin");
      };

      const cleanSteps = (stepsToClean: ApproverStepConfig[]) =>
        stepsToClean
          .map((s) => ({
            ...s,
            approvers: (s.approvers || []).filter((a) => !isSuperAdminPerson(a)),
          }))
          .filter((s) => s.approvers.length > 0);

      // 1. Check if custom flow is configured for this specific BU or primary BU
      const stored = cleanSteps(getStoredApproverFlow(branchId, branchName));

      if (stored.length > 0) {
        setSteps(stored);
        setLoading(false);
        return;
      }

      // 2. If no custom Org flow is saved in localStorage yet, dynamically build a single BU step
      const dynamicApprovers: Employee[] = [];

      if (reportsTo) {
        const { data: mgr } = await supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, avatar_url, branch_id")
          .eq("id", reportsTo)
          .maybeSingle();

        if (mgr && !isSuperAdminPerson(mgr)) {
          dynamicApprovers.push(mgr as Employee);
        }
      }

      if (dynamicApprovers.length === 0 && branchId) {
        const { data: buStaff } = await supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, avatar_url, branch_id")
          .eq("branch_id", branchId)
          .is("deleted_at", null)
          .or("role.ilike.%manager%,role.ilike.%head%,role.ilike.%director%,role.ilike.%lead%")
          .limit(2);

        const cleanBuStaff = (buStaff || []).filter((h) => !isSuperAdminPerson(h));
        dynamicApprovers.push(...(cleanBuStaff as Employee[]));
      }

      if (dynamicApprovers.length > 0) {
        setSteps([
          {
            id: "step-1-bu",
            stepNumber: 1,
            stepTitle: "Step 1",
            condition: "OR",
            approvers: dynamicApprovers.map((h) => mapEmployeeToApprover(h)),
          },
        ]);
      } else {
        setSteps([]);
      }
    } catch (err) {
      console.error("Failed to load dynamic approver flow:", err);
      setSteps(getStoredApproverFlow(r.employees?.branch_id));
    } finally {
      setLoading(false);
    }
  }, [r.employees?.branch_id, (r.employees as any)?.reports_to, r.employee_id]);

  useEffect(() => {
    loadFlow();
    window.addEventListener("leave_approver_flow_updated", loadFlow);
    return () => window.removeEventListener("leave_approver_flow_updated", loadFlow);
  }, [loadFlow]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3">
      <div className="text-[#0284c7] dark:text-sky-400 font-bold text-xs tracking-wider uppercase pb-2 border-b border-gray-100 dark:border-slate-800">
        Approval Workflow
      </div>

      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.id} className="border border-blue-200 dark:border-blue-900/60 rounded-xl overflow-hidden shadow-2xs">
            {/* Step Banner */}
            <div className="bg-[#2563eb] text-white text-xs font-bold px-3.5 py-1.5 flex items-center justify-between">
              <span>{step.stepTitle}</span>
              {step.approvers.length > 1 && (
                <span className="text-[10px] px-2 py-0.2 bg-white/20 rounded font-semibold">
                  {step.condition === "OR" ? "Any (OR)" : "All (AND)"}
                </span>
              )}
            </div>

            {/* Approvers list */}
            <div className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {step.approvers.map((item, index) => {
                const isApproved =
                  r.status === "approved" &&
                  (index === 1 || r.approved_by === item.id || step.approvers.length === 1);
                const isCancelled = r.status === "cancelled";
                const isRejected = r.status === "rejected";

                return (
                  <div key={item.id}>
                    {index > 0 && (
                      <div className="text-center py-1 text-[10px] font-extrabold text-gray-400 dark:text-slate-500 bg-gray-50/70 dark:bg-slate-800/50 uppercase tracking-widest border-y border-gray-100 dark:border-slate-800">
                        {step.condition}
                      </div>
                    )}
                    <div className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.avatar_url ? (
                          <img
                            src={item.avatar_url}
                            alt={item.name}
                            className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center border border-gray-200 dark:border-slate-700 shrink-0">
                            {item.name[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-gray-900 dark:text-slate-100 truncate">{item.name}</div>
                          <div className="text-[11px] text-gray-400 dark:text-slate-500 truncate">{item.role}</div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isCancelled ? (
                          <span className="inline-block px-2.5 py-0.5 bg-slate-500 text-white text-[10px] font-bold rounded shadow-2xs">
                            Cancelled
                          </span>
                        ) : isRejected ? (
                          <span className="inline-block px-2.5 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded shadow-2xs">
                            Rejected
                          </span>
                        ) : isApproved ? (
                          <span className="inline-block px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded shadow-2xs">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 bg-sky-500 text-white text-[10px] font-bold rounded shadow-2xs">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {step.approvers.length === 0 && (
                <div className="p-3 text-center text-xs text-gray-400 italic">
                  No approvers assigned to this step yet.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Workflow Note */}
      <div className="text-[11px] text-gray-500 dark:text-slate-400 pt-1">
        {r.status === "cancelled"
          ? "Workflow terminated due to cancellation."
          : r.status === "rejected"
          ? "Workflow terminated due to rejection."
          : "Approvals are routed according to the Business Unit workflow configuration."}
      </div>
    </div>
  );
});
