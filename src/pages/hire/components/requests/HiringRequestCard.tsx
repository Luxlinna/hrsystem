import { memo } from "react";
import { useSearchParams } from "react-router-dom";
import type { HiringRequest } from "../../types";
import { formatDateTime } from "../../hireUtils";
import { HiringRequestStatusBadges } from "./HiringRequestStatusBadges";
import { HiringRequestCardActions } from "./HiringRequestCardActions";

interface HiringRequestCardProps {
  request: HiringRequest;
  canApprove: boolean;
  canBranchApprove?: boolean;
  canHrReview?: boolean;
  canHrAdminApprove?: boolean;
  canChairmanApprove?: boolean;
  isHrDivisionBranch?: boolean;
  userBranchId?: string | null;
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
  actorName?: string;
  actorEmail?: string;
  myEmployeeId?: string;
  onOpenDecision: (req: HiringRequest, action: "approved" | "rejected") => void;
  onDelete?: (id: string) => void;
}

export const HiringRequestCard = memo(function HiringRequestCard({
  request: r,
  canBranchApprove = false,
  canHrReview = false,
  canHrAdminApprove = false,
  canChairmanApprove = false,
  userBranchId = null,
  isSuperAdmin = false,
  isAdmin = false,
  actorName,
  actorEmail,
  myEmployeeId,
  onOpenDecision,
  onDelete,
}: HiringRequestCardProps) {
  const [searchParams] = useSearchParams();
  const isHighlighted = searchParams.get("highlight") === r.id;
  const isOwner =
    (myEmployeeId && r.requested_by_id === myEmployeeId) ||
    (actorEmail && r.requested_by_email?.toLowerCase() === actorEmail.toLowerCase()) ||
    (actorName && r.requested_by_name?.toLowerCase() === actorName.toLowerCase());

  const canDeleteThisRequest = isOwner || isSuperAdmin || isAdmin;
  const isStage1Branch = !r.status || r.status === "pending" || r.status === "pending_branch_review";
  const isStage2HrReview = r.status === "pending_hr_review";
  const isStage3HrAdmin = r.status === "pending_hr_admin_review";
  const isStage4Chairman = r.status === "pending_chairman_review";

  const canActStage1 = isStage1Branch && canBranchApprove && (isSuperAdmin || !r.branch_id || r.branch_id === userBranchId);
  const canActStage2 = isStage2HrReview && (canHrReview || isSuperAdmin);
  const canActStage3 = isStage3HrAdmin && (canHrAdminApprove || isSuperAdmin);
  const canActStage4 = isStage4Chairman && (canChairmanApprove || isSuperAdmin);

  const recruiterName = r.assigned_recruiter_name || r.hr_assigned_to_name;

  return (
    <div
      className={`bg-white rounded-3xl border p-5 transition-all duration-200 ${
        isHighlighted
          ? "border-amber-400 ring-4 ring-amber-400/20 bg-amber-50/10 shadow-lg"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-[#253C7D] border border-blue-100">
              {r.requisition_id || "REQ-DRAFT"}
            </span>
            <HiringRequestStatusBadges request={r} />
            {r.position_type === "replacement" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <i className="ri-repeat-line" /> Replacement
              </span>
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 flex-wrap">
              <span>{r.title}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                {r.headcount} {r.headcount > 1 ? "Openings" : "Opening"}
              </span>
            </h3>

            <div className="flex items-center gap-x-4 gap-y-1 mt-1.5 flex-wrap text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1">
                <i className="ri-building-line text-[#253C7D]" />
                {r.company ? `${r.company} · ` : ""}{r.branches?.name || r.business_unit || "HQ"}
              </span>
              <span className="flex items-center gap-1">
                <i className="ri-folder-user-line text-gray-400" />
                {r.department}{r.division ? ` · ${r.division}` : ""}
              </span>
              {r.hiring_manager_name && (
                <span className="flex items-center gap-1">
                  <i className="ri-user-settings-line text-gray-400" />
                  Hiring Manager: <strong className="text-gray-800">{r.hiring_manager_name}</strong>
                </span>
              )}
              {recruiterName && (
                <span className="flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                  <i className="ri-user-star-line text-purple-600 font-bold" />
                  Assigned Recruiter: <strong className="text-purple-900">{recruiterName}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Audit trail */}
          <div className="flex items-center gap-2.5 pt-1 flex-wrap text-xs">
            {r.branch_approved_by && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                <i className="ri-checkbox-circle-line text-amber-600" /> Endorsed: <strong>{r.branch_approved_by}</strong>
                {r.branch_approved_at && ` · ${formatDateTime(r.branch_approved_at)}`}
              </span>
            )}
            {r.hr_reviewed_by && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 font-medium">
                <i className="ri-user-star-line text-sky-600" /> HR Reviewed: <strong>{r.hr_reviewed_by}</strong>
                {r.hr_reviewed_at && ` · ${formatDateTime(r.hr_reviewed_at)}`}
              </span>
            )}
            {r.chairman_approved_by && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                <i className="ri-vip-crown-line text-emerald-600" /> Authorized: <strong>{r.chairman_approved_by}</strong>
                {r.chairman_approved_at && ` · ${formatDateTime(r.chairman_approved_at)}`}
              </span>
            )}
          </div>

          {/* Description & Justification */}
          <div className="space-y-2 mt-2">
            {r.justification && (
              <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100 text-xs text-gray-600">
                <strong className="text-gray-700 font-bold block mb-0.5">Business Need:</strong>
                {r.justification}
              </div>
            )}
            {r.job_description && (
              <div className="p-3 bg-blue-50/40 rounded-2xl border border-blue-100/60 text-xs text-gray-700">
                <strong className="text-blue-900 font-bold block mb-0.5">Job Description & Requirements:</strong>
                <p className="whitespace-pre-wrap">{r.job_description}</p>
              </div>
            )}
            {r.status === "rejected" && r.rejection_reason && (
              <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-100 text-xs text-rose-800">
                <strong className="text-rose-900 font-bold block mb-0.5">Rejection Feedback / Reason:</strong>
                {r.rejection_reason}
              </div>
            )}
          </div>
        </div>

        <HiringRequestCardActions
          request={r}
          canActStage1={canActStage1}
          canActStage2={canActStage2}
          canActStage3={canActStage3}
          canActStage4={canActStage4}
          canDelete={Boolean(canDeleteThisRequest)}
          onOpenDecision={onOpenDecision}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
});
