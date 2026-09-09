import { supabase } from "@/lib/supabase";

export const DOC_TO_TASK: Record<string, string> = {
  "Offer Letter": "Sign Offer Letter & Employment Terms",
  "ID Verification": "Verify National ID / Passport & Proof of Address",
  "Employment Contract": "Sign Employment Contract & Agreements",
  "Bank Details Form": "Submit Bank Account & Tax Filing Details",
  "NDA Agreement": "Sign Non-Disclosure & Confidentiality Agreement",

  "Laptop Assignment": "Provision Laptop & Workstation Hardware",
  "Email Account Setup": "Create Corporate Email & Slack/Teams Account",
  "VPN Access Request": "Configure VPN & Secure Remote Access",
  "Software Licenses": "Grant Software & Internal Tool Licenses",
  "Security Badge": "Issue Security Access Badge & Keycards",

  "HR Orientation Checklist": "HR Orientation & Company Policies Walkthrough",
  "Team Introduction": "Team Introductions & Welcome Meeting",
  "Role Training Schedule": "Role-Specific Skills Training & Setup Plan",
  "Handbook Acknowledgment": "Review & Acknowledge Employee Handbook",

  "Onboarding Sign-off": "Final Onboarding Sign-off & Buddy Review",
  "30-Day Check-in Plan": "Schedule 30-Day Check-in & Feedback Review",
  "Feedback Survey": "Complete New Hire Experience Feedback Survey",
};

export const TASK_TO_DOC: Record<string, string> = {
  "Sign Offer Letter & Employment Terms": "Offer Letter",
  "Verify National ID / Passport & Proof of Address": "ID Verification",
  "Sign Employment Contract & Agreements": "Employment Contract",
  "Submit Bank Account & Tax Filing Details": "Bank Details Form",
  "Sign Non-Disclosure & Confidentiality Agreement": "NDA Agreement",

  "Provision Laptop & Workstation Hardware": "Laptop Assignment",
  "Create Corporate Email & Slack/Teams Account": "Email Account Setup",
  "Configure VPN & Secure Remote Access": "VPN Access Request",
  "Grant Software & Internal Tool Licenses": "Software Licenses",
  "Issue Security Access Badge & Keycards": "Security Badge",

  "HR Orientation & Company Policies Walkthrough": "HR Orientation Checklist",
  "Team Introductions & Welcome Meeting": "Team Introduction",
  "Role-Specific Skills Training & Setup Plan": "Role Training Schedule",
  "Review & Acknowledge Employee Handbook": "Handbook Acknowledgment",

  "Final Onboarding Sign-off & Buddy Review": "Onboarding Sign-off",
  "Schedule 30-Day Check-in & Feedback Review": "30-Day Check-in Plan",
  "Complete New Hire Experience Feedback Survey": "Feedback Survey",
};

export const ONBOARDING_DOCUMENT_TEMPLATES: Record<string, string[]> = {
  document: ["Offer Letter", "ID Verification", "Employment Contract", "Bank Details Form", "NDA Agreement"],
  it_setup: ["Laptop Assignment", "Email Account Setup", "VPN Access Request", "Software Licenses", "Security Badge"],
  training: ["HR Orientation Checklist", "Team Introduction", "Role Training Schedule", "Handbook Acknowledgment"],
  complete: ["Onboarding Sign-off", "30-Day Check-in Plan", "Feedback Survey"],
};

// How many days after the onboarding request is created each stage's items
// are due. Items not verified/completed by then read as "Overdue" in the
// checklist (computed live from due_date, not a stored status).
export const STAGE_DEFAULT_DUE_DAYS: Record<string, number> = {
  document: 3,
  it_setup: 7,
  training: 14,
  complete: 21,
};

// Task categories don't share the document stage keys 1:1, so map them here.
export const CATEGORY_TO_STAGE: Record<string, string> = {
  documents: "document",
  it_setup: "it_setup",
  training: "training",
  general: "complete",
};

const addDays = (from: Date, days: number) => new Date(from.getTime() + days * 24 * 60 * 60 * 1000);

