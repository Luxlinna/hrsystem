import { supabase } from "@/lib/supabase";
import type { OnboardingHire, ChecklistTask } from "../types";
import { matchDocAndTask } from "../checklistUtils";
import {
  ONBOARDING_DEFAULT_CHECKLIST_TASKS,
  TASK_TO_DOC,
  DOC_TO_TASK,
} from "@/lib/onboarding";

export function filterHrStaff(st: any[], branchList: any[]) {
  const hrBranchIds = new Set(
    (branchList || [])
      .filter((b: any) => /hr\s*division|human\s*resource/i.test(b.name || ""))
      .map((b: any) => b.id)
  );

  return (st || []).filter((emp: any) => {
    if (emp.branch_id && hrBranchIds.has(emp.branch_id)) return true;
    const bName = Array.isArray(emp.branches)
      ? emp.branches[0]?.name || ""
      : emp.branches?.name || "";
    if (/hr\s*division|human\s*resource/i.test(bName)) return true;

    const dept = (emp.department || "").trim().toLowerCase();
    if (/^(hr|human\s*resources?|recruitment|talent|people)$/i.test(dept) || /hr\s*division/i.test(dept)) return true;

    const role = (emp.role || "").trim().toLowerCase();
    if (/(^|\b)(hr|recruiter|recruitment|talent|human\s*resources?)(\b|$)/i.test(role) || /super\s*admin/i.test(role)) return true;

    const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.toLowerCase();
    if (/hr\s*admin|hr\s*ops|recruiter/i.test(fullName)) return true;

    return false;
  });
}

export function formatHires(
  currentHr: any[],
  canViewCrossBranch: boolean,
  targetBranch?: string | null
): OnboardingHire[] {
  return currentHr
    .map((h: any) => ({
      ...h,
      employees: h.employees
        ? {
            ...h.employees,
            branches: Array.isArray(h.employees.branches)
              ? h.employees.branches[0] || null
              : h.employees.branches || null,
          }
        : null,
    }))
    .filter((h: any) => {
      if (canViewCrossBranch) return true;
      return h.employees?.branch_id === targetBranch;
    }) as OnboardingHire[];
}

export function syncTaskCompletions(rawTasks: any[], docs: any[]) {
  const tasksToSync: string[] = [];
  const result = (rawTasks || []).map((t: any) => {
    const matchingDoc = (docs || []).find(
      (d: any) =>
        d.onboarding_request_id === t.onboarding_request_id &&
        d.status === "complete" &&
        matchDocAndTask(d.document_name, t.task_name)
    );
    if (matchingDoc && !t.completed) {
      tasksToSync.push(t.id);
      return {
        ...t,
        completed: true,
        completed_at: t.completed_at || new Date().toISOString(),
        completed_by: t.completed_by || "Hiring Process",
      };
    }
    return t;
  });

  if (tasksToSync.length > 0) {
    supabase
      .from("onboarding_checklist_tasks")
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        completed_by: "Hiring Process",
      })
      .in("id", tasksToSync)
      .then(() => {});
  }

  return result;
}

const categoryMap: Record<string, string> = {
  document: "documents",
  it_setup: "it_setup",
  training: "training",
  complete: "general",
};

export function buildValidHireTasks(
  formattedHires: OnboardingHire[],
  cleanedRawTasks: any[],
  docs: any[]
): ChecklistTask[] {
  const finalTasks: ChecklistTask[] = [];

  for (const hire of formattedHires) {
    const hireSelectedDocs = (docs || []).filter(
      (d: any) => d.onboarding_request_id === hire.id && d.status === "complete"
    );
    const hireRawTasks = cleanedRawTasks.filter((t: any) => t.onboarding_request_id === hire.id);

    // Deduplicate existing tasks by task name
    const seenTaskNames = new Set<string>();
    const deduplicatedRawTasks = hireRawTasks.filter((t: any) => {
      const norm = (t.task_name || "").trim().toLowerCase();
      if (seenTaskNames.has(norm)) return false;
      seenTaskNames.add(norm);
      return true;
    });

    const validTasks = deduplicatedRawTasks.filter((t: any) => {
      const hasMatchingSelectedDoc = hireSelectedDocs.some((d: any) => matchDocAndTask(d.document_name, t.task_name));
      if (hasMatchingSelectedDoc) return true;

      const isStandardTemplate =
        ONBOARDING_DEFAULT_CHECKLIST_TASKS.some((st) => matchDocAndTask(st.task_name, t.task_name)) ||
        Boolean(TASK_TO_DOC[t.task_name]);

      if (isStandardTemplate) return false;
      return true;
    });

    const missingSelectedDocs = hireSelectedDocs.filter(
      (d: any) => !deduplicatedRawTasks.some((t: any) => matchDocAndTask(d.document_name, t.task_name))
    );

    if (missingSelectedDocs.length > 0) {
      for (let i = 0; i < missingSelectedDocs.length; i++) {
        const md = missingSelectedDocs[i];
        const taskName = DOC_TO_TASK[md.document_name] || md.document_name;
        if (
          validTasks.some(
            (v: any) => (v.task_name || "").trim().toLowerCase() === taskName.trim().toLowerCase()
          )
        ) {
          continue;
        }
        const isComplete = md.status === "complete";
        const newTaskPayload = {
          onboarding_request_id: hire.id,
          task_name: taskName,
          description: md.notes || `Requirement selected at Onboarding: ${md.document_name}`,
          category: categoryMap[md.stage] || "documents",
          priority: "medium",
          sort_order: validTasks.length + i + 1,
          completed: isComplete,
          completed_at: isComplete ? new Date().toISOString() : null,
          completed_by: isComplete ? "Hiring Process" : null,
          due_date: md.due_date ? md.due_date.split("T")[0] : null,
        };
        validTasks.push(newTaskPayload as any);
        supabase.from("onboarding_checklist_tasks").insert([newTaskPayload]).then(() => {});
      }
    }

    finalTasks.push(...(validTasks as ChecklistTask[]));
  }

  return finalTasks;
}
