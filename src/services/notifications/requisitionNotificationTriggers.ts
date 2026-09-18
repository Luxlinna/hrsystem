import { dispatchNotification } from "./notificationEngine";
import type { HiringRequest } from "@/pages/hire/types";

/**
 * Event 1: Requisition submitted
 */
export async function notifyRequisitionSubmitted(params: {
  requisition: HiringRequest;
  submittedBy: string;
  submitterRole?: string;
  businessUnit?: string;
}) {
  const { requisition, submittedBy, submitterRole = "Hiring Manager", businessUnit } = params;
  const bu = businessUnit || requisition.branches?.name || "OPS Solutions Co ., Ltd";
  const reqCode = requisition.requisition_id || "REQ";

  await dispatchNotification({
    event: "requisition_submitted",
    title: `New Requisition: [${reqCode}] ${requisition.title}`,
    message: `${submittedBy} (${submitterRole}) submitted requisition [${reqCode}] ${requisition.title} for ${requisition.headcount} headcount in ${requisition.department}. Pending BU CEO review.`,
    type: "info",
    entityId: requisition.id,
    entityType: "hiring_request",
    entityTitle: `[${reqCode}] ${requisition.title}`,
    businessUnit: bu,
    branchId: requisition.branch_id || null,
    actorName: submittedBy,
    actorRole: submitterRole,
    recipientRole: "BU CEO",
    actionUrl: `/hire?tab=requisitions&id=${requisition.id}`,
    actionButtonText: "Review Requisition",
    details: {
      "Requisition Code": reqCode,
      "Position": requisition.title,
      "Department": requisition.department,
      "Headcount": requisition.headcount,
    },
  });
}

/**
 * Event 2: Approval pending
 */
export async function notifyApprovalPending(params: {
  entityType: "hiring_request" | "candidate_approval" | "offer_letter" | "employment_contract";
  entityId: string;
  entityCode: string;
  entityTitle: string;
  approverRole: string;
  actorName: string;
  actorRole?: string;
  businessUnit?: string;
  targetBusinessUnit?: string;
  isCrossBu?: boolean;
  branchId?: string | null;
  actionUrl?: string;
}) {
  const {
    entityType,
    entityId,
    entityCode,
    entityTitle,
    approverRole,
    actorName,
    actorRole = "Officer",
    businessUnit = "Corporate",
    targetBusinessUnit,
    isCrossBu = false,
    branchId,
    actionUrl,
  } = params;

  await dispatchNotification({
    event: "approval_pending",
    title: `Approval Pending: [${entityCode}] ${entityTitle}`,
    message: `Review & authorization required by ${approverRole} for [${entityCode}] ${entityTitle}. Forwarded by ${actorName} (${actorRole}).`,
    type: "warning",
    entityId,
    entityType,
    entityTitle: `[${entityCode}] ${entityTitle}`,
    businessUnit,
    targetBusinessUnit,
    isCrossBu,
    branchId,
    actorName,
    actorRole,
    recipientRole: approverRole,
    actionUrl: actionUrl || "/hire",
    actionButtonText: `Review as ${approverRole}`,
    details: {
      "Reference": entityCode,
      "Item": entityTitle,
      "Pending Authority": approverRole,
    },
  });
}

/**
 * Event 3: Revision requested
 */
export async function notifyRevisionRequested(params: {
  entityType: string;
  entityId: string;
  entityCode: string;
  entityTitle: string;
  requestedBy: string;
  requestorRole: string;
  reason: string;
  businessUnit?: string;
  branchId?: string | null;
  actionUrl?: string;
}) {
  const { entityType, entityId, entityCode, entityTitle, requestedBy, requestorRole, reason, businessUnit, branchId, actionUrl } = params;

  await dispatchNotification({
    event: "revision_requested",
    title: `Revision Requested: [${entityCode}] ${entityTitle}`,
    message: `${requestedBy} (${requestorRole}) requested revision for [${entityCode}] ${entityTitle}. Reason: ${reason}`,
    type: "warning",
    entityId,
    entityType,
    entityTitle: `[${entityCode}] ${entityTitle}`,
    businessUnit,
    branchId,
    actorName: requestedBy,
    actorRole: requestorRole,
    reason,
    actionUrl: actionUrl || "/hire",
    actionButtonText: "Update & Resubmit",
    details: {
      "Reference": entityCode,
      "Requested By": `${requestedBy} (${requestorRole})`,
      "Feedback": reason,
    },
  });
}
