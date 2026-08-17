import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";

export interface ChecklistTask {
  id: string;
  onboarding_request_id: string;
  task_name: string;
  description: string | null;
  category: string;
  assigned_to: string | null;
  assigned_to_role: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  priority: "high" | "medium" | "low";
  sort_order: number;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  role?: string;
  avatar_url?: string | null;
}

export interface OnboardingHire {
  id: string;
  employee_id: string | null;
  stage: string;
  status: string;
  day_count: number;
  requested_by: string;
  created_at: string;
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    avatar_url: string | null;
    branches?: { name: string } | null;
  } | null;
}

export const CATEGORY_META: Record<string, { label: string; icon: string; bg: string; text: string; border: string; stageKey: string }> = {
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

export default function OnboardingChecklist() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetHireParam = searchParams.get("hire") || searchParams.get("request_id") || searchParams.get("highlight");

  const [currentEmployeeName, setCurrentEmployeeName] = useState<string>("");

  useEffect(() => {
    if (!user?.email) return;
    supabase
      .from("employees")
      .select("first_name, last_name, role")
      .eq("email", user.email)
      .maybeSingle()
      .then(({ data }) => {
        if (data && (data.first_name || data.last_name)) {
          setCurrentEmployeeName(`${data.first_name} ${data.last_name}`.trim());
        }
      });
  }, [user?.email]);

  const completerName =
    currentEmployeeName ||
    (user?.user_metadata?.display_name as string) ||
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.first_name && user?.user_metadata?.last_name
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
      : "") ||
    (user?.email ? user.email.split("@")[0] : "HR Manager");

  // Data States
  const [hires, setHires] = useState<OnboardingHire[]>([]);
  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedHire, setSelectedHire] = useState<OnboardingHire | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Controls
  const [hireSearch, setHireSearch] = useState("");
  const [hireStatusTab, setHireStatusTab] = useState<"all" | "in_progress" | "completed" | "pending">("all");
  const [taskSearch, setTaskSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending" | "overdue">("all");
  const [viewLayout, setViewLayout] = useState<"category" | "list" | "urgency">("category");

  // Modals & Action States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewingTask, setViewingTask] = useState<ChecklistTask | null>(null);
  const [hireAuditLogs, setHireAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ChecklistTask | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [populatingDefaults, setPopulatingDefaults] = useState(false);

  // Quick Add Form
  const [taskForm, setTaskForm] = useState<{
    task_name: string;
    description: string;
    category: "documents" | "it_setup" | "training" | "general";
    assigned_to: string;
    assigned_to_role: string;
    due_date: string;
    priority: "high" | "medium" | "low";
  }>({
    task_name: "",
    description: "",
    category: "documents",
    assigned_to: "",
    assigned_to_role: "",
    due_date: "",
    priority: "medium",
  });

  // Load All Required Data
  const loadData = async () => {
    try {
      const [{ data: hr }, { data: tk }, { data: st }] = await Promise.all([
        supabase
          .from("onboarding_requests")
          .select("*, employees(id, first_name, last_name, role, department, avatar_url, branches(name))")
          .order("created_at", { ascending: false }),
        supabase
          .from("onboarding_checklist_tasks")
          .select("*")
          .is("deleted_at", null)
          .order("sort_order", { ascending: true }),
        supabase
          .from("employees")
          .select("id, first_name, last_name, department, role, avatar_url")
          .eq("status", "active")
          .order("first_name"),
      ]);

      const formattedHires = (hr || []).map((h: any) => ({
        ...h,
        employees: h.employees
          ? {
              ...h.employees,
              branches: Array.isArray(h.employees.branches)
                ? h.employees.branches[0] || null
                : h.employees.branches || null,
            }
          : null,
      })) as OnboardingHire[];

      setHires(formattedHires);
      setTasks((tk || []) as ChecklistTask[]);
      setStaff((st || []) as StaffMember[]);

      // Handle candidate selection
      if (targetHireParam) {
        const found = formattedHires.find((h) => h.id === targetHireParam || h.employee_id === targetHireParam);
        if (found) {
          setSelectedHire(found);
        } else if (formattedHires.length > 0) {
          setSelectedHire(formattedHires[0]);
        }
      } else {
        setSelectedHire((prev) => {
          if (prev) {
            const updated = formattedHires.find((h) => h.id === prev.id);
            return updated || (formattedHires.length > 0 ? formattedHires[0] : null);
          }
          return formattedHires.length > 0 ? formattedHires[0] : null;
        });
      }
    } catch (err) {
      console.error("Failed to load onboarding checklist data:", err);
      toast("Error", "Failed to load checklist data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const ch = supabase
      .channel("onboarding-checklist-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "onboarding_checklist_tasks" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "onboarding_requests" }, () => loadData())
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  // Sync selected hire with URL parameter if updated
  useEffect(() => {
    if (!targetHireParam || hires.length === 0) return;
    const match = hires.find((h) => h.id === targetHireParam || h.employee_id === targetHireParam);
    if (match && selectedHire?.id !== match.id) {
      setSelectedHire(match);
    }
  }, [targetHireParam, hires]);

  const selectCandidate = (hire: OnboardingHire) => {
    setSelectedHire(hire);
    setSearchParams({ hire: hire.id });
  };

  // Helper selectors
  const getHireTasks = (hireId: string) => tasks.filter((t) => t.onboarding_request_id === hireId);

  const getProgress = (hireId: string) => {
    const t = getHireTasks(hireId);
    if (!t.length) return 0;
    return Math.round((t.filter((item) => item.completed).length / t.length) * 100);
  };

  const isOverdue = (task: ChecklistTask) => {
    if (task.completed || !task.due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.due_date + "T00:00:00");
    return due < today;
  };

  // Candidate filtering
  const filteredHires = useMemo(() => {
    return hires.filter((h) => {
      const name = h.employees ? `${h.employees.first_name} ${h.employees.last_name}`.toLowerCase() : "new hire";
      const role = (h.employees?.role || "").toLowerCase();
      const dept = (h.employees?.department || "").toLowerCase();
      const branch = (h.employees?.branches?.name || "").toLowerCase();
      const q = hireSearch.toLowerCase().trim();

      const matchesSearch = !q || name.includes(q) || role.includes(q) || dept.includes(q) || branch.includes(q);

      if (!matchesSearch) return false;

      if (hireStatusTab === "completed") return h.status === "completed";
      if (hireStatusTab === "pending") return h.status === "pending";
      if (hireStatusTab === "in_progress") return h.status === "approved" || h.status === "in_progress";
      return true;
    });
  }, [hires, hireSearch, hireStatusTab]);

  // Current hire's tasks & stats
  const hireTasks = useMemo(() => {
    return selectedHire ? getHireTasks(selectedHire.id) : [];
  }, [selectedHire, tasks]);

  const taskStats = useMemo(() => {
    const total = hireTasks.length;
    const completed = hireTasks.filter((t) => t.completed).length;
    const pending = hireTasks.filter((t) => !t.completed && !isOverdue(t)).length;
    const overdue = hireTasks.filter((t) => isOverdue(t)).length;
    const highPriority = hireTasks.filter((t) => !t.completed && t.priority === "high").length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, overdue, highPriority, pct };
  }, [hireTasks]);

  // Filtered task collection for active views
  const displayTasks = useMemo(() => {
    return hireTasks.filter((t) => {
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;

      if (filterStatus === "completed" && !t.completed) return false;
      if (filterStatus === "pending" && (t.completed || isOverdue(t))) return false;
      if (filterStatus === "overdue" && !isOverdue(t)) return false;

      if (taskSearch.trim()) {
        const q = taskSearch.toLowerCase();
        const matchesName = t.task_name.toLowerCase().includes(q);
        const matchesDesc = (t.description || "").toLowerCase().includes(q);
        const matchesAssignee = (t.assigned_to || "").toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesAssignee) return false;
      }
      return true;
    });
  }, [hireTasks, filterCategory, filterPriority, filterStatus, taskSearch]);

  const categoriesPresent = useMemo(() => {
    const base = ["documents", "it_setup", "training", "general"];
    const custom = [...new Set(hireTasks.map((t) => t.category))];
    return Array.from(new Set([...base, ...custom]));
  }, [hireTasks]);

const matchDocAndTask = (docName: string, taskName: string): boolean => {
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

  const STAGES_LIST = [
    { key: "document", category: "documents", label: "Document Collection", icon: "ri-file-text-line" },
    { key: "it_setup", category: "it_setup", label: "IT & Equipment Setup", icon: "ri-computer-line" },
    { key: "training", category: "training", label: "Training & Orientation", icon: "ri-graduation-cap-line" },
    { key: "complete", category: "general", label: "Final Sign-off", icon: "ri-checkbox-circle-line" },
  ];

  const currentStageIdx = useMemo(() => {
    if (!selectedHire) return 0;
    const idx = STAGES_LIST.findIndex((s) => s.key === selectedHire.stage);
    return idx === -1 ? 0 : idx;
  }, [selectedHire?.stage]);

  const getCategoryStageIdx = (category: string) => {
    const cat = (category || "").toLowerCase();
    if (cat === "documents" || cat.includes("doc")) return 0;
    if (cat === "it_setup" || cat.includes("it") || cat.includes("setup")) return 1;
    if (cat === "training" || cat.includes("train")) return 2;
    return 3;
  };

  const isCategoryLocked = (category: string) => {
    if (!selectedHire) return false;
    if (selectedHire.status === "pending") return true;
    if (selectedHire.status === "completed") return false;
    const catIdx = getCategoryStageIdx(category);
    return catIdx > currentStageIdx;
  };

  const isTaskLocked = (task: ChecklistTask) => {
    return isCategoryLocked(task.category);
  };

  const handleApproveHire = async () => {
    if (!selectedHire) return;
    const { error } = await supabase
      .from("onboarding_requests")
      .update({ status: "approved" })
      .eq("id", selectedHire.id);

    if (error) {
      toast("Approval Failed", "Could not approve onboarding request", "error");
    } else {
      setSelectedHire((prev) => (prev ? { ...prev, status: "approved" } : null));
      setHires((prev) => prev.map((h) => (h.id === selectedHire.id ? { ...h, status: "approved" } : h)));
      const hireName = getHireName(selectedHire);
      toast("Onboarding Approved", `${hireName} is approved! Step 1 (Document Collection) is now unlocked.`, "success");
      logActivity({
        module: "onboarding",
        action: "approved",
        entityType: "onboarding_request",
        entityId: selectedHire.id,
        actorName: completerName,
        actorRole: "HR",
        description: `Onboarding approved for ${hireName}`,
      });
      notify({
        source: "onboarding",
        type: "success",
        title: "Onboarding approved",
        message: `${hireName}'s onboarding request was approved.`,
        entityId: selectedHire.id,
      });
      loadData();
    }
  };

  // Actions
  const toggleTask = async (task: ChecklistTask) => {
    if (selectedHire?.status === "pending") {
      toast("Pending Approval", "Please click 'Approve Journey' before completing checklist tasks.", "info");
      return;
    }
    if (isTaskLocked(task)) {
      toast("Step Locked", "Please complete earlier steps and click 'Move On' first.", "info");
      return;
    }

    setToggling(task.id);
    const newCompleted = !task.completed;
    const now = new Date().toISOString();

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              completed: newCompleted,
              completed_at: newCompleted ? now : null,
              completed_by: newCompleted ? completerName : null,
            }
          : t
      )
    );

    const { error } = await supabase
      .from("onboarding_checklist_tasks")
      .update({
        completed: newCompleted,
        completed_at: newCompleted ? now : null,
        completed_by: newCompleted ? completerName : null,
      })
      .eq("id", task.id);

    setToggling(null);

    if (error) {
      toast("Error", "Failed to update task status", "error");
      loadData();
      return;
    }

    toast(
      newCompleted ? "Task Completed" : "Marked Pending",
      `"${task.task_name}" updated`,
      newCompleted ? "success" : "info"
    );

    // Bidirectional sync with onboarding_documents
    try {
      const { data: relatedDocs } = await supabase
        .from("onboarding_documents")
        .select("id, document_name")
        .eq("onboarding_request_id", task.onboarding_request_id);

      if (relatedDocs && relatedDocs.length > 0) {
        const matchingDocs = relatedDocs.filter((d) => matchDocAndTask(d.document_name, task.task_name));
        for (const d of matchingDocs) {
          await supabase
            .from("onboarding_documents")
            .update({
              status: newCompleted ? "complete" : "pending",
            })
            .eq("id", d.id);
        }
      }
    } catch (e) {
      console.error("Doc sync error:", e);
    }

    if (newCompleted && selectedHire) {
      logActivity({
        module: "onboarding",
        action: "updated",
        entityType: "checklist_task",
        entityId: task.id,
        actorName: completerName,
        actorRole: "HR",
        description: `Completed task "${task.task_name}" for ${getHireName(selectedHire)}`,
      });
    }
  };

  const handleQuickAssignToMe = async (task: ChecklistTask) => {
    const { error } = await supabase
      .from("onboarding_checklist_tasks")
      .update({
        assigned_to: completerName,
        assigned_to_role: "HR",
      })
      .eq("id", task.id);

    if (error) {
      toast("Error", "Failed to assign task", "error");
      return;
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, assigned_to: completerName, assigned_to_role: "HR" } : t))
    );
    toast("Assigned", `Assigned to ${completerName}`, "success");
  };

  const handlePopulateDefaultTasks = async () => {
    if (!selectedHire) return;
    setPopulatingDefaults(true);

    const existingNames = new Set(hireTasks.map((t) => t.task_name.toLowerCase().trim()));
    const toInsert = STANDARD_TASK_TEMPLATES.filter((tpl) => !existingNames.has(tpl.task_name.toLowerCase().trim())).map(
      (tpl, idx) => ({
        onboarding_request_id: selectedHire.id,
        task_name: tpl.task_name,
        description: tpl.description,
        category: tpl.category,
        priority: tpl.priority,
        sort_order: hireTasks.length + idx + 1,
        completed: false,
      })
    );

    if (toInsert.length === 0) {
      toast("Up to Date", "All standard checklist tasks already exist for this candidate", "info");
      setPopulatingDefaults(false);
      return;
    }

    const { error } = await supabase.from("onboarding_checklist_tasks").insert(toInsert);
    setPopulatingDefaults(false);

    if (error) {
      toast("Error", "Failed to load default checklist tasks", "error");
    } else {
      toast("Checklist Loaded", `Added ${toInsert.length} standard tasks`, "success");
      loadData();
    }
  };

  const handleMarkAllComplete = async (categoryKey?: string) => {
    if (!selectedHire) return;
    const targetTasks = hireTasks.filter((t) => (!categoryKey || t.category === categoryKey) && !t.completed);
    if (targetTasks.length === 0) {
      toast("Info", "No pending tasks to mark complete", "info");
      return;
    }

    if (!confirm(`Mark all ${targetTasks.length} pending task(s) as completed?`)) return;

    const ids = targetTasks.map((t) => t.id);
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("onboarding_checklist_tasks")
      .update({
        completed: true,
        completed_at: now,
        completed_by: completerName,
      })
      .in("id", ids);

    if (error) {
      toast("Error", "Failed to complete tasks", "error");
    } else {
      toast("Completed", `Marked ${targetTasks.length} tasks as completed`, "success");
      loadData();
    }
  };

  const handleAdvanceStage = async () => {
    if (!selectedHire) return;
    const stages = ["document", "it_setup", "training", "complete"];
    const currentIndex = stages.indexOf(selectedHire.stage);
    if (currentIndex === -1 || currentIndex >= stages.length - 1) {
      if (selectedHire.stage === "complete" && selectedHire.status !== "completed") {
        const { error } = await supabase
          .from("onboarding_requests")
          .update({ status: "completed", stage: "complete" })
          .eq("id", selectedHire.id);

        if (!error) {
          if (selectedHire.employee_id) {
            await supabase.from("employees").update({ status: "active" }).eq("id", selectedHire.employee_id);
          }
          setSelectedHire((prev) => (prev ? { ...prev, status: "completed", stage: "complete" } : null));
          setHires((prev) => prev.map((h) => (h.id === selectedHire.id ? { ...h, status: "completed", stage: "complete" } : h)));
          toast("Onboarding Completed", `${getHireName(selectedHire)} has completed all onboarding stages!`, "success");
          loadData();
        }
      } else {
        toast("Info", "Already at the final onboarding stage", "info");
      }
      return;
    }

    const nextStage = stages[currentIndex + 1];

    const { error } = await supabase
      .from("onboarding_requests")
      .update({
        stage: nextStage,
        status: "approved",
      })
      .eq("id", selectedHire.id);

    if (error) {
      toast("Error", "Failed to advance onboarding stage", "error");
    } else {
      setSelectedHire((prev) => (prev ? { ...prev, stage: nextStage, status: "approved" } : null));
      setHires((prev) => prev.map((h) => (h.id === selectedHire.id ? { ...h, stage: nextStage, status: "approved" } : h)));
      const nextMeta = STAGES_LIST.find((s) => s.key === nextStage);
      toast(
        "Stage Advanced",
        `Step ${currentIndex + 2} unlocked: ${nextMeta?.label || nextStage}`,
        "success"
      );
      loadData();
    }
  };

  const formatFullDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCompletedBy = (name?: string | null) => {
    if (!name) return "";
    if (name === "HR Manager" || name === "HR") {
      return completerName;
    }
    return name;
  };

  const openHireDetailsModal = async () => {
    if (!selectedHire) return;
    setShowDetailsModal(true);
    setLoadingAuditLogs(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_id", selectedHire.id)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setHireAuditLogs(data);
      }
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHire || !taskForm.task_name.trim()) return;

    setSubmitting(true);
    const maxOrder = Math.max(0, ...hireTasks.map((t) => t.sort_order || 0));

    const { error } = await supabase.from("onboarding_checklist_tasks").insert({
      onboarding_request_id: selectedHire.id,
      task_name: taskForm.task_name.trim(),
      description: taskForm.description.trim() || null,
      category: taskForm.category,
      assigned_to: taskForm.assigned_to.trim() || null,
      assigned_to_role: taskForm.assigned_to_role.trim() || null,
      due_date: taskForm.due_date || null,
      priority: taskForm.priority,
      sort_order: maxOrder + 1,
      completed: false,
    });

    setSubmitting(false);

    if (error) {
      toast("Error", "Failed to create task", "error");
    } else {
      toast("Task Created", `"${taskForm.task_name}" added to checklist`, "success");
      setShowAddModal(false);
      setTaskForm({
        task_name: "",
        description: "",
        category: "documents",
        assigned_to: "",
        assigned_to_role: "",
        due_date: "",
        priority: "medium",
      });
      loadData();
    }
  };

  const handleSaveEditTask = async () => {
    if (!selectedTask || !selectedTask.task_name.trim()) return;

    const { error } = await supabase
      .from("onboarding_checklist_tasks")
      .update({
        task_name: selectedTask.task_name.trim(),
        description: selectedTask.description || null,
        category: selectedTask.category,
        priority: selectedTask.priority,
        due_date: selectedTask.due_date || null,
        assigned_to: selectedTask.assigned_to || null,
        assigned_to_role: selectedTask.assigned_to_role || null,
      })
      .eq("id", selectedTask.id);

    if (error) {
      toast("Error", "Failed to update task", "error");
    } else {
      toast("Saved", "Task details updated", "success");
      setShowEditModal(false);
      setSelectedTask(null);
      loadData();
    }
  };

  const handleDeleteTask = async (task: ChecklistTask) => {
    if (!confirm(`Delete task "${task.task_name}"? It will be moved to the Recycle Bin.`)) return;

    const { error } = await supabase
      .from("onboarding_checklist_tasks")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: completerName,
      })
      .eq("id", task.id);

    if (error) {
      toast("Error", "Failed to delete task", "error");
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast("Moved to Recycle Bin", `"${task.task_name}" deleted`, "success");
      setShowEditModal(false);
      setSelectedTask(null);
    }
  };

  const copyProgressReport = () => {
    if (!selectedHire) return;
    const name = getHireName(selectedHire);
    const lines = [
      `📋 Onboarding Checklist Report — ${name}`,
      `Role: ${selectedHire.employees?.role || "N/A"} | Department: ${selectedHire.employees?.department || "N/A"} | Branch: ${selectedHire.employees?.branches?.name || "HQ"}`,
      `Stage: ${selectedHire.stage.toUpperCase()} | Day: ${selectedHire.day_count} | Status: ${selectedHire.status.toUpperCase()}`,
      `Overall Completion: ${taskStats.pct}% (${taskStats.completed}/${taskStats.total} Tasks Completed)\n`,
      `--- Tasks Summary ---`,
      ...hireTasks.map(
        (t) =>
          `[${t.completed ? "X" : " "}] (${CATEGORY_META[t.category]?.label || t.category}) ${t.task_name} - Priority: ${t.priority.toUpperCase()}${t.due_date ? ` | Due: ${t.due_date}` : ""}${t.assigned_to ? ` | Assigned: ${t.assigned_to}` : ""}`
      ),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    toast("Copied!", "Checklist progress report copied to clipboard", "success");
  };

  // Helper formatting
  const getHireName = (h: OnboardingHire) =>
    h.employees ? `${h.employees.first_name} ${h.employees.last_name}` : "New Hire";

  const getHireInitials = (h: OnboardingHire) => {
    if (!h.employees) return "NH";
    const f = h.employees.first_name ? h.employees.first_name[0] : "";
    const l = h.employees.last_name ? h.employees.last_name[0] : "";
    return (f + l).toUpperCase() || "NH";
  };

  const staffFullName = (s: StaffMember) => `${s.first_name} ${s.last_name}`;
  const staffDepartments = [...new Set(staff.map((s) => s.department).filter(Boolean))].sort();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* =========================================================================
          LEFT SIDEBAR: CANDIDATE DIRECTORY & REAL-TIME PROGRESS
      ========================================================================= */}
      <div
        className={`${
          selectedHire ? "hidden lg:flex" : "flex"
        } w-full lg:w-80 lg:shrink-0 border-r border-slate-200 bg-white flex-col overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
                <i className="ri-task-line text-[#253C7D]" />
                <span>Checklists</span>
              </h1>
              <p className="text-[11px] text-slate-500">Track task execution for new hires</p>
            </div>
            <Link
              to="/onboarding"
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Switch to Onboarding Pipeline Hub"
            >
              <i className="ri-layout-grid-line text-sm" />
            </Link>
          </div>

          {/* Candidate Search */}
          <div className="relative mb-2.5">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              value={hireSearch}
              onChange={(e) => setHireSearch(e.target.value)}
              placeholder="Search candidate, role, branch..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] focus:bg-white focus:outline-none focus:border-[#253C7D] transition-colors"
            />
            {hireSearch && (
              <button
                onClick={() => setHireSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <i className="ri-close-line text-xs" />
              </button>
            )}
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {(
              [
                { key: "all", label: "All" },
                { key: "in_progress", label: "Active" },
                { key: "pending", label: "Pending" },
                { key: "completed", label: "Done" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setHireStatusTab(tab.key)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  hireStatusTab === tab.key
                    ? "bg-[#253C7D] text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-[12px]">
              <i className="ri-loader-4-line animate-spin text-2xl mb-2 block" />
              Loading new hires...
            </div>
          ) : filteredHires.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <i className="ri-user-search-line text-3xl mb-2 block text-slate-300" />
              <p className="text-[13px] font-medium text-slate-600">No candidates found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Adjust filter or start a new onboarding</p>
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 bg-[#253C7D] text-white rounded-lg text-[11px] font-semibold hover:bg-[#1F336A]"
              >
                <i className="ri-add-line" /> Go to Onboarding Hub
              </Link>
            </div>
          ) : (
            filteredHires.map((hire) => {
              const prog = getProgress(hire.id);
              const hTasks = getHireTasks(hire.id);
              const doneCount = hTasks.filter((t) => t.completed).length;
              const hasOverdue = hTasks.some((t) => isOverdue(t));
              const isSelected = selectedHire?.id === hire.id;

              return (
                <button
                  key={hire.id}
                  onClick={() => selectCandidate(hire)}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-[#253C7D]/5 border-[#253C7D] shadow-xs"
                      : "bg-white hover:bg-slate-50/80 border-slate-200/80"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    {/* Avatar */}
                    {hire.employees?.avatar_url ? (
                      <img
                        src={hire.employees.avatar_url}
                        alt={getHireName(hire)}
                        className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-[#253C7D]/10 text-[#253C7D] font-bold text-[12px] flex items-center justify-center shrink-0">
                        {getHireInitials(hire)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[13px] font-bold text-slate-900 truncate">{getHireName(hire)}</p>
                        {hasOverdue && (
                          <span
                            className="w-2 h-2 rounded-full bg-red-500 shrink-0"
                            title="Has overdue checklist items"
                          />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {hire.employees?.role || "New Hire"} · {hire.employees?.department || "General"}
                      </p>
                    </div>
                  </div>

                  {/* Stage & Progress */}
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700 capitalize text-[10px] px-1.5 py-0.5 rounded bg-slate-100">
                        {hire.stage}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {hire.employees?.branches?.name || "HQ"}
                      </span>
                    </div>
                    <span className="font-bold text-[#253C7D] text-[11px]">{prog}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        prog === 100 ? "bg-emerald-500" : "bg-[#253C7D]"
                      }`}
                      style={{ width: `${prog}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>
                      {doneCount}/{hTasks.length} tasks completed
                    </span>
                    <span>Day {hire.day_count}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================================================
          MAIN CHECKLIST WORKSPACE
      ========================================================================= */}
      <div className={`${selectedHire ? "flex" : "hidden lg:flex"} flex-1 flex-col overflow-hidden bg-white`}>
        {selectedHire ? (
          <>
            {/* Top Candidate Navigation Banner */}
            <div className="p-5 border-b border-slate-200 bg-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left Profile Info */}
                <div className="flex items-center gap-3.5">
                  <button
                    onClick={() => setSelectedHire(null)}
                    className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <i className="ri-arrow-left-line text-lg" />
                  </button>

                  {selectedHire.employees?.avatar_url ? (
                    <img
                      src={selectedHire.employees.avatar_url}
                      alt={getHireName(selectedHire)}
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#253C7D]/10 text-[#253C7D] text-base font-bold flex items-center justify-center shrink-0">
                      {getHireInitials(selectedHire)}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-[17px] font-bold text-slate-900">{getHireName(selectedHire)}</h2>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          selectedHire.status === "completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : selectedHire.status === "approved"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {selectedHire.status}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Stage: <strong className="text-slate-800 capitalize">{selectedHire.stage}</strong>
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Day {selectedHire.day_count}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                      {selectedHire.employees?.role || "New Hire"} · {selectedHire.employees?.department || "Operations"} ·{" "}
                      {selectedHire.employees?.branches?.name || "Headquarters"}
                    </p>
                  </div>
                </div>

                {/* Right Quick Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={openHireDetailsModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[12px] font-medium transition-colors cursor-pointer shadow-2xs"
                    title="View onboarding approval details, timeline & assignments"
                  >
                    <i className="ri-information-line text-[#253C7D]" />
                    <span>View Details</span>
                  </button>

                  <Link
                    to={`/onboarding?highlight=${selectedHire.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[12px] font-medium transition-colors"
                    title="Jump to candidate in Onboarding Hub"
                  >
                    <i className="ri-external-link-line text-slate-400" />
                    <span>Open in Onboarding Hub</span>
                  </Link>

                  <button
                    onClick={copyProgressReport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[12px] font-medium transition-colors cursor-pointer"
                    title="Copy checklist markdown summary to clipboard"
                  >
                    <i className="ri-clipboard-line text-slate-400" />
                    <span>Copy Report</span>
                  </button>

                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#253C7D] hover:bg-[#1F336A] text-white text-[12px] font-semibold transition-colors shadow-xs cursor-pointer"
                  >
                    <i className="ri-add-line text-sm" />
                    <span>Add Task</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar & Key Metric Chips */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 max-w-md">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-slate-700">
                      Checklist Completion ({taskStats.completed} of {taskStats.total} done)
                    </span>
                    <span className="font-bold text-[#253C7D]">{taskStats.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        taskStats.pct === 100 ? "bg-emerald-500" : "bg-[#253C7D]"
                      }`}
                      style={{ width: `${taskStats.pct}%` }}
                    />
                  </div>
                </div>

                {/* Metric Counter Badges */}
                <div className="flex items-center gap-3 flex-wrap text-[11px]">
                  <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5">
                    <span>Total:</span>
                    <strong className="text-slate-900">{taskStats.total}</strong>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold flex items-center gap-1.5">
                    <span>Completed:</span>
                    <strong>{taskStats.completed}</strong>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-semibold flex items-center gap-1.5">
                    <span>Pending:</span>
                    <strong>{taskStats.pending}</strong>
                  </div>
                  {taskStats.overdue > 0 && (
                    <div className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 font-semibold flex items-center gap-1.5 animate-pulse">
                      <span>Overdue:</span>
                      <strong>{taskStats.overdue}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pending Approval Banner */}
            {selectedHire.status === "pending" && (
              <div className="mx-6 mt-4 p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-2xs">
                <div className="flex items-center gap-3 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 font-bold">
                    <i className="ri-time-line text-base" />
                  </div>
                  <div>
                    <p className="font-bold text-[13px] text-amber-950">Journey Pending Approval</p>
                    <p className="text-amber-800 text-[11px] mt-0.5">
                      Checklist tasks are in <strong>View-Only</strong> mode. You can review, start, and approve this candidate's journey directly in the <strong>Onboarding Hub</strong>.
                    </p>
                  </div>
                </div>
                <Link
                  to={`/onboarding?highlight=${selectedHire.id}`}
                  className="px-3.5 py-1.5 bg-[#253C7D] hover:bg-[#1F336A] text-white text-xs font-semibold rounded-lg shrink-0 transition-colors shadow-xs flex items-center justify-center gap-1.5 self-start sm:self-auto"
                >
                  <i className="ri-external-link-line" />
                  <span>Open in Onboarding Hub</span>
                </Link>
              </div>
            )}

            {/* 4-Stage Progression Stepper (Clean Read-Only Indicator) */}
            <div className="mx-6 mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="ri-git-commit-line text-[#253C7D]" />
                  <span>4-Stage Onboarding Progression</span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Active Stage: <strong className="text-slate-800 capitalize">{STAGES_LIST[currentStageIdx]?.label || selectedHire.stage}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {STAGES_LIST.map((stg, idx) => {
                  const isDone = (idx < currentStageIdx && selectedHire.status === "approved") || selectedHire.status === "completed";
                  const isCurrent = idx === currentStageIdx && selectedHire.status === "approved";
                  const isLocked = selectedHire.status === "pending" || (idx > currentStageIdx && selectedHire.status !== "completed");
                  const catTasks = hireTasks.filter((t) => t.category === stg.category);
                  const catDone = catTasks.filter((t) => t.completed).length;

                  return (
                    <div
                      key={stg.key}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                        isDone
                          ? "bg-green-50/80 border-green-200 text-green-800"
                          : isCurrent
                          ? "bg-[#253C7D]/10 border-[#253C7D]/30 text-[#253C7D] font-bold ring-1 ring-[#253C7D]/20 shadow-2xs"
                          : isLocked && selectedHire.status === "pending"
                          ? "bg-amber-50/40 border-amber-200/50 text-slate-500"
                          : "bg-white border-slate-200 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <i
                          className={
                            isDone
                              ? "ri-checkbox-circle-fill text-green-600 text-sm"
                              : isCurrent
                              ? "ri-play-circle-line text-[#253C7D] text-sm"
                              : "ri-lock-line text-slate-400 text-sm"
                          }
                        />
                        <span className="truncate">{stg.label}</span>
                      </div>
                      <span className="text-[10px] font-semibold opacity-75 shrink-0 ml-1">
                        {catDone}/{catTasks.length}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage Advance Banner if All Tasks in Category are Done */}
            {taskStats.total > 0 && taskStats.pct === 100 && selectedHire.status !== "completed" && (
              <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-emerald-900 text-[12px]">
                  <i className="ri-checkbox-circle-fill text-emerald-600 text-lg" />
                  <div>
                    <p className="font-bold">All checklist tasks completed for {getHireName(selectedHire)}!</p>
                    <p className="text-emerald-700 text-[11px]">
                      Ready to finalize or advance onboarding to the next milestone?
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAdvanceStage}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-semibold transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  Advance / Complete Stage
                </button>
              </div>
            )}

            {/* Productivity Filter & Search Toolbar */}
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
              {/* Search & Filters */}
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {/* Search in Tasks */}
                <div className="relative w-48 sm:w-60">
                  <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder="Filter tasks..."
                    className="w-full pl-7 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-[12px] focus:outline-none focus:border-[#253C7D]"
                  />
                  {taskSearch && (
                    <button
                      onClick={() => setTaskSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <i className="ri-close-line text-xs" />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                  {(
                    [
                      { key: "all", label: "All" },
                      { key: "pending", label: "Pending" },
                      { key: "completed", label: "Done" },
                      { key: "overdue", label: "Overdue" },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setFilterStatus(s.key)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        filterStatus === s.key ? "bg-[#253C7D] text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Category Filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-[#253C7D]"
                >
                  <option value="all">All Categories</option>
                  <option value="documents">Documents</option>
                  <option value="it_setup">IT Setup</option>
                  <option value="training">Training</option>
                  <option value="general">General & Culture</option>
                </select>

                {/* Priority Filter */}
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-[#253C7D]"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* View Layout Switcher & Bulk Helpers */}
              <div className="flex items-center gap-2">
                {hireTasks.length === 0 && (
                  <button
                    onClick={handlePopulateDefaultTasks}
                    disabled={populatingDefaults}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <i className="ri-magic-line text-xs" />
                    <span>{populatingDefaults ? "Loading..." : "Load Default Checklist"}</span>
                  </button>
                )}

                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewLayout("category")}
                    className={`p-1 px-2 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer ${
                      viewLayout === "category" ? "bg-[#253C7D] text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                    title="Category Grid View"
                  >
                    <i className="ri-layout-masonry-line text-xs" />
                    <span className="hidden sm:inline">Category</span>
                  </button>
                  <button
                    onClick={() => setViewLayout("list")}
                    className={`p-1 px-2 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer ${
                      viewLayout === "list" ? "bg-[#253C7D] text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                    title="Compact Table / List View"
                  >
                    <i className="ri-list-check text-xs" />
                    <span className="hidden sm:inline">List</span>
                  </button>
                  <button
                    onClick={() => setViewLayout("urgency")}
                    className={`p-1 px-2 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer ${
                      viewLayout === "urgency" ? "bg-[#253C7D] text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                    title="Urgency / Timeline View"
                  >
                    <i className="ri-alarm-warning-line text-xs" />
                    <span className="hidden sm:inline">Urgency</span>
                  </button>
                </div>
              </div>
            </div>

            {/* =================================================================
                TASKS DISPLAY CONTAINER
            ================================================================= */}
            <div className="flex-1 overflow-y-auto p-6">
              {hireTasks.length === 0 ? (
                /* Empty state for fresh candidate */
                <div className="max-w-md mx-auto my-12 text-center p-8 bg-slate-50 border border-slate-200 border-dashed rounded-2xl">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-2xl mb-3">
                    <i className="ri-task-line" />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-900">No Checklist Tasks Yet</h3>
                  <p className="text-[12px] text-slate-500 mt-1 mb-5">
                    Load the standard onboarding checklist template or add custom tasks specifically for this role.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handlePopulateDefaultTasks}
                      disabled={populatingDefaults}
                      className="px-4 py-2 bg-[#253C7D] hover:bg-[#1F336A] text-white rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <i className="ri-magic-line" />
                      <span>{populatingDefaults ? "Populating..." : "Load 15 Standard Tasks"}</span>
                    </button>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-700 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer"
                    >
                      Add Custom Task
                    </button>
                  </div>
                </div>
              ) : displayTasks.length === 0 ? (
                /* Filter result empty */
                <div className="text-center py-16 text-slate-400">
                  <i className="ri-filter-off-line text-4xl mb-2 block text-slate-300" />
                  <p className="text-[14px] font-medium text-slate-700">No tasks match your current filter</p>
                  <p className="text-[12px] text-slate-400 mt-0.5">Try clearing filters or search keywords</p>
                  <button
                    onClick={() => {
                      setFilterCategory("all");
                      setFilterPriority("all");
                      setFilterStatus("all");
                      setTaskSearch("");
                    }}
                    className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : viewLayout === "category" ? (
                /* CATEGORY GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categoriesPresent.map((catKey) => {
                    const meta = CATEGORY_META[catKey] || CATEGORY_META.general;
                    const catAllTasks = hireTasks.filter((t) => t.category === catKey);
                    const catFiltered = displayTasks.filter((t) => t.category === catKey);
                    if (filterCategory !== "all" && filterCategory !== catKey) return null;
                    if (catAllTasks.length === 0 && catFiltered.length === 0) return null;

                    const catDone = catAllTasks.filter((t) => t.completed).length;
                    const catPct = catAllTasks.length > 0 ? Math.round((catDone / catAllTasks.length) * 100) : 0;

                    return (
                      <div
                        key={catKey}
                        className={`border rounded-2xl overflow-hidden bg-white shadow-xs flex flex-col ${meta.border}`}
                      >
                        {/* Category Header */}
                        <div className={`px-4 py-3 border-b flex items-center justify-between ${meta.bg} ${meta.border}`}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <i className={`${meta.icon} text-base ${meta.text}`} />
                            <span className={`text-[13px] font-bold ${meta.text}`}>{meta.label}</span>
                            {isCategoryLocked(catKey) ? (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <i className="ri-lock-line text-[9px]" /> Locked (Step {getCategoryStageIdx(catKey) + 1})
                              </span>
                            ) : getCategoryStageIdx(catKey) === currentStageIdx && selectedHire?.status === "approved" ? (
                              <span className="text-[10px] font-bold text-[#253C7D] bg-[#253C7D]/10 px-2 py-0.5 rounded-full">
                                Active Step
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                ✓ Done
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold text-slate-600">
                              {catDone}/{catAllTasks.length} ({catPct}%)
                            </span>
                            <div className="w-16 h-1.5 bg-white/70 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  catPct === 100 ? "bg-emerald-500" : "bg-[#253C7D]"
                                }`}
                                style={{ width: `${catPct}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Category Tasks List */}
                        <div className="divide-y divide-slate-100 flex-1 bg-white">
                          {catFiltered.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-[12px] italic">
                              No matching tasks in this category
                            </div>
                          ) : (
                            catFiltered.map((task) => (
                              <TaskRowItem
                                key={task.id}
                                task={task}
                                toggling={toggling === task.id}
                                isLocked={isCategoryLocked(catKey)}
                                completerName={completerName}
                                onToggle={() => toggleTask(task)}
                                onView={() => setViewingTask(task)}
                                onEdit={() => {
                                  setSelectedTask({ ...task });
                                  setShowEditModal(true);
                                }}
                                onQuickAssign={() => handleQuickAssignToMe(task)}
                                onDelete={() => handleDeleteTask(task)}
                              />
                            ))
                          )}
                        </div>

                        {/* Category Footer Quick Add & Stats */}
                        <div className="p-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              setTaskForm((prev) => ({ ...prev, category: catKey as any }));
                              setShowAddModal(true);
                            }}
                            className="text-[11px] font-semibold text-slate-600 hover:text-[#253C7D] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <i className="ri-add-line" /> Add task to {meta.label}
                          </button>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {catDone}/{catAllTasks.length} Completed
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : viewLayout === "list" ? (
                /* COMPACT LIST / TABLE VIEW */
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="py-3 px-4 w-12 text-center">Status</th>
                        <th className="py-3 px-4">Task Name & Details</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4">Assigned To</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayTasks.map((task) => {
                        const overdue = isOverdue(task);
                        const pMeta = PRIORITY_META[task.priority] || PRIORITY_META.medium;
                        const cMeta = CATEGORY_META[task.category] || CATEGORY_META.general;

                        return (
                          <tr
                            key={task.id}
                            className={`hover:bg-slate-50/60 transition-colors ${
                              task.completed ? "bg-slate-50/30" : overdue ? "bg-red-50/20" : ""
                            }`}
                          >
                            {/* Checkbox Status Indicator */}
                            <td className="py-3 px-4 text-center">
                              {(() => {
                                const locked = isTaskLocked(task);
                                return (
                                  <span
                                    title={
                                      locked
                                        ? "Step Locked: Complete earlier steps in Onboarding Hub"
                                        : task.completed
                                        ? "Verified in Onboarding Hub"
                                        : "Pending verification in Onboarding Hub"
                                    }
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center mx-auto transition-all ${
                                      task.completed
                                        ? "bg-green-600 border-green-600 text-white shadow-2xs"
                                        : locked
                                        ? "bg-slate-100 border-slate-200 text-slate-300"
                                        : overdue
                                        ? "border-red-400 bg-white"
                                        : "border-slate-300 bg-white"
                                    }`}
                                  >
                                    {task.completed ? (
                                      <i className="ri-check-line text-white text-xs font-bold" />
                                    ) : locked ? (
                                      <i className="ri-lock-fill text-[10px] text-slate-300" />
                                    ) : null}
                                  </span>
                                );
                              })()}
                            </td>

                            {/* Title & Description */}
                            <td className="py-3 px-4">
                              <p
                                className={`font-semibold text-[13px] ${
                                  task.completed ? "line-through text-slate-400" : overdue ? "text-red-900" : "text-slate-900"
                                }`}
                              >
                                {task.task_name}
                              </p>
                              {task.description && (
                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                              )}
                              {task.completed && task.completed_by && (
                                <p className="text-[10px] text-emerald-600 mt-0.5 flex items-center gap-1">
                                  <i className="ri-check-double-line" />
                                  <span>Completed by {formatCompletedBy(task.completed_by)}</span>
                                </p>
                              )}
                            </td>

                            {/* Category */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cMeta.bg} ${cMeta.text}`}
                              >
                                <i className={cMeta.icon} />
                                <span>{cMeta.label}</span>
                              </span>
                            </td>

                            {/* Priority */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${pMeta.bg} ${pMeta.text}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${pMeta.dot}`} />
                                <span>{pMeta.label}</span>
                              </span>
                            </td>

                            {/* Due Date */}
                            <td className="py-3 px-4">
                              {task.due_date ? (
                                <span
                                  className={`inline-flex items-center gap-1 font-medium ${
                                    overdue ? "text-red-600 font-bold" : "text-slate-600"
                                  }`}
                                >
                                  <i className="ri-calendar-line text-xs" />
                                  <span>{task.due_date}</span>
                                  {overdue && <span className="text-[9px] uppercase px-1 rounded bg-red-100">Overdue</span>}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">No date</span>
                              )}
                            </td>

                            {/* Assignee */}
                            <td className="py-3 px-4">
                              {task.assigned_to ? (
                                <span className="text-slate-700 font-medium flex items-center gap-1">
                                  <i className="ri-user-line text-slate-400" />
                                  <span>{task.assigned_to}</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleQuickAssignToMe(task)}
                                  className="text-[11px] font-semibold text-[#253C7D] hover:underline flex items-center gap-0.5"
                                >
                                  <i className="ri-user-add-line text-xs" />
                                  <span>Assign me</span>
                                </button>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setViewingTask(task)}
                                  className="p-1 text-slate-400 hover:text-[#253C7D] hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                  title="View Task Details"
                                >
                                  <i className="ri-eye-line text-sm" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTask({ ...task });
                                    setShowEditModal(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-[#253C7D] hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                  title="Edit Task"
                                >
                                  <i className="ri-edit-line text-sm" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task)}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="Delete Task"
                                >
                                  <i className="ri-delete-bin-line text-sm" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* URGENCY / TIMELINE VIEW */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Column 1: Overdue & High Priority Pending */}
                  <div className="bg-red-50/40 border border-red-200 rounded-2xl p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-red-200">
                      <h4 className="text-[13px] font-bold text-red-900 flex items-center gap-1.5">
                        <i className="ri-alarm-warning-fill text-red-600" />
                        <span>Action Required ({displayTasks.filter((t) => !t.completed && (isOverdue(t) || t.priority === "high")).length})</span>
                      </h4>
                    </div>
                    <div className="space-y-2.5 flex-1">
                      {displayTasks
                        .filter((t) => !t.completed && (isOverdue(t) || t.priority === "high"))
                        .map((task) => (
                          <TaskCardItem
                            key={task.id}
                            task={task}
                            overdue={isOverdue(task)}
                            isLocked={isTaskLocked(task)}
                            onToggle={() => toggleTask(task)}
                            onView={() => setViewingTask(task)}
                            onEdit={() => {
                              setSelectedTask({ ...task });
                              setShowEditModal(true);
                            }}
                          />
                        ))}
                    </div>
                  </div>

                  {/* Column 2: In Progress / Medium-Low Pending */}
                  <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-200">
                      <h4 className="text-[13px] font-bold text-amber-900 flex items-center gap-1.5">
                        <i className="ri-time-line text-amber-600" />
                        <span>In Progress ({displayTasks.filter((t) => !t.completed && !isOverdue(t) && t.priority !== "high").length})</span>
                      </h4>
                    </div>
                    <div className="space-y-2.5 flex-1">
                      {displayTasks
                        .filter((t) => !t.completed && !isOverdue(t) && t.priority !== "high")
                        .map((task) => (
                          <TaskCardItem
                            key={task.id}
                            task={task}
                            overdue={false}
                            isLocked={isTaskLocked(task)}
                            onToggle={() => toggleTask(task)}
                            onView={() => setViewingTask(task)}
                            onEdit={() => {
                              setSelectedTask({ ...task });
                              setShowEditModal(true);
                            }}
                          />
                        ))}
                    </div>
                  </div>

                  {/* Column 3: Completed */}
                  <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-200">
                      <h4 className="text-[13px] font-bold text-emerald-900 flex items-center gap-1.5">
                        <i className="ri-checkbox-circle-fill text-emerald-600" />
                        <span>Completed ({displayTasks.filter((t) => t.completed).length})</span>
                      </h4>
                    </div>
                    <div className="space-y-2.5 flex-1">
                      {displayTasks
                        .filter((t) => t.completed)
                        .map((task) => (
                          <TaskCardItem
                            key={task.id}
                            task={task}
                            overdue={false}
                            isLocked={false}
                            onToggle={() => toggleTask(task)}
                            onView={() => setViewingTask(task)}
                            onEdit={() => {
                              setSelectedTask({ ...task });
                              setShowEditModal(true);
                            }}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* When no candidate is selected */
          <div className="flex-1 flex items-center justify-center text-slate-400 p-8">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-3xl mx-auto mb-3">
                <i className="ri-user-search-line" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-800">Select a Candidate</h3>
              <p className="text-[13px] text-slate-500 mt-1">
                Choose a new hire from the left sidebar to review and manage their onboarding checklist.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: ADD NEW CHECKLIST TASK WITH QUICK PRESET CHIPS
      ========================================================================= */}
      {showAddModal && selectedHire && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-6 border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">Add Checklist Task</h3>
                <p className="text-[11px] text-slate-500">For {getHireName(selectedHire)}</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              {/* Quick Template Preset Chips */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Sign NDA", category: "documents", priority: "high" },
                    { label: "Laptop Hardware", category: "it_setup", priority: "high" },
                    { label: "Email & Slack", category: "it_setup", priority: "high" },
                    { label: "HR Orientation", category: "training", priority: "high" },
                    { label: "Assign Buddy", category: "general", priority: "medium" },
                    { label: "30-Day Check-in", category: "general", priority: "medium" },
                  ].map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() =>
                        setTaskForm((prev) => ({
                          ...prev,
                          task_name: tpl.label,
                          category: tpl.category as any,
                          priority: tpl.priority as any,
                        }))
                      }
                      className="px-2 py-0.5 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                    >
                      + {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task Name */}
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  Task Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskForm.task_name}
                  onChange={(e) => setTaskForm({ ...taskForm, task_name: e.target.value })}
                  placeholder="e.g. Schedule IT Security Briefing"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Optional details, links, or instructions..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] resize-none"
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] bg-white cursor-pointer"
                  >
                    <option value="documents">Documents</option>
                    <option value="it_setup">IT Setup</option>
                    <option value="training">Training</option>
                    <option value="general">General & Culture</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] bg-white cursor-pointer"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Assignee & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">Assign To</label>
                  <AssigneeCombobox
                    value={taskForm.assigned_to}
                    roleValue={taskForm.assigned_to_role}
                    staff={staff}
                    completerName={completerName}
                    onChange={(name, dept) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        assigned_to: name,
                        assigned_to_role: dept || prev.assigned_to_role,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">Department Role</label>
                  <select
                    value={taskForm.assigned_to_role}
                    onChange={(e) => setTaskForm({ ...taskForm, assigned_to_role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] bg-white cursor-pointer"
                  >
                    <option value="">No Department</option>
                    {staffDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date & Quick Date Shortcuts */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12px] font-semibold text-slate-700">Due Date</label>
                  <div className="flex items-center gap-1">
                    {[
                      { label: "+1d", days: 1 },
                      { label: "+3d", days: 3 },
                      { label: "+1w", days: 7 },
                      { label: "+2w", days: 14 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + btn.days);
                          setTaskForm({ ...taskForm, due_date: d.toISOString().split("T")[0] });
                        }}
                        className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-medium"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1F336A] text-white rounded-lg text-[13px] font-semibold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Adding Task..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT CHECKLIST TASK
      ========================================================================= */}
      {showEditModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-6 border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-[15px] font-bold text-slate-900">Edit Checklist Task</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTask(null);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  Task Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={selectedTask.task_name}
                  onChange={(e) => setSelectedTask({ ...selectedTask, task_name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={selectedTask.description || ""}
                  onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={selectedTask.category}
                    onChange={(e) => setSelectedTask({ ...selectedTask, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] bg-white cursor-pointer"
                  >
                    <option value="documents">Documents</option>
                    <option value="it_setup">IT Setup</option>
                    <option value="training">Training</option>
                    <option value="general">General & Culture</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={selectedTask.priority}
                    onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] bg-white cursor-pointer"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">Assign To</label>
                  <AssigneeCombobox
                    value={selectedTask.assigned_to || ""}
                    roleValue={selectedTask.assigned_to_role || ""}
                    staff={staff}
                    completerName={completerName}
                    onChange={(name, dept) =>
                      setSelectedTask((prev) =>
                        prev
                          ? {
                              ...prev,
                              assigned_to: name || null,
                              assigned_to_role: dept || prev.assigned_to_role,
                            }
                          : null
                      )
                    }
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">Department Role</label>
                  <select
                    value={selectedTask.assigned_to_role || ""}
                    onChange={(e) => setSelectedTask({ ...selectedTask, assigned_to_role: e.target.value || null })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] bg-white cursor-pointer"
                  >
                    <option value="">No Department</option>
                    {staffDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={selectedTask.due_date || ""}
                  onChange={(e) => setSelectedTask({ ...selectedTask, due_date: e.target.value || null })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 pb-6 pt-2">
              <button
                type="button"
                onClick={() => handleDeleteTask(selectedTask)}
                className="px-3.5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-[13px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <i className="ri-delete-bin-line" />
                <span>Delete</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTask(null);
                }}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditTask}
                className="flex-1 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1F336A] text-white rounded-lg text-[13px] font-semibold transition-colors shadow-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          ONBOARDING DETAILS, APPROVAL & ASSIGNMENT MATRIX MODAL
      ================================================================= */}
      {showDetailsModal && selectedHire && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#253C7D] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {selectedHire.employees ? `${selectedHire.employees.first_name[0]}${selectedHire.employees.last_name[0]}` : "NH"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{getHireName(selectedHire)}</h3>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        selectedHire.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : selectedHire.status === "approved"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {selectedHire.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    {selectedHire.employees?.role || "New Hire"} · {selectedHire.employees?.department || "Operations"} ·{" "}
                    {selectedHire.employees?.branches?.name || "Headquarters"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Close modal"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Approval & Initiation Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Onboarding Approval Info */}
                <div
                  className={`p-4 rounded-xl border ${
                    selectedHire.status === "pending"
                      ? "bg-amber-50/60 border-amber-200 text-amber-900"
                      : "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <i
                        className={
                          selectedHire.status === "pending"
                            ? "ri-time-line text-amber-600 text-base"
                            : "ri-checkbox-circle-fill text-emerald-600 text-base"
                        }
                      />
                      <span>Onboarding Approval Status</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedHire.status === "pending"
                          ? "bg-amber-200/60 text-amber-800"
                          : "bg-emerald-200/60 text-emerald-800"
                      }`}
                    >
                      {selectedHire.status === "pending" ? "Pending Approval" : "Approved"}
                    </span>
                  </div>

                  {selectedHire.status === "pending" ? (
                    <div className="text-xs text-amber-800 space-y-1">
                      <p className="font-semibold">Awaiting HR Approval</p>
                      <p className="text-[11px] text-amber-700">
                        This onboarding journey has not been approved yet. Checklist verification is locked in View-Only mode until approved in the Onboarding Hub.
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs space-y-2">
                      {(() => {
                        const approvalLog = hireAuditLogs.find(
                          (l) => l.action === "approved" || l.description?.toLowerCase().includes("approved")
                        );
                        return (
                          <>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-500 block">Approved By:</span>
                                <strong className="text-slate-800 text-xs">
                                  {approvalLog?.actor_name || "HR Administrator"}
                                </strong>
                                {approvalLog?.actor_role && (
                                  <span className="text-[10px] text-slate-500 block">({approvalLog.actor_role})</span>
                                )}
                              </div>
                              <div>
                                <span className="text-slate-500 block">Approved Date & Time:</span>
                                <strong className="text-slate-800 text-xs">
                                  {formatFullDateTime(approvalLog?.created_at || selectedHire.created_at)}
                                </strong>
                              </div>
                            </div>
                            {approvalLog?.description && (
                              <p className="text-[11px] text-emerald-700 pt-1 border-t border-emerald-200/50">
                                {approvalLog.description}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Initiation & Request Info */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <i className="ri-user-add-line text-[#253C7D] text-base" />
                      <span>Initiation & Journey Details</span>
                    </span>
                    <span className="text-[10px] font-bold bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-full">
                      Day {selectedHire.day_count}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Requested / Added By:</span>
                      <strong className="text-slate-800 text-xs">
                        {selectedHire.requested_by || "HR Department"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Initiated Date & Time:</span>
                      <strong className="text-slate-800 text-xs">
                        {formatFullDateTime(selectedHire.created_at)}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Current Active Stage:</span>
                    <strong className="text-[#253C7D] font-bold capitalize">
                      {STAGES_LIST.find((s) => s.key === selectedHire.stage)?.label || selectedHire.stage}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Task Assignment Breakdown for this Candidate Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
                    <i className="ri-list-check text-[#253C7D]" />
                    <span>Assigned Checklist Tasks ({hireTasks.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    <strong>{taskStats.completed}</strong> of <strong>{taskStats.total}</strong> completed ({taskStats.pct}%)
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {hireTasks.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No tasks created for this candidate yet.
                      </div>
                    ) : (
                      hireTasks.map((task) => {
                        const cMeta = CATEGORY_META[task.category] || CATEGORY_META.general;
                        const pMeta = PRIORITY_META[task.priority] || PRIORITY_META.medium;
                        const locked = isTaskLocked(task);

                        return (
                          <div key={task.id} className="p-3 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-3 text-xs">
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <span
                                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                                  task.completed
                                    ? "bg-green-600 border-green-600 text-white shadow-2xs"
                                    : locked
                                    ? "bg-slate-100 border-slate-200 text-slate-300"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {task.completed ? (
                                  <i className="ri-check-line text-xs font-bold" />
                                ) : locked ? (
                                  <i className="ri-lock-fill text-[10px] text-slate-300" />
                                ) : null}
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`font-semibold ${task.completed ? "line-through text-slate-400" : "text-slate-900"}`}>
                                    {task.task_name}
                                  </span>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cMeta.bg} ${cMeta.text}`}>
                                    {cMeta.label}
                                  </span>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pMeta.bg} ${pMeta.text}`}>
                                    {pMeta.label}
                                  </span>
                                </div>
                                {task.description && (
                                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                                )}
                              </div>
                            </div>

                            {/* Assignee & Verification Details */}
                            <div className="text-right shrink-0 flex flex-col items-end gap-0.5 text-[11px]">
                              {task.assigned_to ? (
                                <span className="font-semibold text-slate-700 flex items-center gap-1">
                                  <i className="ri-user-line text-slate-400 text-[10px]" />
                                  <span>{task.assigned_to}</span>
                                  {task.assigned_to_role && (
                                    <span className="text-[10px] text-slate-400 font-normal">({task.assigned_to_role})</span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Unassigned</span>
                              )}

                              {task.completed ? (
                                <span className="text-green-600 font-medium text-[10px] flex items-center gap-1">
                                  <i className="ri-checkbox-circle-fill" />
                                  <span>Verified {task.completed_by ? `by ${formatCompletedBy(task.completed_by)}` : ""}</span>
                                  {task.completed_at && <span>· {formatFullDateTime(task.completed_at)}</span>}
                                </span>
                              ) : task.due_date ? (
                                <span className="text-slate-500 text-[10px]">Due: {task.due_date}</span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Audit Trail & Event Timeline */}
              <div>
                <h4 className="text-[13px] font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
                  <i className="ri-history-line text-[#253C7D]" />
                  <span>Activity History & Audit Logs</span>
                </h4>

                {loadingAuditLogs ? (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    <i className="ri-loader-4-line animate-spin text-lg inline-block mr-1" />
                    Loading activity timeline...
                  </div>
                ) : hireAuditLogs.length === 0 ? (
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-center text-slate-500 text-xs">
                    No specific audit log entries found for this journey yet. Standard initiation and status transitions apply.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white overflow-hidden max-h-48 overflow-y-auto">
                    {hireAuditLogs.map((log) => (
                      <div key={log.id} className="p-2.5 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.action === "approved"
                                ? "bg-green-100 text-green-700"
                                : log.action === "created"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="text-slate-800 font-medium truncate">{log.description || log.action}</span>
                          {log.actor_name && (
                            <span className="text-slate-400 text-[11px]">by {log.actor_name}</span>
                          )}
                        </div>
                        <span className="text-slate-400 text-[10px] shrink-0">
                          {formatFullDateTime(log.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <Link
                to={`/onboarding?highlight=${selectedHire.id}`}
                className="inline-flex items-center gap-1.5 text-xs text-[#253C7D] font-semibold hover:underline"
              >
                <i className="ri-external-link-line" />
                <span>Open in Onboarding Hub</span>
              </Link>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          SINGLE TASK VIEW DETAILS MODAL
      ================================================================= */}
      {viewingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    CATEGORY_META[viewingTask.category]?.bg || "bg-slate-100"
                  } ${CATEGORY_META[viewingTask.category]?.text || "text-slate-700"}`}
                >
                  <i className={`${CATEGORY_META[viewingTask.category]?.icon || "ri-task-line"} mr-1`} />
                  {CATEGORY_META[viewingTask.category]?.label || viewingTask.category}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    PRIORITY_META[viewingTask.priority]?.bg || "bg-slate-100"
                  } ${PRIORITY_META[viewingTask.priority]?.text || "text-slate-700"}`}
                >
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${
                      PRIORITY_META[viewingTask.priority]?.dot || "bg-slate-400"
                    }`}
                  />
                  {PRIORITY_META[viewingTask.priority]?.label || viewingTask.priority} Priority
                </span>
              </div>

              <button
                onClick={() => setViewingTask(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Close"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Task Title & Description */}
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {viewingTask.task_name}
                </h3>
                {viewingTask.description ? (
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {viewingTask.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-1.5">No additional description provided.</p>
                )}
              </div>

              {/* Status & Verification Box */}
              <div
                className={`p-3.5 rounded-xl border ${
                  viewingTask.completed
                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                    : "bg-amber-50/60 border-amber-200 text-amber-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <i
                      className={
                        viewingTask.completed
                          ? "ri-checkbox-circle-fill text-emerald-600 text-base"
                          : "ri-time-line text-amber-600 text-base"
                      }
                    />
                    <span>{viewingTask.completed ? "Task Completed & Verified" : "Pending Verification"}</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      viewingTask.completed ? "bg-emerald-200/60 text-emerald-800" : "bg-amber-200/60 text-amber-800"
                    }`}
                  >
                    {viewingTask.completed ? "Done" : "Pending"}
                  </span>
                </div>

                {viewingTask.completed && (
                  <div className="mt-2.5 pt-2 border-t border-emerald-200/50 text-[11px] space-y-1">
                    {viewingTask.completed_by && (
                      <p className="flex items-center gap-1.5">
                        <span className="text-slate-500">Verified by:</span>
                        <strong className="text-emerald-950">{formatCompletedBy(viewingTask.completed_by)}</strong>
                      </p>
                    )}
                    {viewingTask.completed_at && (
                      <p className="flex items-center gap-1.5">
                        <span className="text-slate-500">Completed on:</span>
                        <strong className="text-emerald-950">{formatFullDateTime(viewingTask.completed_at)}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Assignment & Due Date Details */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 text-[11px] block mb-0.5">Assigned Staff</span>
                  {viewingTask.assigned_to ? (
                    <div className="flex items-center gap-1.5">
                      <i className="ri-user-3-line text-slate-500" />
                      <div>
                        <strong className="text-slate-900 block truncate">{viewingTask.assigned_to}</strong>
                        {viewingTask.assigned_to_role && (
                          <span className="text-[10px] text-slate-500">{viewingTask.assigned_to_role}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Unassigned</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block mb-0.5">Due Date</span>
                  {viewingTask.due_date ? (
                    <div className="flex items-center gap-1.5">
                      <i className="ri-calendar-line text-slate-500" />
                      <strong className="text-slate-900">{viewingTask.due_date}</strong>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No deadline</span>
                  )}
                </div>
              </div>

              {/* Candidate Info Context */}
              {selectedHire && (
                <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                  <span>
                    Candidate: <strong className="text-slate-800">{getHireName(selectedHire)}</strong>
                  </span>
                  <span>
                    Stage:{" "}
                    <strong className="text-slate-800 capitalize">
                      {STAGES_LIST.find((s) => s.key === selectedHire.stage)?.label || selectedHire.stage}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
              <Link
                to={`/onboarding?highlight=${selectedHire?.id || ""}`}
                onClick={() => setViewingTask(null)}
                className="px-3.5 py-2 bg-[#253C7D] hover:bg-[#1e3066] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <i className="ri-external-link-line" />
                <span>Verify in Onboarding Hub</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const t = viewingTask;
                    setViewingTask(null);
                    setSelectedTask({ ...t });
                    setShowEditModal(true);
                  }}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <i className="ri-edit-line" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingTask(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// SUBCOMPONENTS: ASSIGNEE COMBOBOX, TASK ROW ITEM & TASK CARD ITEM
// =========================================================================

function AssigneeCombobox({
  value,
  roleValue,
  staff,
  completerName,
  onChange,
}: {
  value: string;
  roleValue?: string;
  staff: StaffMember[];
  completerName: string;
  onChange: (assignedTo: string, assignedToRole: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filteredStaff = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((s) => {
      const name = `${s.first_name} ${s.last_name}`.toLowerCase();
      const dept = (s.department || "").toLowerCase();
      const role = (s.role || "").toLowerCase();
      return name.includes(q) || dept.includes(q) || role.includes(q);
    });
  }, [staff, query]);

  const handleSelect = (name: string, dept: string) => {
    onChange(name, dept);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", "");
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
        className={`w-full relative flex items-center bg-white border rounded-xl transition-all cursor-text ${
          open ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <i className="ri-user-line absolute left-3 text-slate-400 text-sm pointer-events-none" />

        <input
          ref={inputRef}
          type="text"
          value={open ? query : value ? `${value}${roleValue ? ` (${roleValue})` : ""}` : ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlightIdx(0);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setHighlightIdx((prev) => Math.min(prev + 1, filteredStaff.length));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightIdx((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (highlightIdx === 0 && !query.trim()) {
                handleSelect(completerName, "HR");
              } else {
                const target = filteredStaff[highlightIdx > 0 ? highlightIdx - 1 : 0];
                if (target) {
                  handleSelect(`${target.first_name} ${target.last_name}`, target.department);
                } else if (query.trim()) {
                  handleSelect(query.trim(), roleValue || "Staff");
                }
              }
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={value ? `${value}${roleValue ? ` · ${roleValue}` : ""}` : "Search employee by name..."}
          className="w-full pl-9 pr-14 py-2 bg-transparent text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              title="Clear assignee"
            >
              <i className="ri-close-line text-sm" />
            </button>
          )}
          <i className={`ri-arrow-down-s-line text-slate-400 pointer-events-none transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Clean Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1 divide-y divide-slate-100">
          {/* Quick options */}
          <div className="p-1 space-y-0.5">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(completerName, "HR")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer text-[12px] ${
                value === completerName ? "bg-[#253C7D]/5 text-[#253C7D]" : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                  ME
                </span>
                <span className="font-semibold">{completerName}</span>
                <span className="text-[10px] text-slate-400">(Me)</span>
              </div>
              {value === completerName && <i className="ri-check-line font-bold" />}
            </button>

            {value && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect("", "")}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer text-[12px]"
              >
                <i className="ri-user-unfollow-line text-slate-400" />
                <span>Leave Unassigned</span>
              </button>
            )}
          </div>

          {/* Staff List */}
          <div className="p-1 space-y-0.5">
            {filteredStaff.length === 0 ? (
              <div className="px-3 py-3 text-center">
                <p className="text-[12px] text-slate-500">No staff found</p>
                {query.trim() && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(query.trim(), roleValue || "External")}
                    className="mt-1 px-2.5 py-1 bg-[#253C7D] text-white rounded text-[11px] font-semibold hover:bg-[#1F336A] cursor-pointer"
                  >
                    Use "{query.trim()}"
                  </button>
                )}
              </div>
            ) : (
              filteredStaff.map((s, idx) => {
                const fullName = `${s.first_name} ${s.last_name}`;
                const isSelected = value.toLowerCase() === fullName.toLowerCase();
                const isHighlighted = highlightIdx === idx + 1;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(fullName, s.department)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer text-[12px] ${
                      isSelected
                        ? "bg-[#253C7D]/5 text-[#253C7D] font-semibold"
                        : isHighlighted
                        ? "bg-slate-50"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {s.avatar_url ? (
                        <img src={s.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {s.first_name[0]}{s.last_name[0]}
                        </span>
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 block truncate">{fullName}</span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {s.department}{s.role ? ` · ${s.role}` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {s.department}
                      </span>
                      {isSelected && <i className="ri-check-line text-[#253C7D] font-bold" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRowItem({
  task,
  toggling,
  isLocked,
  completerName,
  onToggle,
  onView,
  onEdit,
  onQuickAssign,
  onDelete,
}: {
  task: ChecklistTask;
  toggling: boolean;
  isLocked?: boolean;
  completerName?: string;
  onToggle: () => void;
  onView: () => void;
  onEdit: () => void;
  onQuickAssign: () => void;
  onDelete: () => void;
}) {
  const isOverdue = (t: ChecklistTask) => {
    if (t.completed || !t.due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(t.due_date + "T00:00:00") < today;
  };

  const overdue = isOverdue(task);
  const pMeta = PRIORITY_META[task.priority] || PRIORITY_META.medium;

  const completedByName =
    task.completed_by === "HR Manager" || task.completed_by === "HR"
      ? completerName || "HR Manager"
      : task.completed_by;

  return (
    <div
      className={`px-4 py-3 flex items-start gap-3 hover:bg-slate-50/70 transition-colors group ${
        task.completed ? "bg-slate-50/30" : isLocked ? "bg-slate-50/40 opacity-80" : overdue ? "bg-red-50/20" : ""
      }`}
    >
      {/* Status Indicator */}
      <span
        title={
          isLocked
            ? "Step Locked: Complete earlier steps in Onboarding Hub"
            : task.completed
            ? "Verified in Onboarding Hub"
            : "Pending verification in Onboarding Hub"
        }
        className={`mt-0.5 w-5 h-5 shrink-0 rounded-md border flex items-center justify-center transition-all ${
          task.completed
            ? "bg-green-600 border-green-600 text-white shadow-2xs"
            : isLocked
            ? "bg-slate-100 border-slate-200 text-slate-300"
            : overdue
            ? "border-red-400 bg-white"
            : "border-slate-300 bg-white"
        }`}
      >
        {task.completed ? (
          <i className="ri-check-line text-white text-xs font-bold" />
        ) : isLocked ? (
          <i className="ri-lock-fill text-[10px] text-slate-300" />
        ) : null}
      </span>

      {/* Task Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[13px] font-semibold ${
              task.completed ? "line-through text-slate-400" : isLocked ? "text-slate-600" : overdue ? "text-red-900" : "text-slate-900"
            }`}
          >
            {task.task_name}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pMeta.bg} ${pMeta.text}`}>
            {pMeta.label}
          </span>
          {overdue && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              Overdue
            </span>
          )}
        </div>

        {task.description && (
          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
        )}

        {/* Metadata Pills */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[11px]">
          {task.assigned_to ? (
            <button
              onClick={onEdit}
              className="text-slate-600 hover:text-[#253C7D] flex items-center gap-1 transition-colors"
            >
              <i className="ri-user-line text-[11px]" />
              <span>{task.assigned_to}</span>
            </button>
          ) : (
            <button
              onClick={onQuickAssign}
              className="text-slate-400 hover:text-[#253C7D] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <i className="ri-user-add-line text-[11px]" />
              <span>+ Assign to me</span>
            </button>
          )}

          {task.due_date && (
            <span className={`flex items-center gap-1 ${overdue ? "text-red-600 font-semibold" : "text-slate-400"}`}>
              <i className="ri-calendar-line text-[11px]" />
              <span>{task.due_date}</span>
            </span>
          )}

          {task.completed && completedByName && (
            <span className="text-emerald-600 flex items-center gap-1 text-[10px] font-medium">
              <i className="ri-check-double-line" />
              <span>Done by {completedByName}</span>
            </span>
          )}
        </div>
      </div>

      {/* Hover Action Buttons */}
      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={onView}
          className="p-1 text-slate-400 hover:text-[#253C7D] hover:bg-slate-100 rounded transition-colors cursor-pointer"
          title="View Task Details"
        >
          <i className="ri-eye-line text-sm" />
        </button>
        <button
          onClick={onEdit}
          className="p-1 text-slate-400 hover:text-[#253C7D] hover:bg-slate-100 rounded transition-colors cursor-pointer"
          title="Edit Task"
        >
          <i className="ri-edit-line text-sm" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
          title="Delete Task"
        >
          <i className="ri-delete-bin-line text-sm" />
        </button>
      </div>
    </div>
  );
}

function TaskCardItem({
  task,
  overdue,
  isLocked,
  onToggle,
  onView,
  onEdit,
}: {
  task: ChecklistTask;
  overdue: boolean;
  isLocked?: boolean;
  onToggle: () => void;
  onView?: () => void;
  onEdit: () => void;
}) {
  const pMeta = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const cMeta = CATEGORY_META[task.category] || CATEGORY_META.general;

  return (
    <div
      onClick={onView || onEdit}
      className={`p-3 rounded-xl border bg-white shadow-2xs hover:shadow-xs transition-all cursor-pointer ${
        task.completed
          ? "border-emerald-100 bg-emerald-50/20"
          : isLocked
          ? "border-slate-200 bg-slate-50/40 opacity-85"
          : overdue
          ? "border-red-200 bg-red-50/30"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span
          title={
            isLocked
              ? "Step Locked: Complete earlier steps in Onboarding Hub"
              : task.completed
              ? "Verified in Onboarding Hub"
              : "Pending verification in Onboarding Hub"
          }
          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
            task.completed
              ? "bg-green-600 border-green-600 text-white shadow-2xs"
              : isLocked
              ? "bg-slate-100 border-slate-200 text-slate-300"
              : overdue
              ? "border-red-400 bg-white"
              : "border-slate-300 bg-white"
          }`}
        >
          {task.completed ? (
            <i className="ri-check-line text-white text-xs font-bold" />
          ) : isLocked ? (
            <i className="ri-lock-fill text-[10px] text-slate-300" />
          ) : null}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p
              className={`text-[12px] font-semibold ${
                task.completed ? "line-through text-slate-400" : isLocked ? "text-slate-600" : "text-slate-900"
              }`}
            >
              {task.task_name}
            </p>
            {onView && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                }}
                className="text-slate-400 hover:text-[#253C7D] p-0.5 rounded transition-colors"
                title="View Task Details"
              >
                <i className="ri-eye-line text-xs" />
              </button>
            )}
          </div>

          {task.description && (
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{task.description}</p>
          )}

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cMeta.bg} ${cMeta.text}`}>
              {cMeta.label}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pMeta.bg} ${pMeta.text}`}>
              {pMeta.label}
            </span>
            {task.due_date && (
              <span
                className={`text-[10px] flex items-center gap-0.5 ${
                  overdue ? "text-red-600 font-bold" : "text-slate-400"
                }`}
              >
                <i className="ri-calendar-line text-[10px]" />
                {task.due_date}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}