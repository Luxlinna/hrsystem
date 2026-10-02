import { useState, useEffect, useCallback, useMemo } from "react";
import type { Candidate, Interview, CandidateApproval } from "../types";
import {
  fetchCandidateApproval,
  saveCandidateApproval,
  isCandidateApprovalCompleted,
} from "../services/candidateApprovalService";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { evaluateApprovalStepGates } from "../services/candidateApprovalPermissions";
import {
  syncCandidateApprovalSignatories,
  executeSignApprovalStep,
  executeApproveAllSteps,
  exportApprovalAsPdf,
  exportApprovalAsWord,
} from "../utils/candidateApprovalSignHelper";

export type ApprovalTabType = "overview" | "evaluation" | "approvals";

interface UseCandidateApprovalModalParams {
  isOpen: boolean;
  candidate: Candidate;
  interviews?: Interview[];
  currentUserName?: string;
  onAdvanceStage?: (targetStage: string) => Promise<void> | void;
  onClose: () => void;
}

export function useCandidateApprovalModal({
  isOpen,
  candidate,
  interviews = [],
  currentUserName = "HR Operations",
  onAdvanceStage,
  onClose,
}: UseCandidateApprovalModalParams) {
  const [activeTab, setActiveTab] = useState<ApprovalTabType>("approvals");
  const [data, setData] = useState<CandidateApproval | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { role, isAdmin, isBranchAdmin } = usePermissions();

  const stepGates = useMemo(
    () => evaluateApprovalStepGates(data, role, isAdmin, isBranchAdmin),
    [data, role, isAdmin, isBranchAdmin]
  );

  useEffect(() => {
    if (!isOpen || !candidate) return;
    let mounted = true;
    setLoading(true);

    fetchCandidateApproval(candidate.id, candidate, interviews, currentUserName)
      .then((res) => {
        if (mounted) {
          setData(syncCandidateApprovalSignatories({
            res,
            currentUserName,
            roleName: (role?.name || "").trim().toLowerCase(),
            isBranchAdmin,
            role,
          }));
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load candidate approval:", err);
        if (mounted) setLoading(false);
      });

    const channel = supabase
      .channel(`caf-modal-${candidate.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "candidate_approvals",
          filter: `candidate_id=eq.${candidate.id}`,
        },
        (payload) => {
          if (mounted && payload.new) {
            setData(payload.new as CandidateApproval);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, candidate, interviews, currentUserName]);

  const handleSave = useCallback(
    async (showToast = true): Promise<CandidateApproval | null> => {
      if (!data) return null;
      setSaving(true);
      try {
        const saved = await saveCandidateApproval(data);
        setData(saved);
        if (showToast) {
          toast("Approval Saved", "Candidate approval details updated successfully.", "success");
        }
        return saved;
      } catch (err: any) {
        toast("Error", err.message || "Failed to save approval details", "error");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [data]
  );

  const handleSignStep = useCallback(
    async (roleKey: keyof CandidateApproval["signatories"]) => {
      if (!data) return;
      setSaving(true);
      try {
        const { saved, notifyRes } = await executeSignApprovalStep({
          data,
          roleKey,
          stepGates,
          currentUserName,
          role,
          candidate,
        });
        setData(saved);
        toast(notifyRes.title, notifyRes.message, "success");
      } catch (err: any) {
        toast("Error", err.message || "Failed to record approval sign-off.", "error");
      } finally {
        setSaving(false);
      }
    },
    [data, stepGates, currentUserName, candidate, role]
  );

  const handleApproveAll = useCallback(async () => {
    if (!data) return;
    if (!isAdmin) {
      toast("Permission Denied", "Only Administrators can fast-sign all steps.", "error");
      return;
    }
    setSaving(true);
    try {
      const saved = await executeApproveAllSteps(data, currentUserName);
      setData(saved);
      toast("Candidate Approved", "All 4 executive approval steps have been signed and approved!", "success");
    } catch {
      toast("Error", "Failed to approve all steps.", "error");
    } finally {
      setSaving(false);
    }
  }, [data, currentUserName, isAdmin]);

  const handleExportPdf = useCallback(() => {
    if (data) exportApprovalAsPdf(data);
  }, [data]);

  const handleExportWord = useCallback(async () => {
    if (!data) return;
    try {
      await exportApprovalAsWord(data);
      toast("Success", "Word document exported successfully.", "success");
    } catch (err) {
      console.error("Failed to export Word document:", err);
      toast("Export Error", "Failed to export Word document.", "error");
    }
  }, [data]);

  const handleAdvanceNext = useCallback(async () => {
    const saved = await handleSave(false);
    if (!saved) return;
    if (onAdvanceStage) await onAdvanceStage("salary_negotiation");
    onClose();
  }, [handleSave, onAdvanceStage, onClose]);

  const isCompleted = isCandidateApprovalCompleted(data);
  const approvedCount = data?.signatories
    ? Object.values(data.signatories).filter((s) => s.status === "approved").length
    : 0;

  return {
    activeTab,
    setActiveTab,
    data,
    setData,
    loading,
    saving,
    isCompleted,
    approvedCount,
    stepGates,
    canFastSign: isAdmin,
    handleSave,
    handleSignStep,
    handleApproveAll,
    handleExportPdf,
    handleExportWord,
    handleAdvanceNext,
  };
}
