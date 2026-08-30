import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import type { OnboardingRequest } from "../types";
import { STAGES } from "../constants";

interface UseOnboardingStageTransitionsProps {
  actorName: string;
  roleName: string;
  setRequests: React.Dispatch<React.SetStateAction<OnboardingRequest[]>>;
  setExpandedRequest: (id: string | null) => void;
}

export function useOnboardingStageTransitions({
  actorName,
  roleName,
  setRequests,
  setExpandedRequest,
}: UseOnboardingStageTransitionsProps) {
  const handleApprove = useCallback(
    async (req: OnboardingRequest) => {
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
    },
    [setRequests, setExpandedRequest, actorName, roleName]
  );

  const advanceStage = useCallback(
    async (req: OnboardingRequest) => {
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
    },
    [setRequests]
  );

  const regressStage = useCallback(
    async (req: OnboardingRequest) => {
      const currentIndex = STAGES.findIndex((s) => s.key === req.stage);
      if (currentIndex <= 0) return;
      const prevStage = STAGES[currentIndex - 1].key;
      const { error } = await supabase.from("onboarding_requests").update({ stage: prevStage }).eq("id", req.id);
      if (error) {
        toast("Failed", "Failed to revert stage", "error");
      } else {
        setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, stage: prevStage } : r)));
        const targetLabel = STAGES[currentIndex - 1].label;
        toast("Stage Reverted", `Moved back to ${targetLabel}`, "success");
      }
    },
    [setRequests]
  );

  const completeOnboarding = useCallback(
    async (req: OnboardingRequest) => {
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
    },
    [setRequests, actorName, roleName]
  );

  return {
    handleApprove,
    advanceStage,
    regressStage,
    completeOnboarding,
  };
}
