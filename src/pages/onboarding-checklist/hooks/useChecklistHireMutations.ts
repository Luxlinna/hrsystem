import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import type { OnboardingHire } from "../types";
import { getHireName } from "../checklistUtils";

interface UseChecklistHireMutationsProps {
  selectedHire: OnboardingHire | null;
  completerName: string;
  setSelectedHire: React.Dispatch<React.SetStateAction<OnboardingHire | null>>;
  setHires: React.Dispatch<React.SetStateAction<OnboardingHire[]>>;
  loadData: () => Promise<void>;
}

export function useChecklistHireMutations({
  selectedHire,
  completerName,
  setSelectedHire,
  setHires,
  loadData,
}: UseChecklistHireMutationsProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [hireAuditLogs, setHireAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  const handleApproveHire = useCallback(async () => {
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
  }, [selectedHire, completerName, setSelectedHire, setHires, loadData]);

  const handleAdvanceStage = useCallback(async () => {
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
      toast("Error", "Failed to advance stage", "error");
    } else {
      setSelectedHire((prev) => (prev ? { ...prev, stage: nextStage, status: "approved" } : null));
      setHires((prev) => prev.map((h) => (h.id === selectedHire.id ? { ...h, stage: nextStage, status: "approved" } : h)));
      toast("Stage Advanced", `Moved to ${nextStage.replace("_", " ").toUpperCase()}`, "success");
      loadData();
    }
  }, [selectedHire, setSelectedHire, setHires, loadData]);

  const loadHireAuditLogs = useCallback(async () => {
    if (!selectedHire) return;
    setLoadingAuditLogs(true);
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("module", "onboarding")
      .eq("entity_id", selectedHire.id)
      .order("created_at", { ascending: false });
    setHireAuditLogs(data || []);
    setLoadingAuditLogs(false);
  }, [selectedHire]);

  return {
    showExportModal,
    setShowExportModal,
    hireAuditLogs,
    loadingAuditLogs,
    handleApproveHire,
    handleAdvanceStage,
    loadHireAuditLogs,
  };
}
