import { dispatchNotification } from "./notificationEngine";

/**
 * Event 4: Rejected
 */
export async function notifyRejected(params: {
  entityType: string;
  entityId: string;
  entityCode: string;
  entityTitle: string;
  rejectedBy: string;
  rejectorRole: string;
  reason: string;
  businessUnit?: string;
  branchId?: string | null;
}) {
  const { entityType, entityId, entityCode, entityTitle, rejectedBy, rejectorRole, reason, businessUnit, branchId } = params;

  await dispatchNotification({
    event: "rejected",
    title: `Declined / Rejected: [${entityCode}] ${entityTitle}`,
    message: `[${entityCode}] ${entityTitle} was rejected by ${rejectedBy} (${rejectorRole}). Reason: ${reason}`,
    type: "error",
    entityId,
    entityType,
    entityTitle: `[${entityCode}] ${entityTitle}`,
    businessUnit,
    branchId,
    actorName: rejectedBy,
    actorRole: rejectorRole,
    reason,
    actionUrl: "/hire",
    actionButtonText: "View Details",
  });
}

/**
 * Event 16: SLA exceeded
 */
export async function notifySlaExceeded(params: {
  entityType: string;
  entityId: string;
  entityCode: string;
  entityTitle: string;
  stageName: string;
  daysInStage: number;
  slaLimitDays: number;
  responsibleRole?: string;
  businessUnit?: string;
  branchId?: string | null;
}) {
  const {
    entityType,
    entityId,
    entityCode,
    entityTitle,
    stageName,
    daysInStage,
    slaLimitDays,
    responsibleRole = "HR Manager / BU CEO",
    businessUnit = "OPS Solutions Co ., Ltd",
    branchId,
  } = params;

  const daysOverdue = daysInStage - slaLimitDays;

  await dispatchNotification({
    event: "sla_exceeded",
    title: `🚨 SLA Exceeded: [${entityCode}] ${entityTitle}`,
    message: `[${entityCode}] ${entityTitle} has exceeded the defined SLA threshold in stage "${stageName}". Elapsed: ${daysInStage} days (Limit: ${slaLimitDays} days, ${daysOverdue} days overdue). Attention required by ${responsibleRole}.`,
    type: "error",
    entityId,
    entityType,
    entityTitle: `[${entityCode}] ${entityTitle}`,
    businessUnit,
    branchId,
    recipientRole: responsibleRole,
    actionUrl: "/hire",
    actionButtonText: "Expedite Pipeline Item",
    details: {
      "Item": entityTitle,
      "Stage": stageName,
      "Elapsed Days": `${daysInStage} days`,
      "SLA Limit": `${slaLimitDays} days`,
      "Days Overdue": `${daysOverdue} days`,
    },
  });
}
