import type { OnboardingRequest, OnboardingDoc } from "./types";
import { STAGES } from "./constants";
import {
  ONBOARDING_DOCUMENT_TEMPLATES as DOCUMENT_TEMPLATES,
  ONBOARDING_DEFAULT_CHECKLIST_TASKS as DEFAULT_CHECKLIST_TASKS,
  STAGE_DEFAULT_DUE_DAYS,
  CATEGORY_TO_STAGE,
} from "@/lib/onboarding";

export const initials = (first?: string, last?: string): string =>
  `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

export const formatDateTimeLocal = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const getOverallProgress = (
  req: OnboardingRequest,
  documents: OnboardingDoc[]
): number => {
  if (req.status === "completed" || req.stage === "complete") return 100;
  const totalDocs = documents.filter((d) => d.onboarding_request_id === req.id);
  if (totalDocs.length === 0) {
    const idx = STAGES.findIndex((s) => s.key === req.stage);
    return Math.round((idx / (STAGES.length - 1)) * 100);
  }
  const completedDocs = totalDocs.filter((d) => d.status === "complete").length;
  return Math.round((completedDocs / totalDocs.length) * 100);
};

export const buildDefaultDocumentInserts = (req: OnboardingRequest, existingDocs: OnboardingDoc[]) => {
  const toInsert: any[] = [];
  const startedAt = new Date(req.created_at);

  Object.entries(DOCUMENT_TEMPLATES).forEach(([stageKey, templates]) => {
    const dueDate = new Date(startedAt.getTime() + (STAGE_DEFAULT_DUE_DAYS[stageKey] ?? 7) * 86400000).toISOString();
    templates.forEach((name) => {
      if (!existingDocs.some((d) => d.stage === stageKey && d.document_name === name)) {
        toInsert.push({
          onboarding_request_id: req.id,
          employee_id: req.employee_id,
          document_name: name,
          stage: stageKey,
          status: "pending",
          file_url: null,
          file_name: null,
          notes: null,
          due_date: dueDate,
        });
      }
    });
  });
  return toInsert;
};

export const buildDefaultTaskInserts = (req: OnboardingRequest) => {
  const startedAt = new Date(req.created_at);
  return DEFAULT_CHECKLIST_TASKS.map((t, idx) => ({
    onboarding_request_id: req.id,
    task_name: t.task_name,
    description: t.description,
    category: t.category,
    priority: t.priority,
    sort_order: idx + 1,
    completed: false,
    due_date: new Date(startedAt.getTime() + (STAGE_DEFAULT_DUE_DAYS[CATEGORY_TO_STAGE[t.category]] ?? 7) * 86400000)
      .toISOString()
      .split("T")[0],
  }));
};
