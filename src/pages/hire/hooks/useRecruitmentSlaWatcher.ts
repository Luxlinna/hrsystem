import { useEffect, useRef, useCallback } from "react";
import type { HiringRequest, Candidate } from "../types";
import { evaluateStageSla, StageSlaEvaluation } from "../constants/slaConfig";
import { sendDualRecruitmentNotification } from "../services/notifications/recruitmentNotifyEngine";
import { escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";

interface UseRecruitmentSlaWatcherProps {
  hiringRequests: HiringRequest[];
  candidates: Candidate[];
  enabled?: boolean;
}

const alertedStages = new Set<string>();

export function useRecruitmentSlaWatcher({
  hiringRequests,
  candidates: _candidates,
  enabled = true,
}: UseRecruitmentSlaWatcherProps) {
  const isCheckingRef = useRef(false);

  const checkRequisitionSlas = useCallback(async () => {
    if (!enabled || isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      for (const req of hiringRequests) {
        if (req.status === "approved" || req.status === "rejected" || req.status === "fulfilled") {
          continue;
        }

        const stageTimestamp = req.stage_entered_at || req.created_at;
        const evaluation = evaluateStageSla(req.status, stageTimestamp, false);

        if (evaluation?.isOverdue) {
          const alertKey = `req-${req.id}-${req.status}`;
          if (alertedStages.has(alertKey)) continue;

          alertedStages.add(alertKey);
          const reqCode = req.requisition_id ? `[${req.requisition_id}] ` : "";
          const recruiterId = req.assigned_recruiter_id || req.hr_assigned_to_id || null;
          const recruiterName = req.assigned_recruiter_name || req.hr_assigned_to_name || "Assigned Recruiter";
          const daysOverdue = Math.max(1, Math.floor(evaluation.overdueHours / 24));

          await sendDualRecruitmentNotification({
            title: `⚠️ SLA Exceeded: ${reqCode}${req.title}`,
            approverMessage: `Requisition ${reqCode}${req.title} has exceeded the stage turnaround SLA by ${daysOverdue} day(s) (Stage: ${req.status.replace(/_/g, " ")}). Please review promptly.`,
            recruiterMessage: `Standing SLA Alert: Requisition ${reqCode}${req.title} is ${daysOverdue} day(s) overdue in ${req.status.replace(/_/g, " ")}. Expedited action needed.`,
            type: "warning",
            entityId: req.id,
            approverBranchId: req.branch_id || null,
            recruiterEmployeeId: recruiterId,
            recruiterName,
            telegramHtml:
              `⏱️ <b>Recruitment SLA Exceeded</b>\n` +
              `💼 <b>Requisition:</b> ${escapeTelegramHtml(reqCode)}${escapeTelegramHtml(req.title)}\n` +
              `🏢 <b>Department:</b> ${escapeTelegramHtml(req.department)}\n` +
              `⚠️ <b>Current Stage:</b> ${escapeTelegramHtml(req.status)}\n` +
              `🚨 <b>Overdue By:</b> ${daysOverdue} day(s) (${evaluation.overdueHours}h)\n` +
              `🎯 <b>Assigned Recruiter:</b> ${escapeTelegramHtml(recruiterName)}`,
            telegramButtonText: "Expedite Requisition",
            telegramUrl: hrNexusUrl("/hire"),
            auditAction: "sla_exceeded",
            actorName: "SLA Watcher",
            actorRole: "Automated Monitor",
            description: `Requisition ${reqCode}${req.title} breached ${req.status} SLA by ${evaluation.overdueHours}h`,
          });
        }
      }
    } catch (err) {
      console.error("checkRequisitionSlas error:", err);
    } finally {
      isCheckingRef.current = false;
    }
  }, [enabled, hiringRequests]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkRequisitionSlas();
    }, 4000);
    return () => clearTimeout(timer);
  }, [checkRequisitionSlas]);

  const getRequisitionSla = useCallback((req: HiringRequest): StageSlaEvaluation | null => {
    if (req.status === "approved" || req.status === "rejected" || req.status === "fulfilled") {
      return null;
    }
    const stageTimestamp = req.stage_entered_at || req.created_at;
    return evaluateStageSla(req.status, stageTimestamp, false);
  }, []);

  return {
    getRequisitionSla,
    checkRequisitionSlas,
  };
}
