import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { toast } from "@/components/Toast";
import {
  startOnboardingForEmployee,
  ONBOARDING_DOCUMENT_TEMPLATES as DOCUMENT_TEMPLATES,
  ONBOARDING_DEFAULT_CHECKLIST_TASKS as DEFAULT_CHECKLIST_TASKS,
  STAGE_DEFAULT_DUE_DAYS,
  CATEGORY_TO_STAGE,
} from "@/lib/onboarding";

interface OnboardingRequest {
  id: string;
  employee_id: string;
  branch_id?: string;
  stage: string;
  day_count: number;
  status: string;
  requested_by: string;
  created_at: string;
  employees?: {
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    branches?: { name: string } | null;
  } | null;
}

interface OnboardingDoc {
  id: string;
  onboarding_request_id: string;
  document_name: string;
  document_type?: string;
  stage: string;
  status: string;
  file_url: string | null;
  file_name: string | null;
  notes: string | null;
  due_date: string | null;
  uploaded_at?: string;
  created_at?: string;
}

interface StageConfig {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}

const STAGES: StageConfig[] = [
  {
    key: "document",
    label: "Document Collection",
    shortLabel: "Docs",
    description: "Offer letter, ID verification, contract & bank forms",
    icon: "ri-file-list-3-line",
  },
  {
    key: "it_setup",
    label: "IT & Equipment Setup",
    shortLabel: "IT Setup",
    description: "Laptop provisioning, corporate email & access",
    icon: "ri-macbook-line",
  },
  {
    key: "training",
    label: "Training & Orientation",
    shortLabel: "Training",
    description: "HR orientation, team intro & role roadmap",
    icon: "ri-presentation-line",
  },
  {
    key: "complete",
    label: "Final Sign-off",
    shortLabel: "Sign-off",
    description: "Probation roadmap, checklist sign-off & go-live",
    icon: "ri-checkbox-circle-line",
  },
];

