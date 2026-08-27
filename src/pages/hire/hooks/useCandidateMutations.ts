import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { uploadFileToR2 } from "@/lib/r2-storage";
import { startOnboardingForEmployee } from "@/lib/onboarding";
import type { Job, Candidate } from "../types";
import { STAGE_CONFIG } from "../constants";

interface UseCandidateMutationsProps {
  actorName: string;
  actorRole: string;
  loadData: () => Promise<void>;
}

export function useCandidateMutations({
  actorName,
  actorRole,
  loadData,
}: UseCandidateMutationsProps) {
  const [movingToOnboarding, setMovingToOnboarding] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const updateCandidateStage = useCallback(
    async (id: string, stage: string) => {
      const { error } = await supabase.from("candidates").update({ stage }).eq("id", id);
      if (error) {
        toast("Error", "Failed to update candidate stage", "error");
        return;
      }
      toast("Stage updated", `Candidate moved to ${STAGE_CONFIG[stage]?.label || stage}.`, "success");
      loadData();
    },
    [loadData]
  );

  const rateCandidate = useCallback(
    async (id: string, rating: number) => {
      const { error } = await supabase.from("candidates").update({ rating }).eq("id", id);
      if (error) {
        toast("Error", "Failed to save rating", "error");
        return;
      }
      toast("Rating saved", `Candidate rated ${rating}/5.`, "success");
      loadData();
    },
    [loadData]
  );

  const deleteCandidate = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`Move candidate "${name}" to Recycle Bin?`)) return;
      const { error } = await supabase
        .from("candidates")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", id);
      if (error) {
        toast("Error", "Failed to delete candidate", "error");
        return;
      }
      toast("Candidate Deleted", "Candidate sent to Recycle Bin.", "success");
      loadData();
    },
    [actorName, loadData]
  );

  const handleMoveToOnboarding = useCallback(
    async (
      candidate: Candidate,
      branchId: string,
      joinDate: string,
      job?: Job
    ) => {
      if (movingToOnboarding) return false;
      setMovingToOnboarding(true);

      const [first_name, ...rest] = candidate.full_name.trim().split(/\s+/);
      const last_name = rest.join(" ") || "-";

      const { data: existingEmp } = await supabase
        .from("employees")
        .select("id")
        .eq("email", candidate.email)
        .maybeSingle();

      let employeeId = existingEmp?.id as string | undefined;

      if (!employeeId) {
        const { data: newEmp, error: empError } = await supabase
          .from("employees")
          .insert({
            first_name,
            last_name,
            email: candidate.email,
            phone: candidate.phone || null,
            role: job?.title || null,
            department: job?.department || null,
            branch_id: branchId || null,
            status: "onboarding",
            join_date: joinDate,
          })
          .select()
          .single();

        if (empError) {
          setMovingToOnboarding(false);
          toast("Error", "Failed to create employee record for onboarding", "error");
          return false;
        }
        employeeId = newEmp.id;
      } else {
        const { data: existingRequest } = await supabase
          .from("onboarding_requests")
          .select("id")
          .eq("employee_id", employeeId)
          .maybeSingle();
        if (existingRequest) {
          setMovingToOnboarding(false);
          toast("Already Onboarded", `${candidate.full_name} already has an onboarding journey in progress.`, "error");
          return false;
        }
      }

      const { data, error } = await startOnboardingForEmployee(employeeId!, actorName);
      setMovingToOnboarding(false);

      if (error) {
        toast("Error", "Failed to start onboarding journey", "error");
        return false;
      }

      toast("Moved to Onboarding", `${candidate.full_name} has been added to the Onboarding module.`, "success");
      logActivity({
        module: "onboarding",
        action: "created",
        entityType: "onboarding_request",
        entityId: data.id,
        actorName,
        actorRole,
        description: `${candidate.full_name} moved from Recruitment to Onboarding after being hired`,
      });
      notify({
        source: "onboarding",
        type: "info",
        title: "Onboarding started",
        message: `${candidate.full_name}'s onboarding journey has begun.`,
        entityId: data.id,
      });

      loadData();
      return true;
    },
    [movingToOnboarding, actorName, actorRole, loadData]
  );

  const uploadCandidateResume = useCallback(
    async (candidateId: string, file: File) => {
      setUploadingResume(true);
      try {
        const resume_url = await uploadFileToR2(file, "candidates/resumes");
        await supabase.from("candidates").update({ resume_url, resume_name: file.name }).eq("id", candidateId);
        toast("Resume uploaded", "Resume attached successfully.", "success");
        loadData();
      } catch (err) {
        toast("Upload failed", err instanceof Error ? err.message : "Could not upload resume", "error");
      } finally {
        setUploadingResume(false);
      }
    },
    [loadData]
  );

  return {
    movingToOnboarding,
    uploadingResume,
    setUploadingResume,
    updateCandidateStage,
    rateCandidate,
    deleteCandidate,
    handleMoveToOnboarding,
    uploadCandidateResume,
  };
}
