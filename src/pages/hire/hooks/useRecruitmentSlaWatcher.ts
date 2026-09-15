import { useEffect, useRef, useCallback } from "react";
import type { HiringRequest, Candidate } from "../types";
import { evaluateStageSla, StageSlaEvaluation } from "../constants/slaConfig";
import { todayYMD } from "@/lib/date";
import {
  notifySlaExceeded,
  notifyInterviewFeedbackOverdue,
} from "@/services/notifications/recruitmentNotificationTriggers";

interface UseRecruitmentSlaWatcherProps {
  hiringRequests: HiringRequest[];
  candidates: Candidate[];
  enabled?: boolean;
}

function hasAlertedToday(key: string): boolean {
  try {
    const today = todayYMD();
    return localStorage.getItem(`hrm_sla_alert_${key}_${today}`) === "1";
  } catch {
    return false;
  }
}

function markAlertedToday(key: string): void {
  try {
    const today = todayYMD();
    localStorage.setItem(`hrm_sla_alert_${key}_${today}`, "1");
  } catch {
    // Ignore storage quota
  }
}

export function useRecruitmentSlaWatcher({
  hiringRequests,
  candidates,
  enabled = true,
}: UseRecruitmentSlaWatcherProps) {
  const isCheckingRef = useRef(false);

  const checkRequisitionSlas = useCallback(async () => {
    if (!enabled || isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      // 1. Check Requisition SLAs
      for (const req of hiringRequests) {
        if (req.status === "approved" || req.status === "rejected" || req.status === "fulfilled") {
          continue;
        }

        const stageTimestamp = req.stage_entered_at || req.created_at;
        const evaluation = evaluateStageSla(req.status, stageTimestamp, false);

        if (evaluation?.isOverdue) {
          const alertKey = `req-${req.id}-${req.status}`;
          if (hasAlertedToday(alertKey)) continue;

          markAlertedToday(alertKey);
          const reqCode = req.requisition_id ? `[${req.requisition_id}] ` : "";
          const buName = req.branches?.name || req.business_unit || "OPS sulotion";

          // Canonical Notification Engine Dispatch (Event 16: SLA exceeded)
          await notifySlaExceeded({
            entityType: "hiring_request",
            entityId: req.id,
            entityCode: req.requisition_id || "REQ",
            entityTitle: req.title,
            stageName: req.status.replace(/_/g, " "),
            daysInStage: Math.floor(evaluation.hoursElapsed / 24),
            slaLimitDays: Math.floor(evaluation.allowedHours / 24),
            businessUnit: buName,
            branchId: req.branch_id || null,
          }).catch((e) => console.error("[notifySlaExceeded] error:", e));
        }
      }

      // 2. Check Candidate SLAs & Feedback Overdue
      for (const cand of candidates) {
        if (cand.stage === "hired" || cand.stage === "rejected") continue;

        const stageTimestamp = cand.applied_at;
        const evaluation = evaluateStageSla(cand.stage, stageTimestamp, true);

        if (evaluation?.isOverdue) {
          const alertKey = `cand-sla-${cand.id}-${cand.stage}`;
          if (hasAlertedToday(alertKey)) continue;

          markAlertedToday(alertKey);

          // If in interview stage, alert interview feedback overdue (Event 8)
          if (cand.stage.includes("interview")) {
            void notifyInterviewFeedbackOverdue({
              candidate: cand,
              jobTitle: cand.job_postings?.title || "Specialist",
              interviewerName: "Interview Panel",
              interviewDate: cand.applied_at ? new Date(cand.applied_at).toLocaleDateString() : "Recent",
              hoursElapsed: evaluation.hoursElapsed,
              businessUnit: cand.job_postings?.branches?.name || "OPS sulotion",
            }).catch((e) => console.error("[notifyInterviewFeedbackOverdue] error:", e));
          } else {
            // Otherwise dispatch general SLA exceeded (Event 16)
            void notifySlaExceeded({
              entityType: "candidate",
              entityId: cand.id,
              entityCode: cand.full_name,
              entityTitle: `Candidate: ${cand.full_name}`,
              stageName: cand.stage.replace(/_/g, " "),
              daysInStage: Math.floor(evaluation.hoursElapsed / 24),
              slaLimitDays: Math.floor(evaluation.allowedHours / 24),
              businessUnit: cand.job_postings?.branches?.name || "OPS sulotion",
              branchId: cand.job_postings?.branch_id || null,
            }).catch((e) => console.error("[notifySlaExceeded candidate] error:", e));
          }
        }
      }
    } catch (err) {
      console.error("checkRequisitionSlas error:", err);
    } finally {
      isCheckingRef.current = false;
    }
  }, [enabled, hiringRequests, candidates]);

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
