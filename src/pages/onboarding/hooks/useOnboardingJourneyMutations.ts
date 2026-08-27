import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import {
  startOnboardingForEmployee,
  ONBOARDING_DOCUMENT_TEMPLATES as DOCUMENT_TEMPLATES,
  ONBOARDING_DEFAULT_CHECKLIST_TASKS as DEFAULT_CHECKLIST_TASKS,
  STAGE_DEFAULT_DUE_DAYS,
  CATEGORY_TO_STAGE,
} from "@/lib/onboarding";
import type { OnboardingRequest, OnboardingDoc, EmployeeOption } from "../types";
import { STAGES } from "../constants";

interface UseOnboardingJourneyMutationsProps {
  requests: OnboardingRequest[];
  documents: OnboardingDoc[];
  employees: EmployeeOption[];
  actorName: string;
  roleName?: string;
  loadData: () => Promise<void>;
  setRequests: React.Dispatch<React.SetStateAction<OnboardingRequest[]>>;
  setExpandedRequest: (id: string | null) => void;
}

export function useOnboardingJourneyMutations({
  requests,
  documents,
  employees,
  actorName,
  roleName = "Unknown",
  loadData,
  setRequests,
  setExpandedRequest,
}: UseOnboardingJourneyMutationsProps) {
  const [showStartModal, setShowStartModal] = useState(false);
  const [startEmployeeId, setStartEmployeeId] = useState("");
  const [empSearch, setEmpSearch] = useState("");
  const [starting, setStarting] = useState(false);

  const openStartOnboarding = useCallback(() => {
    loadData();
    setStartEmployeeId("");
    setEmpSearch("");
    setShowStartModal(true);
  }, [loadData]);

  const handleStartOnboarding = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startEmployeeId) return;

    const existing = requests.find((r) => r.employee_id === startEmployeeId);
    if (existing) {
      toast("Already Onboarded", `This employee already has an onboarding record (${existing.status === "completed" ? "Completed" : existing.status}).`, "error");
      return;
    }

    setStarting(true);
    const { data: dbCheck } = await supabase
      .from("onboarding_requests")
      .select("id, status")
      .eq("employee_id", startEmployeeId)
      .maybeSingle();

    if (dbCheck) {
      setStarting(false);
      toast("Already Onboarded", "This employee already has an onboarding record in the database.", "error");
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
      actorRole: roleName,
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
  }, [startEmployeeId, requests, actorName, roleName, employees, loadData]);

  const handleDeleteRequest = useCallback(async (req: OnboardingRequest) => {
    const empName = req.employees ? `${req.employees.first_name} ${req.employees.last_name}` : "this employee";
    if (!confirm(`Are you sure you want to remove the onboarding journey for ${empName}? This will delete this onboarding request and its documents.`)) return;

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
          actorRole: roleName,
          description: `Deleted onboarding journey and checklist for ${empName}`,
        });
        loadData();
      }
    } catch {
      toast("Error", "Failed to delete onboarding record", "error");
    }
  }, [actorName, roleName, loadData]);

  const handlePopulateDefaultChecklist = useCallback(async (req: OnboardingRequest) => {
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
  }, [documents, loadData]);

  const handleApprove = useCallback(async (req: OnboardingRequest) => {
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
        actorRole: roleName,
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
  }, [setRequests, setExpandedRequest, actorName, roleName]);

  const advanceStage = useCallback(async (req: OnboardingRequest) => {
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
  }, [setRequests]);

  const completeOnboarding = useCallback(async (req: OnboardingRequest) => {
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
        actorRole: roleName,
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
  }, [setRequests, actorName, roleName]);

  return {
    showStartModal,
    setShowStartModal,
    startEmployeeId,
    setStartEmployeeId,
    empSearch,
    setEmpSearch,
    starting,
    openStartOnboarding,
    handleStartOnboarding,
    handleDeleteRequest,
    handlePopulateDefaultChecklist,
    handleApprove,
    advanceStage,
    completeOnboarding,
  };
}
