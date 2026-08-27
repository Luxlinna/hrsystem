import type { OnboardingRequest, OnboardingDoc } from "./types";
import { STAGES } from "./constants";

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