export const ONBOARDING_DEFAULT_CHECKLIST_TASKS = [
  // 1. Documents (5 items)
  { task_name: "Sign Offer Letter & Employment Terms", category: "documents", priority: "high", description: "Review and collect signed formal employment offer letter." },
  { task_name: "Verify National ID / Passport & Proof of Address", category: "documents", priority: "high", description: "Collect identity documents for HR & compliance verification." },
  { task_name: "Sign Employment Contract & Agreements", category: "documents", priority: "high", description: "Execute formal employment contract and core agreement terms." },
  { task_name: "Submit Bank Account & Tax Filing Details", category: "documents", priority: "medium", description: "Set up payroll bank routing and relevant tax deduction forms." },
  { task_name: "Sign Non-Disclosure & Confidentiality Agreement", category: "documents", priority: "high", description: "Execute company NDA and data privacy acknowledgments." },

  // 2. IT & Equipment Setup (5 items)
  { task_name: "Provision Laptop & Workstation Hardware", category: "it_setup", priority: "high", description: "Configure primary computer, peripherals, and security tags." },
  { task_name: "Create Corporate Email & Slack/Teams Account", category: "it_setup", priority: "high", description: "Set up Google Workspace/Office 365, Slack/Teams, and 2FA." },
  { task_name: "Configure VPN & Secure Remote Access", category: "it_setup", priority: "medium", description: "Install network profiles, corporate VPN client, and certificates." },
  { task_name: "Grant Software & Internal Tool Licenses", category: "it_setup", priority: "medium", description: "Assign access to Jira, GitHub, Figma, ERP, or department tools." },
  { task_name: "Issue Security Access Badge & Keycards", category: "it_setup", priority: "medium", description: "Provide building access card, office security badge, and parking passes." },

  // 3. Training & Orientation (4 items)
  { task_name: "HR Orientation & Company Policies Walkthrough", category: "training", priority: "high", description: "Walkthrough company mission, structure, benefits, and conduct rules." },
  { task_name: "Team Introductions & Welcome Meeting", category: "training", priority: "medium", description: "Introduce new hire to team members, key stakeholders, and leaders." },
  { task_name: "Role-Specific Skills Training & Setup Plan", category: "training", priority: "high", description: "Execute initial department training roadmap and technical setup." },
  { task_name: "Review & Acknowledge Employee Handbook", category: "training", priority: "low", description: "Read handbook and complete acknowledgment sign-off." },

  // 4. Final Sign-off & Culture (3 items)
  { task_name: "Final Onboarding Sign-off & Buddy Review", category: "general", priority: "high", description: "Complete formal onboarding review and manager milestone sign-off." },
  { task_name: "Schedule 30-Day Check-in & Feedback Review", category: "general", priority: "medium", description: "Calendar manager 1-on-1 check-in milestone and probation roadmap." },
  { task_name: "Complete New Hire Experience Feedback Survey", category: "general", priority: "low", description: "Submit onboarding survey to improve orientation experience." },
];

/**
 * Creates an onboarding_requests row for an employee and seeds it with the
 * default document checklist and task checklist. Shared by the Onboarding
 * module's "Start Onboarding" flow and the Recruitment "Move to Onboarding"
 * action so both create identically-structured onboarding journeys.
 */
export async function startOnboardingForEmployee(employeeId: string, requestedBy: string) {
  // 1. Sync candidate master data to employee record if available
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

          await supabase
            .from("employees")
            .update({
              candidate_id: cand.id,
              candidate_code: emp.candidate_code || cand.candidate_code,
              location: emp.location || cand.location || null,
              education: emp.education || cand.education || null,
              work_experience: emp.work_experience || cand.work_experience || null,
              skills: (emp.skills && emp.skills.length > 0) ? emp.skills : (cand.skills || []),
              languages: (emp.languages && emp.languages.length > 0) ? emp.languages : (cand.languages || []),
              expected_salary: emp.expected_salary ?? cand.expected_salary ?? null,
              notice_period: emp.notice_period || cand.notice_period || null,
              resume_url: employeeResumeUrl,
              resume_name: employeeResumeName,
            })
            .eq("id", employeeId);
        }
      }
    }
  } catch (err) {
    console.error("Failed to auto-populate candidate credentials into employee record:", err);
  }

  // 2. Insert onboarding_requests (or reuse if already exists)
  const { data: existingReq } = await supabase
    .from("onboarding_requests")
    .select("*, employees(first_name, last_name, role, department, branch_id, branches(name), candidate_code, candidate_id, location, resume_url, resume_name)")
    .eq("employee_id", employeeId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingReq) {
    return { data: existingReq, error: null };
  }

  const { data, error } = await supabase
    .from("onboarding_requests")
    .insert({
      employee_id: employeeId,
      stage: "document",
      status: "pending",
      day_count: 0,
      requested_by: requestedBy,
    })
    .select()
    .single();

  if (error) return { data: null, error };

  await supabase.from("employees").update({ status: "onboarding" }).eq("id", employeeId);

  const startedAt = new Date(data.created_at);

  const initialDocs: any[] = [];

  // Add Candidate CV from recruitment into stage 1 documents
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

  Object.entries(ONBOARDING_DOCUMENT_TEMPLATES).forEach(([stageKey, templates]) => {
    const dueDate = addDays(startedAt, STAGE_DEFAULT_DUE_DAYS[stageKey] ?? 7).toISOString();
    templates.forEach((name) => {
      initialDocs.push({
        onboarding_request_id: data.id,
        employee_id: employeeId,
        document_name: name,
        stage: stageKey,
        status: "pending",
        file_url: null,
        file_name: null,
        notes: null,
        due_date: dueDate,
      });
    });
  });
  if (initialDocs.length > 0) {
    await supabase.from("onboarding_documents").insert(initialDocs);
  }

  const initialTasks = ONBOARDING_DEFAULT_CHECKLIST_TASKS.map((t, idx) => ({
    onboarding_request_id: data.id,
    task_name: t.task_name,
    description: t.description,
    category: t.category,
    priority: t.priority,
    sort_order: idx + 1,
    completed: false,
    due_date: addDays(startedAt, STAGE_DEFAULT_DUE_DAYS[CATEGORY_TO_STAGE[t.category]] ?? 7).toISOString().split("T")[0],
  }));
  await supabase.from("onboarding_checklist_tasks").insert(initialTasks);

  return { data, error: null };
}

