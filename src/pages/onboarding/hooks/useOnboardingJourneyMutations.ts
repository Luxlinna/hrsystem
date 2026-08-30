import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { startOnboardingForEmployee } from "@/lib/onboarding";
import type { OnboardingRequest, OnboardingDoc, EmployeeOption } from "../types";
import { useOnboardingStageTransitions } from "./useOnboardingStageTransitions";
import { buildDefaultDocumentInserts, buildDefaultTaskInserts } from "../onboardingUtils";

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

  const transitions = useOnboardingStageTransitions({
    actorName,
    roleName,
    setRequests,
    setExpandedRequest,
  });

  const openStartOnboarding = useCallback(() => {
    loadData();
    setStartEmployeeId("");
    setEmpSearch("");
    setShowStartModal(true);
  }, [loadData]);

  const handleStartOnboarding = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!startEmployeeId) return;

      const existing = requests.find((r) => r.employee_id === startEmployeeId);
      if (existing) {
        toast("Already Onboarded", `This employee already has an onboarding record (${existing.status === "completed" ? "Completed" : existing.status}).`, "error");
        return;
      }

      setStarting(true);
      const { data: dbCheck } = await supabase.from("onboarding_requests").select("id, status").eq("employee_id", startEmployeeId).maybeSingle();
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
    },
    [startEmployeeId, requests, actorName, roleName, employees, loadData]
  );

  const handleDeleteRequest = useCallback(
    async (req: OnboardingRequest) => {
      const empName = req.employees ? `${req.employees.first_name} ${req.employees.last_name}` : "this employee";
      if (!confirm(`Are you sure you want to remove the onboarding journey for ${empName}? This will delete this onboarding request and its documents.`)) return;

      try {
        const [{ error }, { error: taskErr }] = await Promise.all([
          supabase.from("onboarding_requests").update({ deleted_at: new Date().toISOString(), deleted_by: actorName }).eq("id", req.id),
          supabase.from("onboarding_checklist_tasks").update({ deleted_at: new Date().toISOString(), deleted_by: actorName }).eq("onboarding_request_id", req.id),
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
    },
    [actorName, roleName, loadData]
  );

  const handlePopulateDefaultChecklist = useCallback(
    async (req: OnboardingRequest) => {
      const toInsert = buildDefaultDocumentInserts(req, documents);
      if (toInsert.length === 0) {
        toast("Up to Date", "All standard checklist items are already present", "info");
        return;
      }

      const { error } = await supabase.from("onboarding_documents").insert(toInsert);
      const { data: existingTasks } = await supabase.from("onboarding_checklist_tasks").select("id").eq("onboarding_request_id", req.id).is("deleted_at", null);

      if (!existingTasks || existingTasks.length === 0) {
        const initialTasks = buildDefaultTaskInserts(req);
        await supabase.from("onboarding_checklist_tasks").insert(initialTasks);
      }

      if (error) {
        toast("Error", "Failed to populate checklist items", "error");
      } else {
        toast("Checklist Loaded", `Added ${toInsert.length} standard checklist items & task assignments`, "success");
        loadData();
      }
    },
    [documents, loadData]
  );

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
    handleApprove: transitions.handleApprove,
    advanceStage: transitions.advanceStage,
    regressStage: transitions.regressStage,
    completeOnboarding: transitions.completeOnboarding,
  };
}
