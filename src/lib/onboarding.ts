import { supabase } from "@/lib/supabase";

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
