export const CATEGORY_META: Record<
  string,
  { label: string; icon: string; bg: string; text: string; border: string; stageKey: string }
> = {
  documents: { label: "Documents", icon: "ri-file-text-line", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", stageKey: "document" },
  it_setup: { label: "IT Setup", icon: "ri-computer-line", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", stageKey: "it_setup" },
  training: { label: "Training", icon: "ri-graduation-cap-line", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", stageKey: "training" },
  general: { label: "General & Culture", icon: "ri-checkbox-circle-line", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", stageKey: "complete" },
};

export const PRIORITY_META: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  high: { label: "High", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  medium: { label: "Medium", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  low: { label: "Low", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
};

export const STANDARD_TASK_TEMPLATES: Array<{
  task_name: string;
  category: "documents" | "it_setup" | "training" | "general";
  priority: "high" | "medium" | "low";
  description: string;
}> = [
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

export const STAGES_LIST = [
  { key: "document", category: "documents", label: "Document Collection", icon: "ri-file-text-line" },
  { key: "it_setup", category: "it_setup", label: "IT & Equipment Setup", icon: "ri-computer-line" },
  { key: "training", category: "training", label: "Training & Orientation", icon: "ri-graduation-cap-line" },
  { key: "complete", category: "general", label: "Final Sign-off", icon: "ri-checkbox-circle-line" },
];
