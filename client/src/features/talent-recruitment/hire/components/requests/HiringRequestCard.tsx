import { memo } from "react";
import { useSearchParams } from "react-router-dom";
import type { HiringRequest } from "../../types";
import { formatDateTime } from "../../hireUtils";
import { HiringRequestStatusBadges } from "./HiringRequestStatusBadges";
import { HiringRequestCardActions } from "./HiringRequestCardActions";
import { RequisitionJobDescriptionView } from "./RequisitionJobDescriptionView";

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
  onEdit?: (req: HiringRequest) => void;
  onDelete?: (id: string) => void;
  onOpenExport?: (req: HiringRequest, mode: "full_requisition" | "job_description") => void;
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
  onEdit,
  onDelete,
  onOpenExport,
}: HiringRequestCardProps) {
  const [searchParams] = useSearchParams();
  const isHighlighted = searchParams.get("highlight") === r.id;
  const isOwner = Boolean(
    (myEmployeeId && r.requested_by_id === myEmployeeId) ||
    (actorEmail && r.requested_by_email?.toLowerCase() === actorEmail.toLowerCase()) ||
    (actorName && r.requested_by_name?.toLowerCase() === actorName.toLowerCase())
  );

  // Only the requester who created the requisition (or Super Admin) can delete it.
  // Other reviewers and approvers can only approve or reject.
  const canDeleteThisRequest = isOwner || isSuperAdmin;
  const isStage1Branch = !r.status || r.status === "pending" || r.status === "pending_branch_review";
  const isStage2HrReview = r.status === "pending_hr_review";
  const isStage3HrAdmin = r.status === "pending_hr_admin_review";
  const isStage4Chairman = r.status === "pending_chairman_review";

  const canActStage1 = isStage1Branch && canBranchApprove && (!isOwner || isSuperAdmin) && (isSuperAdmin || !r.branch_id || r.branch_id === userBranchId);
  const canActStage2 = isStage2HrReview && (canHrReview || isSuperAdmin) && (!isOwner || isSuperAdmin);
  const canActStage3 = isStage3HrAdmin && (canHrAdminApprove || isSuperAdmin) && (!isOwner || isSuperAdmin);
  const canActStage4 = isStage4Chairman && (canChairmanApprove || isSuperAdmin);

  const recruiterName = r.assigned_recruiter_name || r.hr_assigned_to_name;

  return (
    <div
      className={`bg-white rounded-2xl border p-3.5 sm:p-4 transition-all duration-200 ${
        isHighlighted
          ? "border-amber-400 ring-4 ring-amber-400/20 bg-amber-50/10 shadow-lg"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3.5">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-[#253C7D] border border-blue-100">
              {r.requisition_id || "REQ-DRAFT"}
            </span>
            <HiringRequestStatusBadges request={r} />
            {r.position_type === "replacement" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <i className="ri-repeat-line" /> Replacement
              </span>
            )}
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2 flex-wrap">
              <span>{r.title}</span>
              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600">
                {r.headcount} {r.headcount > 1 ? "Openings" : "Opening"}
              </span>
            </h3>

            <div className="flex items-center gap-x-3 gap-y-1 mt-1.5 flex-wrap text-[11px] text-gray-500 font-medium">
              <span className="flex items-center gap-1 text-slate-800 font-semibold">
                <i className="ri-building-line text-[#253C7D]" />
                {r.company ? `${r.company} · ` : ""}{r.branches?.name || r.business_unit || "Headquarters"}
              </span>
              {r.site && (
                <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 text-[10px] font-semibold">
                  <i className="ri-map-pin-2-line text-emerald-600" />
                  Site: {r.site}
                </span>
              )}
              <span className="flex items-center gap-1 text-slate-700">
                <i className="ri-folder-user-line text-gray-400" />
                {r.department}{r.division ? ` · ${r.division}` : ""}
              </span>
              {r.employee_level && (
                <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-200 text-[10px] font-bold">
                  <i className="ri-shield-star-line text-indigo-600" />
                  Level: {r.employee_level}
                </span>
              )}
              {(r.contract_type || r.employee_type || r.employment_type) && (
                <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200 text-[10px] font-medium">
                  <i className="ri-file-paper-2-line text-blue-600" />
                  {r.contract_type || r.employee_type || r.employment_type}
                </span>
              )}
              {r.hiring_manager_name && (
                <span className="flex items-center gap-1">
                  <i className="ri-user-settings-line text-gray-400" />
                  Hiring Manager: <strong className="text-gray-800">{r.hiring_manager_name}</strong>
                </span>
              )}
              {recruiterName && (
                <span className="flex items-center gap-1 text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200">
                  <i className="ri-user-star-line text-purple-600 font-bold" />
                  Assigned Recruiter: <strong className="text-purple-900">{recruiterName}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Audit trail */}
          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap text-[10.5px]">
            {r.branch_approved_by && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                <i className="ri-checkbox-circle-line text-amber-600 text-xs" /> Endorsed: <strong>{r.branch_approved_by}</strong>
                {r.branch_approved_at && ` · ${formatDateTime(r.branch_approved_at)}`}
              </span>
            )}
            {r.hr_reviewed_by && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 font-medium">
                <i className="ri-user-star-line text-sky-600 text-xs" /> HR Reviewed: <strong>{r.hr_reviewed_by}</strong>
                {r.hr_reviewed_at && ` · ${formatDateTime(r.hr_reviewed_at)}`}
              </span>
            )}
            {r.hr_admin_approved_by && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-medium">
                <i className="ri-shield-star-line text-purple-600 text-xs" /> HR Admin Approved: <strong>{r.hr_admin_approved_by}</strong>
                {r.hr_admin_approved_at && ` · ${formatDateTime(r.hr_admin_approved_at)}`}
              </span>
            )}
            {r.chairman_approved_by && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                <i className="ri-vip-crown-line text-emerald-600 text-xs" /> Authorized: <strong>{r.chairman_approved_by}</strong>
                {r.chairman_approved_at && ` · ${formatDateTime(r.chairman_approved_at)}`}
              </span>
            )}
          </div>

          {/* Description & Justification */}
          <div className="space-y-1.5 mt-1.5">
            {r.justification && (
              <div className="p-2.5 bg-gray-50/80 rounded-xl border border-gray-100 text-[11px] text-gray-600 leading-relaxed">
                <strong className="text-gray-700 font-bold block mb-0.5">Business Need:</strong>
                {r.justification}
              </div>
            )}
            <RequisitionJobDescriptionView request={r} onOpenExport={onOpenExport} />
            {r.status === "rejected" && r.rejection_reason && (
              <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-100 text-[11px] text-rose-800 leading-relaxed">
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
          canEdit={Boolean(canDeleteThisRequest)}
          canDelete={Boolean(canDeleteThisRequest)}
          onOpenDecision={onOpenDecision}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpenExport={onOpenExport}
        />
      </div>
    </div>
  );
});