/**
 * Fully converts a candidate from the Recruitment module into an employee
 * with all Candidate Master Database credentials and initiates their onboarding journey.
 */
export async function startOnboardingForCandidate(
  candidateId: string,
  requestedBy: string,
  branchId?: string,
  joinDate?: string
) {
  try {
    const { data: cand, error: candErr } = await supabase
      .from("candidates")
      .select("*, job_postings(id, title, department, branch_id)")
      .eq("id", candidateId)
      .single();

    if (candErr || !cand) {
      return { data: null, error: candErr || new Error("Candidate not found") };
    }

    const nameParts = (cand.full_name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || cand.full_name;
    const lastName = nameParts.slice(1).join(" ") || "-";
    const job = cand.job_postings;
    const effectiveBranchId = branchId || job?.branch_id || null;
    const effectiveJoinDate = joinDate || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

    const employeePayload = {
      first_name: firstName,
      last_name: lastName,
      email: cand.email,
      phone: cand.phone || null,
      role: job?.title || "New Hire",
      department: job?.department || "General",
      branch_id: effectiveBranchId,
      status: "onboarding",
      join_date: effectiveJoinDate,
      candidate_id: cand.id,
      candidate_code: cand.candidate_code || null,
      location: cand.location || null,
      education: cand.education || null,
      work_experience: cand.work_experience || null,
      skills: cand.skills || [],
      languages: cand.languages || [],
      expected_salary: cand.expected_salary ? Number(cand.expected_salary) : null,
      notice_period: cand.notice_period || null,
      resume_url: cand.resume_url || null,
      resume_name: cand.resume_name || null,
    };

    // Find or create employee by candidate_id or email
    let employeeId: string | null = null;
    if (cand.id) {
      const { data: empByCand } = await supabase
        .from("employees")
        .select("id")
        .eq("candidate_id", cand.id)
        .is("deleted_at", null)
        .maybeSingle();
      if (empByCand?.id) employeeId = empByCand.id;
    }
    if (!employeeId && cand.email) {
      const { data: empByEmail } = await supabase
        .from("employees")
        .select("id")
        .eq("email", cand.email)
        .is("deleted_at", null)
        .maybeSingle();
      if (empByEmail?.id) employeeId = empByEmail.id;
    }

    if (employeeId) {
      await supabase.from("employees").update(employeePayload).eq("id", employeeId);
    } else {
      const { data: newEmp, error: empErr } = await supabase
        .from("employees")
        .insert(employeePayload)
        .select("id")
        .single();
      if (empErr) return { data: null, error: empErr };
      employeeId = newEmp.id;
    }

    // Update candidate status & application outcome
    await supabase.from("candidates").update({ stage: "hired" }).eq("id", cand.id);
    if (cand.job_posting_id) {
      await supabase
        .from("candidate_applications")
        .update({ stage: "hired", outcome: "hired" })
        .eq("candidate_id", cand.id)
        .eq("job_posting_id", cand.job_posting_id);
    }

    // Start onboarding journey
    return await startOnboardingForEmployee(employeeId, requestedBy);
  } catch (err: any) {
    console.error("Failed in startOnboardingForCandidate:", err);
    return { data: null, error: err };
  }
}