export default function Onboarding() {
  const { user } = useAuth();
  const { role } = usePermissions();

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

  const actorName =
    currentEmployeeName ||
    (user?.user_metadata?.display_name as string) ||
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.first_name && user?.user_metadata?.last_name
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
      : "") ||
    (user?.email ? user.email.split("@")[0] : "Admin User");

  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [documents, setDocuments] = useState<OnboardingDoc[]>([]);
  const [employees, setEmployees] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    avatar_url?: string | null;
    branches?: { name: string } | null;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  // View & Filter States
  const [viewMode, setViewMode] = useState<"cards" | "kanban" | "table">("cards");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "progress" | "days">("newest");
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  // Modals
  const [showStartModal, setShowStartModal] = useState(false);
  const [startEmployeeId, setStartEmployeeId] = useState("");
  const [empSearch, setEmpSearch] = useState("");
  const [starting, setStarting] = useState(false);

  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OnboardingRequest | null>(null);
  const [selectedStage, setSelectedStage] = useState("");
  const [docForm, setDocForm] = useState({ document_name: "", notes: "", due_date: "" });
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  // Load Data
  const loadData = async () => {
    try {
      const [{ data: ob }, { data: docs }, { data: emps }] = await Promise.all([
        supabase
          .from("onboarding_requests")
          .select("*, employees(first_name, last_name, role, department, branch_id, branches(name))")
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
        supabase.from("onboarding_documents").select("*").is("deleted_at", null).order("created_at", { ascending: true }),
        supabase.from("employees").select("id, first_name, last_name, role, department, avatar_url, branches(name)").is("deleted_at", null).order("first_name"),
      ]);
      setRequests((ob as any) || []);
      setDocuments(docs || []);
      const formattedEmps = (emps || []).map((e: any) => ({
        ...e,
        branches: Array.isArray(e.branches) ? e.branches[0] || null : e.branches || null,
      }));
      setEmployees(formattedEmps);
    } catch (err) {
      console.error("Failed to load onboarding data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const ch = supabase
      .channel("onboarding-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "onboarding_requests" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "onboarding_documents" }, () => loadData())
      // Keep the Start Onboarding directory in sync when an employee is
      // created or updated in the Employees module.
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => loadData())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  // Handle URL highlight param
  useEffect(() => {
    if (!highlightId || requests.length === 0) return;
    if (!requests.some((r) => r.id === highlightId)) return;
    setStatusFilter("all");
    setStageFilter("all");
    setExpandedRequest(highlightId);
    const t = setTimeout(() => {
      const el = document.getElementById(`onboarding-request-${highlightId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    }, 150);
    return () => clearTimeout(t);
  }, [highlightId, requests]);

  // All employees who have already been added to onboarding (whether completed, approved, or pending)
  const onboardedEmployeeIds = useMemo(() => {
    return new Set(requests.map((r) => r.employee_id));
  }, [requests]);

  const eligibleEmployees = useMemo(() => {
    return employees.filter((e) => !onboardedEmployeeIds.has(e.id));
  }, [employees, onboardedEmployeeIds]);

  const filteredEligibleEmployees = useMemo(() => {
    if (!empSearch.trim()) return eligibleEmployees;
    const q = empSearch.toLowerCase();
    return eligibleEmployees.filter(
      (e) =>
        e.first_name.toLowerCase().includes(q) ||
        e.last_name.toLowerCase().includes(q) ||
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
        (e.role && e.role.toLowerCase().includes(q)) ||
        (e.department && e.department.toLowerCase().includes(q)) ||
        (e.branches?.name && e.branches.name.toLowerCase().includes(q))
    );
  }, [eligibleEmployees, empSearch]);

  const openStartOnboarding = () => {
    // Reload from the Employees directory each time the picker opens so it
    // never presents a stale, in-memory candidate list.
    loadData();
    setStartEmployeeId("");
    setEmpSearch("");
    setShowStartModal(true);
  };

  const selectedEmp = useMemo(() => {
    return employees.find((e) => e.id === startEmployeeId) || null;
  }, [employees, startEmployeeId]);

  // Helper document queries
  const getDocsForRequestAndStage = (reqId: string, stageKey: string) =>
    documents.filter((d) => d.onboarding_request_id === reqId && d.stage === stageKey);

  const getStageProgress = (reqId: string, stageKey: string) => {
    const docs = getDocsForRequestAndStage(reqId, stageKey);
    if (docs.length === 0) return 0;
    return Math.round((docs.filter((d) => d.status === "complete").length / docs.length) * 100);
  };

  const isStageComplete = (reqId: string, stageKey: string) => {
    const docs = getDocsForRequestAndStage(reqId, stageKey);
    return docs.length > 0 && docs.every((d) => d.status === "complete");
  };

  const isDocOverdue = (doc: OnboardingDoc) => {
    if (doc.status === "complete" || !doc.due_date) return false;
    return new Date(doc.due_date) < new Date();
  };

  const formatDateTimeLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const DEADLINE_PRESETS = [
    { label: "+1 day", days: 1 },
    { label: "+3 days", days: 3 },
    { label: "+1 week", days: 7 },
    { label: "+2 weeks", days: 14 },
    { label: "+1 month", days: 30 },
    { label: "+3 months", days: 90 },
  ];

  const bulkSetStageDeadline = async (req: OnboardingRequest, stageKey: string, days: number) => {
    const target = getDocsForRequestAndStage(req.id, stageKey).filter((d) => d.status !== "complete" && !d.due_date);
    if (target.length === 0) {
      toast("No Items to Update", "Every item in this step is already complete or has a due date.", "info");
      return;
    }
    const due = new Date();
    due.setDate(due.getDate() + days);
    const { error } = await supabase
      .from("onboarding_documents")
      .update({ due_date: due.toISOString() })
      .in("id", target.map((d) => d.id));
    if (error) {
      toast("Error", "Failed to set deadlines", "error");
    } else {
      const stageLabel = STAGES.find((s) => s.key === stageKey)?.label || stageKey;
      toast(
        "Deadline Set",
        `${target.length} item${target.length > 1 ? "s" : ""} in "${stageLabel}" due ${due.toLocaleDateString()}`,
        "success"
      );
      loadData();
    }
  };

  const getOverallProgress = (req: OnboardingRequest) => {
    if (req.status === "completed" || req.stage === "complete") return 100;
    const totalDocs = documents.filter((d) => d.onboarding_request_id === req.id);
    if (totalDocs.length === 0) {
      const idx = STAGES.findIndex((s) => s.key === req.stage);
      return Math.round(((idx) / (STAGES.length - 1)) * 100);
    }
    const completedDocs = totalDocs.filter((d) => d.status === "complete").length;
    return Math.round((completedDocs / totalDocs.length) * 100);
  };

  // Actions
  const handleStartOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startEmployeeId) return;

    // Check if employee already has an onboarding record in state
    const existing = requests.find((r) => r.employee_id === startEmployeeId);
    if (existing) {
      toast(
        "Already Onboarded",
        `This employee already has an onboarding record (${existing.status === "completed" ? "Completed" : existing.status}) and cannot be onboarded again.`,
        "error"
      );
      return;
    }

    setStarting(true);

    // Double-check with DB directly to prevent duplicate records
    const { data: dbCheck } = await supabase
      .from("onboarding_requests")
      .select("id, status")
      .eq("employee_id", startEmployeeId)
      .maybeSingle();

    if (dbCheck) {
      setStarting(false);
      toast(
        "Already Onboarded",
        "This employee already has an onboarding record in the database and cannot be added again.",
        "error"
      );
      return;
    }

    const { data, error } = await startOnboardingForEmployee(startEmployeeId, actorName);
    setStarting(false);

    if (error) {
      toast("Error", "Failed to start onboarding journey", "error");
      return;
    }

    const emp = employees.find((x) => x.id === startEmployeeId);
    const empName = emp ? `${emp.first_name} ${emp.last_name}` : "the employee";
    toast("Journey Started", `Onboarding started for ${empName}`, "success");

    logActivity({
      module: "onboarding",
      action: "created",
      entityType: "onboarding_request",
      entityId: data.id,
      actorName,
      actorRole: role?.name || "Unknown",
      description: `Onboarding started for ${empName}`,
    });

    notify({
      source: "onboarding",
      type: "info",
      title: "Onboarding started",
      message: `${empName}'s onboarding journey has begun.`,
      entityId: data.id,
    });

    setStartEmployeeId("");
    setShowStartModal(false);
    setEmpSearch("");
    loadData();
  };

  const handleDeleteRequest = async (req: OnboardingRequest) => {
    const empName = req.employees
      ? `${req.employees.first_name} ${req.employees.last_name}`
      : "this employee";
    if (
      !confirm(
        `Are you sure you want to remove the onboarding journey for ${empName}? This will delete this onboarding request and its documents.`
      )
    )
      return;

    try {
      const [{ error }, { error: taskErr }] = await Promise.all([
        supabase.from("onboarding_requests").update({
          deleted_at: new Date().toISOString(),
          deleted_by: actorName,
        }).eq("id", req.id),
        supabase.from("onboarding_checklist_tasks").update({
          deleted_at: new Date().toISOString(),
          deleted_by: actorName,
        }).eq("onboarding_request_id", req.id),
      ]);

      if (error || taskErr) {
        toast("Error", "Failed to delete onboarding record: " + (error?.message || taskErr?.message), "error");
      } else {
        toast("Record Deleted", `Onboarding record & checklist for ${empName} moved to Recycle Bin.`, "success");
        logActivity({
          module: "onboarding",
          action: "deleted",
          entityType: "onboarding_request",
          entityId: req.id,
          actorName,
          actorRole: role?.name || "Unknown",
          description: `Deleted onboarding journey and checklist for ${empName}`,
        });
        loadData();
      }
    } catch (err: any) {
      toast("Error", "Failed to delete onboarding record", "error");
    }
  };

  const handlePopulateDefaultChecklist = async (req: OnboardingRequest) => {
    const existing = documents.filter((d) => d.onboarding_request_id === req.id);
    const toInsert: any[] = [];
    const startedAt = new Date(req.created_at);

    Object.entries(DOCUMENT_TEMPLATES).forEach(([stageKey, templates]) => {
      const dueDate = new Date(startedAt.getTime() + (STAGE_DEFAULT_DUE_DAYS[stageKey] ?? 7) * 86400000).toISOString();
      templates.forEach((name) => {
        if (!existing.some((d) => d.stage === stageKey && d.document_name === name)) {
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

    if (toInsert.length === 0) {
      toast("Up to Date", "All standard checklist items are already present", "info");
      return;
    }

    const { error } = await supabase.from("onboarding_documents").insert(toInsert);

    // Also populate checklist tasks if empty
    const { data: existingTasks } = await supabase
      .from("onboarding_checklist_tasks")
      .select("id")
      .eq("onboarding_request_id", req.id)
      .is("deleted_at", null);

    if (!existingTasks || existingTasks.length === 0) {
      const initialTasks = DEFAULT_CHECKLIST_TASKS.map((t, idx) => ({
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
      await supabase.from("onboarding_checklist_tasks").insert(initialTasks);
    }

    if (error) {
      toast("Error", "Failed to populate checklist items", "error");
    } else {
      toast("Checklist Loaded", `Added ${toInsert.length} standard checklist items & task assignments`, "success");
      loadData();
    }
  };

  const handleApprove = async (req: OnboardingRequest) => {
    const { error } = await supabase.from("onboarding_requests").update({ status: "approved" }).eq("id", req.id);
    if (error) {
      toast("Approval Failed", "Could not approve onboarding request", "error");
    } else {
      setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, status: "approved" } : r)));
      setExpandedRequest(req.id);
      const empName = req.employees ? `${req.employees.first_name} ${req.employees.last_name}` : "new hire";
      toast("Onboarding Approved", `${empName} approved! Step 1 (Document Collection) is now unlocked.`, "success");
      logActivity({
        module: "onboarding",
        action: "approved",
        entityType: "onboarding_request",
        entityId: req.id,
        actorName,
        actorRole: role?.name || "Unknown",
        description: `Onboarding approved for ${empName}`,
      });
      notify({
        source: "onboarding",
        type: "success",
        title: "Onboarding approved",
        message: `${empName}'s onboarding request was approved.`,
        entityId: req.id,
      });
    }
  };

  const advanceStage = async (req: OnboardingRequest) => {
    const currentIndex = STAGES.findIndex((s) => s.key === req.stage);
    const nextStage = STAGES[currentIndex + 1]?.key || "complete";
    const { error } = await supabase.from("onboarding_requests").update({ stage: nextStage }).eq("id", req.id);
    if (error) {
      toast("Failed", "Failed to advance stage", "error");
    } else {
      setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, stage: nextStage } : r)));
      const targetLabel = STAGES.find((s) => s.key === nextStage)?.label || "Complete";
      toast("Stage Advanced", `Moved to ${targetLabel}`, "success");
    }
  };

  const completeOnboarding = async (req: OnboardingRequest) => {
    const { error } = await supabase
      .from("onboarding_requests")
      .update({ status: "completed", stage: "complete" })
      .eq("id", req.id);

    if (error) {
      toast("Error", "Failed to complete onboarding", "error");
    } else {
      await supabase.from("employees").update({ status: "active" }).eq("id", req.employee_id);
      setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, status: "completed", stage: "complete" } : r)));
      const empName = req.employees ? `${req.employees.first_name} ${req.employees.last_name}` : "new hire";
      toast("Onboarding Completed", `${empName} has graduated and status is active!`, "success");
      logActivity({
        module: "onboarding",
        action: "processed",
        entityType: "onboarding_request",
        entityId: req.id,
        actorName,
        actorRole: role?.name || "Unknown",
        description: `Onboarding completed for ${empName}`,
      });
      notify({
        source: "onboarding",
        type: "success",
        title: "Onboarding completed",
        message: `${empName} has finished the onboarding process.`,
        entityId: req.id,
      });
    }
  };

  // Doc modal handlers
  const openDocModal = (req: OnboardingRequest, stage: string) => {
    setSelectedRequest(req);
    setSelectedStage(stage);
    const defaultDue = new Date(
      new Date(req.created_at).getTime() + (STAGE_DEFAULT_DUE_DAYS[stage] ?? 7) * 86400000
    );
    setDocForm({ document_name: "", notes: "", due_date: formatDateTimeLocal(defaultDue) });
    setSelectedFileName(null);
    setEditingDocId(null);
    setShowDocModal(true);
  };

  const openEditDocModal = (req: OnboardingRequest, doc: OnboardingDoc) => {
    setSelectedRequest(req);
    setSelectedStage(doc.stage);
    setDocForm({
      document_name: doc.document_name,
      notes: doc.notes || "",
      due_date: doc.due_date ? doc.due_date.slice(0, 16) : "",
    });
    setSelectedFileName(doc.file_name);
    setEditingDocId(doc.id);
    setShowDocModal(true);
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !selectedStage || !docForm.document_name.trim()) return;

    setUploading(true);
    const file = fileInputRef.current?.files?.[0];
    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (file) {
      try {
        fileUrl = await uploadFile("onboarding-documents", `${selectedRequest.id}/${Date.now()}_${file.name}`, file);
        fileName = file.name;
      } catch (err) {
        toast("Upload Error", err instanceof Error ? err.message : "File upload failed", "error");
        setUploading(false);
        return;
      }
    }

    const { error } = editingDocId
      ? await supabase
          .from("onboarding_documents")
          .update({
            document_name: docForm.document_name.trim(),
            notes: docForm.notes.trim() || null,
            due_date: docForm.due_date ? new Date(docForm.due_date).toISOString() : null,
            ...(file ? { file_url: fileUrl, file_name: fileName, status: "complete" } : {}),
          })
          .eq("id", editingDocId)
      : await supabase.from("onboarding_documents").insert({
          onboarding_request_id: selectedRequest.id,
          employee_id: selectedRequest.employee_id,
          document_name: docForm.document_name.trim(),
          stage: selectedStage,
          status: fileUrl ? "complete" : "pending",
          file_url: fileUrl,
          file_name: fileName,
          notes: docForm.notes.trim() || null,
          due_date: docForm.due_date ? new Date(docForm.due_date).toISOString() : null,
        });

    setUploading(false);
    setShowDocModal(false);

    if (error) {
      toast("Error", editingDocId ? "Failed to save document" : "Failed to add checklist item", "error");
    } else {
      toast("Saved", editingDocId ? "Document updated" : "Document added to checklist", "success");
      setDocForm({ document_name: "", notes: "", due_date: "" });
      setSelectedFileName(null);
      setEditingDocId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadData();
    }
  };

  const quickAddPresetDoc = async (req: OnboardingRequest, stageKey: string, docName: string) => {
    const dueDate = new Date(
      new Date(req.created_at).getTime() + (STAGE_DEFAULT_DUE_DAYS[stageKey] ?? 7) * 86400000
    ).toISOString();
    const { error } = await supabase.from("onboarding_documents").insert({
      onboarding_request_id: req.id,
      employee_id: req.employee_id,
      document_name: docName,
      stage: stageKey,
      status: "pending",
      file_url: null,
      file_name: null,
      notes: null,
      due_date: dueDate,
    });
    if (error) {
      toast("Error", "Could not add item", "error");
    } else {
      toast("Added", `Added "${docName}" to ${STAGES.find((s) => s.key === stageKey)?.label}`, "success");
      loadData();
    }
  };

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

  const toggleDocStatus = async (doc: OnboardingDoc, req?: OnboardingRequest) => {
    if (req) {
      if (req.status === "pending") {
        toast("Pending Approval", "Please click 'Approve Journey' before verifying checklist items.", "info");
        return;
      }
      const currentStageIdx = STAGES.findIndex((s) => s.key === req.stage);
      const docStageIdx = STAGES.findIndex((s) => s.key === doc.stage);
      if (docStageIdx > currentStageIdx && req.status !== "completed") {
        toast("Step Locked", "Please complete earlier steps and click 'Move On' first.", "info");
        return;
      }
    }
    const newStatus = doc.status === "complete" ? "pending" : "complete";
    const isCompleted = newStatus === "complete";
    const now = new Date().toISOString();

    const { error } = await supabase.from("onboarding_documents").update({ status: newStatus }).eq("id", doc.id);
    if (error) {
      toast("Status Update Failed", "Could not update document status", "error");
    } else {
      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: newStatus } : d)));
      toast("Status Updated", `Item marked as ${newStatus === "complete" ? "verified" : "pending"}`, "info");

      // Bidirectional sync with onboarding_checklist_tasks
      try {
        const { data: relatedTasks } = await supabase
          .from("onboarding_checklist_tasks")
          .select("id, task_name")
          .eq("onboarding_request_id", doc.onboarding_request_id)
          .is("deleted_at", null);

        if (relatedTasks && relatedTasks.length > 0) {
          const matchingTasks = relatedTasks.filter((t) => matchDocAndTask(doc.document_name, t.task_name));
          for (const t of matchingTasks) {
            await supabase
              .from("onboarding_checklist_tasks")
              .update({
                completed: isCompleted,
                completed_at: isCompleted ? now : null,
                completed_by: isCompleted ? actorName : null,
              })
              .eq("id", t.id);
          }
        }
      } catch (e) {
        console.error("Task sync error:", e);
      }
    }
  };

  const deleteDocument = async (doc: OnboardingDoc) => {
    if (!confirm(`Move "${doc.document_name}" to the Recycle Bin? It can be restored later.`)) return;
    const { error } = await supabase
      .from("onboarding_documents")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", doc.id);
    if (error) {
      toast("Error", "Failed to move item to the Recycle Bin", "error");
    } else {
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast("Moved to Recycle Bin", `Document "${doc.document_name}" can be restored later`, "success");
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const inProgress = requests.filter((r) => r.status === "approved" && r.stage !== "complete").length;
    const completed = requests.filter((r) => r.status === "completed").length;

    return { total, pending, approved, inProgress, completed };
  }, [requests]);

  // Filter and sort requests
  const filteredRequests = useMemo(() => {
    let list = requests.filter((req) => {
      // Status filter
      if (statusFilter !== "all" && req.status !== statusFilter) {
        return false;
      }

      // Stage filter
      if (stageFilter !== "all" && req.stage !== stageFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = `${req.employees?.first_name || ""} ${req.employees?.last_name || ""}`.toLowerCase();
        const roleStr = (req.employees?.role || "").toLowerCase();
        const dept = (req.employees?.department || "").toLowerCase();
        const branch = (req.employees?.branches?.name || "").toLowerCase();
        const reqBy = (req.requested_by || "").toLowerCase();
        if (!name.includes(q) && !roleStr.includes(q) && !dept.includes(q) && !branch.includes(q) && !reqBy.includes(q)) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "name") {
        const nameA = `${a.employees?.first_name || ""} ${a.employees?.last_name || ""}`;
        const nameB = `${b.employees?.first_name || ""} ${b.employees?.last_name || ""}`;
        return nameA.localeCompare(nameB);
      }
      if (sortBy === "progress") {
        return getOverallProgress(b) - getOverallProgress(a);
      }
      if (sortBy === "days") {
        return (b.day_count || 0) - (a.day_count || 0);
      }
      // default newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [requests, documents, statusFilter, stageFilter, searchQuery, sortBy]);

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Employee Onboarding</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Track and manage new hire onboarding across all branches with stage-based checklist
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openStartOnboarding}
            className="inline-flex items-center gap-2 bg-[#253C7D] text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-user-add-line" />
            Start Onboarding
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { key: "pending", label: "Pending", count: stats.pending, color: "bg-amber-50 text-amber-700" },
          { key: "approved", label: "Approved", count: stats.approved, color: "bg-blue-50 text-blue-700" },
          { key: "all", label: "In Progress", count: stats.inProgress, color: "bg-[#253C7D]/10 text-[#253C7D]" },
          { key: "completed", label: "Completed", count: stats.completed, color: "bg-green-50 text-green-700" },
          { key: "all", label: "Total", count: stats.total, color: "bg-gray-50 text-gray-700" },
        ].map((s) => (
          <div
            key={s.label}
            onClick={() => s.key !== "all" && setStatusFilter(s.key)}
            className={`rounded-xl p-4 transition-all cursor-pointer ${s.color} ${
              statusFilter === s.key ? "ring-2 ring-[#253C7D]" : "hover:opacity-90"
            }`}
          >
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-[12px] font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by name, role, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#253C7D]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-sm" />
              </button>
            )}
          </div>

          {/* Status Pills */}
          <div className="flex flex-wrap gap-1.5">
            {["all", "pending", "approved", "completed"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium capitalize transition-colors cursor-pointer ${
                  statusFilter === f ? "bg-[#253C7D] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f}
                {f !== "all" && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                    {requests.filter((r) => r.status === f).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* View Switcher & Stage Filter */}
        <div className="flex items-center gap-2">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
          >
            <option value="all">All Stages</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode("cards")}
              title="Cards View"
              className={`p-1.5 rounded-md text-[12px] font-semibold flex items-center gap-1 transition-all ${
                viewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-layout-masonry-line" />
              <span className="hidden md:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              title="Pipeline View"
              className={`p-1.5 rounded-md text-[12px] font-semibold flex items-center gap-1 transition-all ${
                viewMode === "kanban" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-kanban-view" />
              <span className="hidden md:inline">Pipeline</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`p-1.5 rounded-md text-[12px] font-semibold flex items-center gap-1 transition-all ${
                viewMode === "table" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-table-line" />
              <span className="hidden md:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-6 bg-gray-50 animate-pulse h-32" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-gray-100 rounded-xl">
          <i className="ri-user-add-line text-4xl mb-3 block" />
          <p className="text-[13px]">No {statusFilter !== "all" ? statusFilter : ""} onboarding requests</p>
        </div>
      ) : viewMode === "cards" ? (
        /* ==================== HIGH PRODUCTIVITY 4-STAGE CARDS VIEW ==================== */
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const isExpanded = expandedRequest === req.id;
            const overallProgress = getOverallProgress(req);
            const reqDocs = documents.filter((d) => d.onboarding_request_id === req.id);
            const currentStageIdx = STAGES.findIndex((s) => s.key === req.stage);

            return (
              <div
                key={req.id}
                id={`onboarding-request-${req.id}`}
                tabIndex={-1}
                className={`border rounded-xl overflow-hidden hover:shadow-xs transition-shadow outline-none ${
                  req.id === highlightId ? "border-[#253C7D] ring-2 ring-[#253C7D]/30" : "border-gray-200"
                }`}
              >
                {/* Header Row */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] font-bold text-sm">
                      {req.employees?.first_name?.[0]}
                      {req.employees?.last_name?.[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold text-gray-900">
                          {req.employees?.first_name} {req.employees?.last_name}
                        </p>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                            req.status === "pending"
                              ? "bg-amber-50 text-amber-700"
                              : req.status === "approved"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {req.status}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                          Day {req.day_count}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        {req.employees?.role || "New Hire"} — {req.employees?.branches?.name || "Headquarters"}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Stepper Toggle */}
                  <div className="flex items-center gap-2.5">
                    {req.status === "pending" && (
                      <button
                        onClick={() => handleApprove(req)}
                        className="px-3.5 py-1.5 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors cursor-pointer"
                      >
                        Approve Journey
                      </button>
                    )}

                    {reqDocs.length === 0 && (
                      <button
                        onClick={() => handlePopulateDefaultChecklist(req)}
                        title="Add standard onboarding templates across all 4 stages"
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[12px] font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <i className="ri-magic-line text-xs" />
                        <span>Load Standard Items</span>
                      </button>
                    )}

                    <Link
                      to={`/onboarding-checklist?hire=${req.id}`}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 bg-[#253C7D]/10 text-[#253C7D] hover:bg-[#253C7D]/20 transition-colors"
                      title="Open interactive task checklist"
                    >
                      <i className="ri-task-line text-xs" />
                      <span>Checklist</span>
                    </Link>

                    <button
                      onClick={() => setExpandedRequest(isExpanded ? null : req.id)}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? "Collapse" : "Manage 4 Stages"}</span>
                      {isExpanded ? <i className="ri-arrow-up-s-line" /> : <i className="ri-arrow-down-s-line" />}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRequest(req);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete / Cancel this onboarding record"
                    >
                      <i className="ri-delete-bin-line text-sm" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Stage Stepper */}
                <div className="px-5 pb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-gray-500 flex items-center gap-2">
                      <span>
                        Overall Progress ({reqDocs.filter((d) => d.status === "complete").length} of {reqDocs.length} items verified)
                      </span>
                      {reqDocs.filter((d) => isDocOverdue(d)).length > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                          <i className="ri-alarm-warning-line" />
                          {reqDocs.filter((d) => isDocOverdue(d)).length} Overdue
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] font-semibold text-[#253C7D]">{overallProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-[#253C7D] rounded-full transition-all duration-500"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>

                  {/* Connected stage status bar */}
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    {STAGES.map((s, idx) => {
                      const isDone = (idx < currentStageIdx && req.status === "approved") || req.status === "completed";
                      const isCurrent = idx === currentStageIdx && req.status === "approved";
                      const isPendingStage = req.status === "pending";
                      const stageDocs = getDocsForRequestAndStage(req.id, s.key);
                      const verified = stageDocs.filter((d) => d.status === "complete").length;

                      return (
                        <div
                          key={s.key}
                          onClick={() => setExpandedRequest(req.id)}
                          title="Click to manage 4-stage checklist"
                          className={`py-1.5 px-2 rounded border text-xs font-medium flex items-center justify-between transition-all cursor-pointer hover:shadow-xs ${
                            isDone
                              ? "bg-green-50/70 border-green-200 text-green-800 hover:bg-green-100/70"
                              : isCurrent
                              ? "bg-[#253C7D]/10 border-[#253C7D]/30 text-[#253C7D] font-bold ring-1 ring-[#253C7D]/20 hover:bg-[#253C7D]/15"
                              : isPendingStage
                              ? "bg-amber-50/30 border-amber-200/50 text-gray-500 hover:bg-amber-50/60"
                              : "bg-gray-50 border-gray-200/60 text-gray-400 hover:bg-gray-100/60"
                          }`}
                        >
                          <span className="truncate flex items-center gap-1">
                            <i
                              className={
                                isDone
                                  ? "ri-checkbox-circle-fill text-green-600"
                                  : isCurrent
                                  ? "ri-play-circle-line text-[#253C7D]"
                                  : isPendingStage
                                  ? "ri-time-line text-amber-600"
                                  : "ri-lock-line text-gray-400"
                              }
                            />
                            <span className="hidden sm:inline">{s.label}</span>
                            <span className="sm:hidden">{s.shortLabel}</span>
                          </span>
                          <span className="text-[10px] opacity-75 shrink-0 ml-1">
                            {verified}/{stageDocs.length}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ==================== EXPANDED 4-STAGE CHECKLIST GRID ==================== */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                    {req.status === "pending" && (
                      <div className="mb-4 p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-amber-900">
                        <div className="flex items-center gap-2 text-xs">
                          <i className="ri-information-fill text-amber-600 text-base shrink-0" />
                          <span>
                            <strong>Journey Pending Approval:</strong> Checklist items are in <strong>View-Only</strong> mode. Click <strong>"Approve Journey"</strong> above to start selecting and verifying items.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApprove(req)}
                          className="px-3 py-1 bg-[#253C7D] hover:bg-[#1F336A] text-white text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer shadow-xs"
                        >
                          Approve Journey
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {STAGES.map((stage, idx) => {
                        const stageDocs = getDocsForRequestAndStage(req.id, stage.key);
                        const progress = getStageProgress(req.id, stage.key);
                        const isPending = req.status === "pending";
                        const isApproved = req.status === "approved";
                        const isDone = (idx < currentStageIdx && isApproved) || req.status === "completed";
                        const isCurrent = stage.key === req.stage && isApproved && req.status !== "completed";
                        const isFutureLocked = (idx > currentStageIdx && req.status !== "completed") || isPending;
                        const allDone = isStageComplete(req.id, stage.key);
                        const canChecklist = (isCurrent || isDone) && !isPending;
                        const isUnlocked = (isCurrent || isDone) && isApproved;

                        return (
                          <div
                            key={stage.key}
                            className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                              isCurrent
                                ? "bg-white border-[#253C7D] ring-2 ring-[#253C7D]/15 shadow-sm"
                                : isDone
                                ? "bg-white border-green-200 shadow-2xs hover:border-green-300"
                                : isPending
                                ? "bg-amber-50/20 border-amber-200/60"
                                : "bg-gray-50/70 border-gray-200 opacity-80"
                            }`}
                          >
                            {/* Column Stage Header */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5 pb-2 border-b border-gray-100">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                      isDone
                                        ? "bg-green-600 text-white"
                                        : isCurrent
                                        ? "bg-[#253C7D] text-white"
                                        : isPending
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-gray-100 text-gray-400"
                                    }`}
                                  >
                                    {isDone ? "✓" : isFutureLocked && !isPending ? <i className="ri-lock-line text-[10px]" /> : idx + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <h4 className="text-[13px] font-bold text-gray-900 truncate leading-tight">
                                        {stage.label}
                                      </h4>
                                    </div>
                                    <p className="text-[10px] text-gray-400 truncate">{stage.description}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {isCurrent && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
                                      Active Step
                                    </span>
                                  )}
                                  {isDone && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                                      ✓ Done
                                    </span>
                                  )}
                                  {isFutureLocked && !isPending && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-0.5">
                                      <i className="ri-lock-line text-[9px]" /> Locked
                                    </span>
                                  )}

                                  {isUnlocked && (
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        const days = Number(e.target.value);
                                        if (days) bulkSetStageDeadline(req, stage.key, days);
                                        e.target.value = "";
                                      }}
                                      title="Set a deadline for every item in this step that doesn't have one yet"
                                      className="text-[9px] border border-gray-200 rounded px-1 py-0.5 text-gray-500 bg-white cursor-pointer focus:outline-none hover:border-[#253C7D]/40 max-w-[68px] shrink-0"
                                    >
                                      <option value="">Deadline</option>
                                      {DEADLINE_PRESETS.map((p) => (
                                        <option key={p.days} value={p.days}>
                                          {p.label}
                                        </option>
                                      ))}
                                    </select>
                                  )}

                                  {isUnlocked && (
                                    <button
                                      onClick={() => openDocModal(req, stage.key)}
                                      title="Add Document / Item"
                                      className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-[#253C7D] hover:bg-gray-100 cursor-pointer shrink-0 ml-1"
                                    >
                                      <i className="ri-add-line text-base font-bold" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Progress bar inside stage */}
                              <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1 mt-2">
                                <span>
                                  {stageDocs.filter((d) => d.status === "complete").length}/{stageDocs.length} verified
                                </span>
                                <span className="font-semibold text-[#253C7D]">{progress}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    isDone ? "bg-green-600" : isCurrent ? "bg-[#253C7D]" : "bg-gray-300"
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>

                              {/* Checklist Items */}
                              <div className="space-y-1.5 mb-3 max-h-56 overflow-y-auto pr-1">
                                {stageDocs.map((doc) => {
                                  const isDocComplete = doc.status === "complete";
                                  const overdue = isDocOverdue(doc);
                                  return (
                                    <div
                                      key={doc.id}
                                      className={`p-2 rounded-lg border text-xs flex items-start gap-2 group transition-colors ${
                                        isDocComplete
                                          ? "bg-green-50/30 border-green-100"
                                          : overdue
                                          ? "bg-red-50/40 border-red-200"
                                          : isUnlocked
                                          ? "bg-white border-gray-200 hover:border-gray-300"
                                          : "bg-gray-50/50 border-gray-100"
                                      }`}
                                    >
                                      {/* Quick Checkbox */}
                                      <button
                                        type="button"
                                        disabled={!canChecklist}
                                        onClick={() => canChecklist && toggleDocStatus(doc, req)}
                                        title={
                                          isPending
                                            ? "Pending Approval: Click 'Approve Journey' above to enable verification."
                                            : isFutureLocked
                                            ? `Locked: Complete Step ${currentStageIdx + 1} and click 'Move On' to unlock.`
                                            : isDocComplete
                                            ? "Mark as unverified"
                                            : "Mark as verified"
                                        }
                                        className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                                          isDocComplete
                                            ? "bg-green-600 text-white cursor-pointer hover:bg-green-700"
                                            : canChecklist
                                            ? "border border-gray-300 hover:border-[#253C7D] bg-white cursor-pointer hover:scale-105"
                                            : "border border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed"
                                        }`}
                                      >
                                        {isDocComplete && <i className="ri-check-line text-[10px] font-bold" />}
                                        {!isDocComplete && isFutureLocked && !isPending && (
                                          <i className="ri-lock-fill text-[8px] text-gray-300" />
                                        )}
                                      </button>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                          <span
                                            className={`text-[12px] truncate ${
                                              isDocComplete
                                                ? "text-gray-400 line-through"
                                                : isFutureLocked
                                                ? "text-gray-500 font-medium"
                                                : "text-gray-800 font-medium"
                                            }`}
                                          >
                                            {doc.document_name}
                                          </span>

                                          {/* File download icon */}
                                          {doc.file_url && (
                                            <a
                                              href={doc.file_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              title="Download attachment"
                                              className="text-gray-400 hover:text-[#253C7D] shrink-0"
                                            >
                                              <i className="ri-download-line text-xs" />
                                            </a>
                                          )}
                                        </div>

                                        {doc.notes && (
                                          <p className="text-[10px] text-gray-400 truncate mt-0.5">{doc.notes}</p>
                                        )}

                                        {doc.due_date && (
                                          <div
                                            className={`flex items-center gap-1 mt-0.5 text-[10px] ${
                                              overdue ? "text-red-600 font-semibold" : "text-gray-400"
                                            }`}
                                          >
                                            <i className="ri-calendar-line" />
                                            <span>
                                              Due {new Date(doc.due_date).toLocaleString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                                hour: "numeric",
                                                minute: "2-digit",
                                              })}
                                            </span>
                                            {overdue && (
                                              <span className="text-[9px] uppercase px-1 rounded bg-red-100 text-red-700 font-bold">
                                                Overdue
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {isUnlocked && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                                          <button
                                            onClick={() => openEditDocModal(req, doc)}
                                            className="text-gray-400 hover:text-[#253C7D] p-0.5"
                                            title="Edit"
                                          >
                                            <i className="ri-pencil-line text-xs" />
                                          </button>
                                          <button
                                            onClick={() => deleteDocument(doc)}
                                            className="text-gray-400 hover:text-red-500 p-0.5"
                                            title="Remove"
                                          >
                                            <i className="ri-delete-bin-line text-xs" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {stageDocs.length === 0 && (
                                  <p className="text-[11px] text-gray-400 italic text-center py-4">No items yet</p>
                                )}
                              </div>

                              {/* Quick Add Presets */}
                              {isUnlocked && (
                                <div className="pt-2 border-t border-gray-100">
                                  <div className="flex flex-wrap gap-1">
                                    {DOCUMENT_TEMPLATES[stage.key]
                                      .filter((name) => !stageDocs.some((d) => d.document_name === name))
                                      .slice(0, 3)
                                      .map((name) => (
                                        <button
                                          key={name}
                                          type="button"
                                          onClick={() => quickAddPresetDoc(req, stage.key, name)}
                                          className="px-2 py-0.5 rounded text-[10px] bg-gray-50 hover:bg-[#253C7D]/10 text-gray-600 hover:text-[#253C7D] border border-gray-200/80 transition-colors cursor-pointer"
                                        >
                                          + {name}
                                        </button>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Stage Action Footer Button */}
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              {isCurrent ? (
                                stage.key !== "complete" ? (
                                  <div className="space-y-1.5">
                                    <button
                                      onClick={() => advanceStage(req)}
                                      className={`w-full py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.99] ${
                                        allDone
                                          ? "bg-[#253C7D] hover:bg-[#1F336A] text-white"
                                          : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                                      }`}
                                      title={allDone ? "Step verified! Click Move On to unlock the next step" : "Click Move On to proceed to the next step"}
                                    >
                                      <span>Move On</span>
                                      <i className="ri-arrow-right-line font-bold" />
                                    </button>
                                    {allDone && (
                                      <p className="text-[10px] text-emerald-600 text-center font-medium">
                                        ✓ All items verified! Ready to move on.
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-1.5">
                                    <button
                                      onClick={() => completeOnboarding(req)}
                                      className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.99]"
                                    >
                                      <i className="ri-check-double-line text-sm" />
                                      <span>Complete Onboarding</span>
                                    </button>
                                    {allDone && (
                                      <p className="text-[10px] text-emerald-600 text-center font-medium">
                                        ✓ Final items verified! Click to finish journey.
                                      </p>
                                    )}
                                  </div>
                                )
                              ) : isDone ? (
                                <div className="text-center py-1">
                                  <span className="text-[11px] text-green-700 bg-green-50 px-2.5 py-1 rounded-md font-medium inline-flex items-center gap-1 border border-green-200">
                                    <i className="ri-checkbox-circle-fill text-xs" />
                                    Step Completed ({stageDocs.filter((d) => d.status === "complete").length}/{stageDocs.length} verified)
                                  </span>
                                </div>
                              ) : isPending ? (
                                <div className="text-center py-1">
                                  <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-md font-medium inline-flex items-center gap-1 border border-amber-200/70">
                                    <i className="ri-lock-line text-xs" />
                                    View Only (Pending Approval)
                                  </span>
                                </div>
                              ) : (
                                <div className="text-center py-1">
                                  <span className="text-[10px] text-gray-400 flex items-center justify-center gap-1 font-medium">
                                    <i className="ri-lock-line text-[11px]" />
                                    Locked (Complete Step {currentStageIdx + 1} & click Move On)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : viewMode === "kanban" ? (
        /* ==================== PIPELINE KANBAN VIEW ==================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {STAGES.map((stage, idx) => {
            const stageRequests = filteredRequests.filter((r) => r.stage === stage.key && r.status !== "completed");
            const isFinal = stage.key === "complete";

            return (
              <div key={stage.key} className="bg-gray-50/80 rounded-xl p-4 border border-gray-200 flex flex-col gap-3 min-h-[380px]">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-white text-[#253C7D] font-bold text-xs flex items-center justify-center border border-gray-200">
                      {idx + 1}
                    </span>
                    <h3 className="text-xs font-bold text-gray-800">{stage.label}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-gray-600 border border-gray-200">
                    {stageRequests.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {stageRequests.map((req) => {
                    const overall = getOverallProgress(req);
                    const stageDocs = getDocsForRequestAndStage(req.id, stage.key);
                    const verified = stageDocs.filter((d) => d.status === "complete").length;

                    return (
                      <div
                        key={req.id}
                        onClick={() => {
                          setViewMode("cards");
                          setExpandedRequest(req.id);
                        }}
                        className="bg-white p-3.5 rounded-lg border border-gray-200 hover:border-[#253C7D] transition-colors cursor-pointer space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-md bg-[#253C7D]/10 text-[#253C7D] font-bold text-xs flex items-center justify-center">
                              {req.employees?.first_name?.[0]}
                              {req.employees?.last_name?.[0]}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-gray-900 leading-tight">
                                {req.employees?.first_name} {req.employees?.last_name}
                              </h4>
                              <p className="text-[11px] text-gray-400 truncate max-w-[120px]">
                                {req.employees?.role || "New Hire"}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              req.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span>{req.employees?.branches?.name || "HQ"}</span>
                          <span className="font-semibold">Day {req.day_count}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-gray-400">
                            <span>Checklist</span>
                            <span className="font-semibold text-[#253C7D]">
                              {verified}/{stageDocs.length}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#253C7D] h-full rounded-full" style={{ width: `${overall}%` }} />
                          </div>
                        </div>

                        {req.status === "approved" && (
                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                            <Link
                              to={`/onboarding-checklist?hire=${req.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] font-bold text-[#253C7D] hover:underline flex items-center gap-0.5"
                              title="Open task checklist"
                            >
                              <i className="ri-task-line text-[10px]" />
                              <span>Checklist</span>
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isFinal) completeOnboarding(req);
                                else advanceStage(req);
                              }}
                              className="text-[10px] font-bold text-[#253C7D] hover:underline flex items-center gap-0.5"
                            >
                              {isFinal ? "Complete" : "Next Stage"} <i className="ri-arrow-right-s-line" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {stageRequests.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs italic">No candidates in this stage</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ==================== COMPACT TABLE VIEW ==================== */
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role & Dept</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map((req) => {
                  const overall = getOverallProgress(req);
                  const stageConfig = STAGES.find((s) => s.key === req.stage) || STAGES[0];

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                      onClick={() => {
                        setViewMode("cards");
                        setExpandedRequest(req.id);
                      }}
                    >
                      <td className="py-3 px-4 font-bold text-gray-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-[#253C7D]/10 text-[#253C7D] font-bold text-xs flex items-center justify-center">
                            {req.employees?.first_name?.[0]}
                            {req.employees?.last_name?.[0]}
                          </div>
                          <span>
                            {req.employees?.first_name} {req.employees?.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-700">{req.employees?.role || "New Hire"}</span>
                        <span className="block text-[11px] text-gray-400">{req.employees?.department || "General"}</span>
                      </td>
                      <td className="py-3 px-4">{req.employees?.branches?.name || "Headquarters"}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#253C7D] flex items-center gap-1">
                          <i className={stageConfig.icon} />
                          {stageConfig.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700">Day {req.day_count}</td>
                      <td className="py-3 px-4 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#253C7D] h-full rounded-full" style={{ width: `${overall}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-gray-700">{overall}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            req.status === "pending"
                              ? "bg-amber-50 text-amber-700"
                              : req.status === "approved"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {req.status === "pending" && (
                            <button
                              onClick={() => handleApprove(req)}
                              className="px-2.5 py-1 bg-[#253C7D] text-white rounded text-[11px] font-semibold hover:bg-[#1F336A] transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          <Link
                            to={`/onboarding-checklist?hire=${req.id}`}
                            className="px-2.5 py-1 bg-[#253C7D]/10 hover:bg-[#253C7D]/20 text-[#253C7D] rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
          
                            title="Open task checklist"
                          >
                            <i className="ri-task-line text-xs" />
                            <span>Checklist</span>
                          </Link>
                          <button
                            onClick={() => {
                              setViewMode("cards");
                              setExpandedRequest(req.id);
                            }}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(req)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Delete onboarding record"
                          >
                            <i className="ri-delete-bin-line text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== START ONBOARDING MODAL ==================== */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-gray-900">Start Onboarding</h3>
              <button
                onClick={() => setShowStartModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {eligibleEmployees.length === 0 ? (
              <>
                <p className="text-[13px] text-gray-500 mb-4">
                  Every employee in the directory already has an onboarding journey or has completed onboarding. Add a new employee first in the{" "}
                  <strong>Employees</strong> module, then return here to start theirs.
                </p>
                <button
                  onClick={() => setShowStartModal(false)}
                  className="w-full px-4 py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] transition-colors"
                >
                  Got it
                </button>
              </>
            ) : (
              <form onSubmit={handleStartOnboarding} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[12px] font-semibold text-gray-700">
                      Candidate *
                    </label>
                    <span className="text-[11px] font-semibold text-gray-500">
                      {eligibleEmployees.length} eligible
                    </span>
                  </div>

                  {/* Real-time Candidate Search Input */}
                  <div className="relative mb-2.5">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="text"
                      placeholder="Search candidate name, role, department..."
                      value={empSearch}
                      onChange={(e) => setEmpSearch(e.target.value)}
                      className="w-full pl-8 pr-8 py-2 rounded-xl text-[12px] bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#253C7D] focus:bg-white transition-all shadow-inner"
                      autoFocus
                    />
                    {empSearch && (
                      <button
                        type="button"
                        onClick={() => setEmpSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                        title="Clear search"
                      >
                        <i className="ri-close-circle-fill" />
                      </button>
                    )}
                  </div>

                  {/* Selected Candidate Preview Card */}
                  {selectedEmp && (
                    <div className="mb-2.5 p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {selectedEmp.avatar_url ? (
                          <img
                            src={selectedEmp.avatar_url}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-blue-200 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#253C7D] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {selectedEmp.first_name?.[0]}
                            {selectedEmp.last_name?.[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-gray-900 truncate">
                            {selectedEmp.first_name} {selectedEmp.last_name}
                          </p>
                          <p className="text-[11px] text-gray-600 truncate">
                            {selectedEmp.role || "Staff"} · {selectedEmp.department || "General"}
                            {selectedEmp.branches?.name ? ` · ${selectedEmp.branches.name}` : ""}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-200/80 text-[#253C7D] shrink-0 flex items-center gap-1">
                        <i className="ri-check-line" />
                        Selected
                      </span>
                    </div>
                  )}

                  {/* Dynamic Candidate List */}
                  <div className="space-y-1 max-h-56 overflow-y-auto pr-1 border border-gray-200/80 rounded-xl p-1.5 bg-gray-50/50">
                    {filteredEligibleEmployees.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">
                        <i className="ri-user-search-line text-2xl mb-1 block text-gray-300" />
                        <p className="text-[12px] font-semibold text-gray-600">
                          No matching candidate found
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {empSearch ? `No candidates matching "${empSearch}"` : "No eligible candidates available"}
                        </p>
                      </div>
                    ) : (
                      filteredEligibleEmployees.map((emp) => {
                        const isSelected = startEmployeeId === emp.id;
                        return (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => setStartEmployeeId(emp.id)}
                            className={`w-full p-2.5 rounded-lg text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer border ${
                              isSelected
                                ? "bg-white border-[#253C7D] ring-2 ring-[#253C7D]/20 shadow-xs"
                                : "bg-white border-gray-200/60 hover:border-gray-300 hover:bg-gray-50/80"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {emp.avatar_url ? (
                                <img
                                  src={emp.avatar_url}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-bold text-xs flex items-center justify-center shrink-0">
                                  {emp.first_name?.[0]}
                                  {emp.last_name?.[0]}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-[13px] font-bold text-gray-900 truncate">
                                  {emp.first_name} {emp.last_name}
                                </p>
                                <p className="text-[11px] text-gray-500 truncate">
                                  {emp.role || "Staff"} · {emp.department || "General"}
                                  {emp.branches?.name ? ` · ${emp.branches.name}` : ""}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0">
                              {isSelected ? (
                                <i className="ri-checkbox-circle-fill text-[#253C7D] text-lg" />
                              ) : (
                                <span className="text-[11px] text-gray-500 font-semibold px-2 py-0.5 rounded bg-gray-100 group-hover:bg-gray-200">
                                  Select
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <p className="text-[11px] text-gray-400 mt-2">
                    Don't see them? Add them in the <strong>Employees</strong> module first.
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowStartModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={starting || !startEmployeeId}
                    className="flex-1 px-4 py-2.5 bg-[#253C7D] text-white rounded-xl text-[13px] font-semibold hover:bg-[#1F336A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {starting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <i className="ri-user-add-line" />
                        <span>Start Onboarding</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================== ADD / EDIT DOCUMENT MODAL ==================== */}
      {showDocModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-900">
                {editingDocId ? "Edit Document" : "Add Document"} — {STAGES.find((s) => s.key === selectedStage)?.label}
              </h3>
              <button
                onClick={() => setShowDocModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>
            <form onSubmit={handleDocUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Document Name *</label>
                {editingDocId ? (
                  <input
                    type="text"
                    required
                    value={docForm.document_name}
                    onChange={(e) => setDocForm({ ...docForm, document_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D]"
                  />
                ) : (
                  <>
                    <select
                      value={docForm.document_name}
                      onChange={(e) => setDocForm({ ...docForm, document_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] bg-white"
                      required
                    >
                      <option value="">Select document type</option>
                      {DOCUMENT_TEMPLATES[selectedStage]?.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                      <option value="custom">Custom...</option>
                    </select>
                    {docForm.document_name === "custom" && (
                      <input
                        type="text"
                        placeholder="Enter document name"
                        onChange={(e) => setDocForm({ ...docForm, document_name: e.target.value })}
                        className="mt-2 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D]"
                        required
                      />
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                  {editingDocId ? "Replace File (optional)" : "Upload File (optional)"}
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files?.[0]) {
                      setSelectedFileName(e.dataTransfer.files[0].name);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full px-4 py-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
                    isDragOver
                      ? "border-[#253C7D] bg-[#253C7D]/5"
                      : "border-gray-200 hover:border-[#253C7D]/30 hover:bg-[#253C7D]/5"
                  }`}
                >
                  <i className="ri-upload-cloud-line text-2xl text-gray-400 mb-2 block" />
                  <p className="text-[13px] text-gray-600">Click or drag file to upload</p>
                  <p className="text-[11px] text-gray-400 mt-1">PDF, DOC, DOCX, JPG, PNG up to 10MB</p>
                  {selectedFileName && <p className="text-[12px] text-[#253C7D] font-medium mt-2">{selectedFileName}</p>}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name || null)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[12px] font-semibold text-gray-700">Due Date & Time (optional)</label>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {DEADLINE_PRESETS.map((p) => (
                      <button
                        key={p.days}
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + p.days);
                          setDocForm({ ...docForm, due_date: formatDateTimeLocal(d) });
                        }}
                        className="px-1.5 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 rounded text-gray-600 font-medium cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="datetime-local"
                  value={docForm.due_date}
                  onChange={(e) => setDocForm({ ...docForm, due_date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D]"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  If not verified by this time, the item will show as overdue in the checklist.
                </p>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
                <textarea
                  value={docForm.notes}
                  onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] resize-none"
                  placeholder="Add notes about this document..."
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? "Saving..." : editingDocId ? "Save Changes" : "Add Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
