import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/notify";
import { DOC_TO_TASK, TASK_TO_DOC } from "@/lib/onboarding";
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
  if (!docName || !taskName) return false;
  const d = docName.trim();
  const t = taskName.trim();

  // 1. Direct dictionary match from shared mapping
  if (DOC_TO_TASK[d] === t || TASK_TO_DOC[t] === d) return true;

  // 2. Exact case-insensitive match
  if (d.toLowerCase() === t.toLowerCase()) return true;

  // 3. Fallback direct pairs to ensure strict 1-to-1 correlation
  const pairs: [string, string][] = [
    ["offer letter", "sign offer letter"],
    ["id verification", "verify national id"],
    ["employment contract", "sign employment contract"],
    ["bank details", "submit bank account"],
    ["nda agreement", "sign non-disclosure"],
    ["laptop assignment", "provision laptop"],
    ["email account setup", "create corporate email"],
    ["vpn access", "configure vpn"],
    ["software licenses", "grant software"],
    ["security badge", "issue security access badge"],
    ["hr orientation", "hr orientation & company policies"],
    ["team introduction", "team introductions"],
    ["role training schedule", "role-specific skills training"],
    ["handbook acknowledgment", "review & acknowledge employee handbook"],
    ["onboarding sign-off", "final onboarding sign-off"],
    ["30-day check-in", "schedule 30-day check-in"],
    ["feedback survey", "complete new hire experience"],
  ];

  const dLow = d.toLowerCase();
  const tLow = t.toLowerCase();

  for (const [pDoc, pTask] of pairs) {
    if (dLow.includes(pDoc) && tLow.includes(pTask)) return true;
  }

  return false;
};

export async function syncTaskWithOnboardingDocuments(
  onboardingRequestId: string,
  taskName: string,
  completed: boolean
) {
  try {
    // Only propagate completion forward; do not unselect the requirement from onboarding when marked pending
    if (!completed) return;

    const { data: relatedDocs } = await supabase
      .from("onboarding_documents")
      .select("id, document_name")
      .eq("onboarding_request_id", onboardingRequestId);

    if (relatedDocs && relatedDocs.length > 0) {
      const matchingDocs = relatedDocs.filter((d) => matchDocAndTask(d.document_name, taskName));
      for (const d of matchingDocs) {
        await supabase
          .from("onboarding_documents")
          .update({ status: "complete" })
          .eq("id", d.id);
      }
    }
  } catch (e) {
    console.error("Doc sync error:", e);
  }
}

export async function notifyAssigneeOfChecklistTask({
  taskName,
  assignedTo,
  hireName,
  dueDate,
  taskId,
  staffList,
}: {
  taskName: string;
  assignedTo: string;
  hireName: string;
  dueDate?: string | null;
  taskId?: string;
  staffList?: any[];
}) {
  if (!assignedTo || !assignedTo.trim()) return;
  const targetName = assignedTo.trim();

  try {
    // 1. Locate staff member in provided list or database
    let emp: any = staffList?.find(
      (s: any) => `${s.first_name || ""} ${s.last_name || ""}`.trim().toLowerCase() === targetName.toLowerCase()
    );

    if (!emp || !emp.email) {
      const parts = targetName.split(/\s+/);
      const first = parts[0] || targetName;
      const last = parts.slice(1).join(" ") || "";
      let empQuery = supabase
        .from("employees")
        .select("id, email, phone, first_name, last_name, branch_id")
        .ilike("first_name", `%${first}%`);
      if (last) {
        empQuery = empQuery.ilike("last_name", `%${last}%`);
      }
      const { data } = await empQuery.maybeSingle();
      if (data) emp = data;
    }

    // 2. Lookup recipient user ID from user_role_assignments by email, phone, or display name
    let recipientUserId: string | null = null;
    const searchConditions: string[] = [];

    if (emp?.email) {
      searchConditions.push(`email.ilike.${emp.email.trim()}`);
    }
    if (emp?.phone) {
      const cleanPhone = emp.phone.replace(/[^0-9]/g, "");
      if (cleanPhone) {
        searchConditions.push(`email.ilike.${cleanPhone}@phone.hrmsystem.local`);
      }
    }
    searchConditions.push(`display_name.ilike.%${targetName}%`);

    if (searchConditions.length > 0) {
      const { data: uraList } = await supabase
        .from("user_role_assignments")
        .select("user_id, email, display_name")
        .or(searchConditions.join(","))
        .limit(1);

      if (uraList && uraList.length > 0 && uraList[0].user_id) {
        recipientUserId = uraList[0].user_id;
      }
    }

    // 3. Dispatch system notification to employee account
    await notify({
      title: "New Checklist Task Assigned",
      message: `You have been assigned to task: "${taskName}" for ${hireName}.${dueDate ? ` (Due: ${new Date(dueDate).toLocaleDateString()})` : ""}`,
      type: "info",
      source: "onboarding",
      entityId: taskId || null,
      recipientUserId: recipientUserId || null,
      branchId: null, // deliver to employee without branch filter suppression
    });
  } catch (err) {
    console.error("Failed to notify checklist task assignee:", err);
  }
}
