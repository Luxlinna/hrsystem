import { supabase } from "@/lib/supabase";
import type { OnboardingHire, ChecklistTask } from "./types";

export const getHireName = (hire: OnboardingHire | null): string => {
  if (!hire?.employees) return "New Hire";
  return `${hire.employees.first_name} ${hire.employees.last_name}`.trim();
};

export const getHireInitials = (hire: OnboardingHire | null): string => {
  if (!hire?.employees) return "NH";
  const first = hire.employees.first_name?.[0] || "";
  const last = hire.employees.last_name?.[0] || "";
  return (first + last).toUpperCase() || "NH";
};

export const isOverdue = (task: ChecklistTask): boolean => {
  if (task.completed || !task.due_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.due_date + "T00:00:00");
  return due < today;
};

export const matchDocAndTask = (docName: string, taskName: string): boolean => {
  const d = docName.toLowerCase().trim();
  const t = taskName.toLowerCase().trim();
  if (t.includes(d) || d.includes(t)) return true;

  const keywords: [string[], string[]][] = [
    [["offer"], ["offer", "employment terms"]],
    [["id", "verification", "passport"], ["verify", "id", "passport"]],
    [["contract", "employment"], ["contract", "employment terms"]],
    [["bank", "details", "tax"], ["bank", "tax", "filing"]],
    [["nda", "agreement", "confidentiality"], ["nda", "confidentiality"]],
    [["laptop", "assignment", "hardware"], ["laptop", "hardware", "workstation"]],
    [["email", "account", "slack"], ["email", "slack", "teams"]],
    [["vpn", "access"], ["vpn", "remote"]],
    [["software", "license", "licenses"], ["software", "license", "licenses", "tool"]],
    [["security", "badge", "access"], ["badge", "workspace", "access"]],
    [["orientation", "checklist"], ["orientation", "walkthrough"]],
    [["team", "intro", "introduction"], ["team", "introduction", "welcome"]],
    [["training", "schedule"], ["training", "setup"]],
    [["handbook"], ["handbook", "acknowledge"]],
    [["signoff", "sign-off"], ["signoff", "sign-off", "complete"]],
    [["checkin", "check-in", "30day", "30-day"], ["checkin", "check-in", "30day", "30-day"]],
    [["survey", "feedback"], ["feedback", "survey"]],
  ];

  for (const [docKeys, taskKeys] of keywords) {
    const docMatches = docKeys.some((k) => d.includes(k));
    const taskMatches = taskKeys.some((k) => t.includes(k));
    if (docMatches && taskMatches) return true;
  }
  return false;
};

export async function syncTaskWithOnboardingDocuments(
  onboardingRequestId: string,
  taskName: string,
  completed: boolean
) {
  try {
    const { data: relatedDocs } = await supabase
      .from("onboarding_documents")
      .select("id, document_name")
      .eq("onboarding_request_id", onboardingRequestId);

    if (relatedDocs && relatedDocs.length > 0) {
      const matchingDocs = relatedDocs.filter((d) => matchDocAndTask(d.document_name, taskName));
      for (const d of matchingDocs) {
        await supabase
          .from("onboarding_documents")
          .update({ status: completed ? "complete" : "pending" })
          .eq("id", d.id);
      }
    }
  } catch (e) {
    console.error("Doc sync error:", e);
  }
}
