import { supabase } from "@/lib/supabase";
import {
  STAGE_DEFAULT_DUE_DAYS,
  CATEGORY_TO_STAGE,
  ONBOARDING_DOCUMENT_TEMPLATES,
  ONBOARDING_DEFAULT_CHECKLIST_TASKS,
  TASK_TO_DOC,
} from "./onboardingConstants";

export * from "./onboardingConstants";
export { startOnboardingForCandidate } from "./onboardingCandidate";

const addDays = (from: Date, days: number) => new Date(from.getTime() + days * 24 * 60 * 60 * 1000);

export async function startOnboardingForEmployee(
  employeeId: string,
  requestedBy: string,
  selectedDocNames?: string[]
) {
  let employeeResumeUrl: string | null = null;
  let employeeResumeName: string | null = null;

  try {
    const { data: emp } = await supabase
      .from("employees")
      .select("id, email, phone, candidate_id, candidate_code, location, education, work_experience, skills, languages, expected_salary, notice_period, resume_url, resume_name")
      .eq("id", employeeId)
      .maybeSingle();

    if (emp) {
      employeeResumeUrl = emp.resume_url;
      employeeResumeName = emp.resume_name;

      let candQuery = null;
      if (emp.candidate_id) {
        candQuery = supabase.from("candidates").select("*").eq("id", emp.candidate_id).maybeSingle();
      } else if (emp.candidate_code) {
        candQuery = supabase.from("candidates").select("*").eq("candidate_code", emp.candidate_code).maybeSingle();
      } else if (emp.email) {
        candQuery = supabase.from("candidates").select("*").eq("email", emp.email).maybeSingle();
      } else if (emp.phone) {
        candQuery = supabase.from("candidates").select("*").eq("phone", emp.phone).maybeSingle();
      }

      if (candQuery) {
        const { data: cand } = await candQuery;
        if (cand) {
          employeeResumeUrl = emp.resume_url || cand.resume_url || null;
          employeeResumeName = emp.resume_name || cand.resume_name || null;
          await supabase.from("employees").update({
            candidate_id: cand.id,
            candidate_code: emp.candidate_code || cand.candidate_code,
            location: emp.location || cand.location || null,
            education: emp.education || cand.education || null,
            work_experience: emp.work_experience || cand.work_experience || null,
            skills: emp.skills?.length ? emp.skills : (cand.skills || []),
            languages: emp.languages?.length ? emp.languages : (cand.languages || []),
            expected_salary: emp.expected_salary ?? cand.expected_salary ?? null,
            notice_period: emp.notice_period || cand.notice_period || null,
            resume_url: employeeResumeUrl,
            resume_name: employeeResumeName,
          }).eq("id", employeeId);
        }
      }
    }
  } catch (err) {
    console.error("Failed to auto-populate candidate credentials:", err);
  }

  const { data: existingReq } = await supabase
    .from("onboarding_requests")
    .select("*, employees(first_name, last_name, role, department, branch_id, branches(name), candidate_code, candidate_id, location, resume_url, resume_name)")
    .eq("employee_id", employeeId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingReq) return { data: existingReq, error: null };

  const { data, error } = await supabase
    .from("onboarding_requests")
    .insert({ employee_id: employeeId, stage: "document", status: "pending", day_count: 0, requested_by: requestedBy })
    .select()
    .single();

  if (error) return { data: null, error };

  await supabase.from("employees").update({ status: "onboarding" }).eq("id", employeeId);
  const startedAt = new Date(data.created_at);
  const initialDocs: any[] = [];

  if (employeeResumeUrl) {
    initialDocs.push({
      onboarding_request_id: data.id,
      employee_id: employeeId,
      document_name: "Candidate CV & Credentials",
      stage: "document",
      status: "complete",
      file_url: employeeResumeUrl,
      file_name: employeeResumeName || "Master_Resume.pdf",
      notes: "Transferred automatically from candidate recruitment record",
      due_date: addDays(startedAt, STAGE_DEFAULT_DUE_DAYS["document"] ?? 3).toISOString(),
    });
  }

  const allowedDocsSet = selectedDocNames ? new Set(selectedDocNames) : null;
  Object.entries(ONBOARDING_DOCUMENT_TEMPLATES).forEach(([stageKey, templates]) => {
    const dueDate = addDays(startedAt, STAGE_DEFAULT_DUE_DAYS[stageKey] ?? 7).toISOString();
    templates.forEach((name) => {
      if (allowedDocsSet && !allowedDocsSet.has(name)) return;
      initialDocs.push({
        onboarding_request_id: data.id,
        employee_id: employeeId,
        document_name: name,
        stage: stageKey,
        status: "pending",
        due_date: dueDate,
      });
    });
  });
  if (initialDocs.length > 0) await supabase.from("onboarding_documents").insert(initialDocs);

  const selectedInitialTasks = ONBOARDING_DEFAULT_CHECKLIST_TASKS.filter((t) => {
    if (!allowedDocsSet) return true;
    const docName = TASK_TO_DOC[t.task_name];
    return docName ? allowedDocsSet.has(docName) : false;
  });

  const initialTasks = selectedInitialTasks.map((t, idx) => ({
    onboarding_request_id: data.id,
    task_name: t.task_name,
    description: t.description,
    category: t.category,
    priority: t.priority,
    sort_order: idx + 1,
    completed: false,
    due_date: addDays(startedAt, STAGE_DEFAULT_DUE_DAYS[CATEGORY_TO_STAGE[t.category]] ?? 7).toISOString().split("T")[0],
  }));
  if (initialTasks.length > 0) await supabase.from("onboarding_checklist_tasks").insert(initialTasks);

  return { data, error: null };
}
