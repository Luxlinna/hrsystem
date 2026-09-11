import { useState, useEffect, useCallback, useMemo } from "react";
import type { Candidate, Interview, CandidateApproval, CandidateApprovalSignatory } from "../types";
import {
  fetchCandidateApproval,
  saveCandidateApproval,
  isCandidateApprovalCompleted,
} from "../services/candidateApprovalService";
import { exportCandidateApprovalPdf } from "../exports/exportCandidateApprovalPdf";
import { toast } from "@/components/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import {
  evaluateApprovalStepGates,
  type ApprovalStepKey,
} from "../services/candidateApprovalPermissions";
import { notifyCandidateApprovalStepSigned } from "../services/notifications/candidateApprovalEventTriggers";

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
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load candidate approval:", err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
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
      const stepKey = roleKey as ApprovalStepKey;
      const gate = stepGates[stepKey];

      if (gate.isLocked) {
        toast("Step Locked", `Please complete ${gate.waitingForRoleTitle} first.`, "error");
        return;
      }

      if (!gate.canUserSign) {
        toast("Permission Denied", gate.requiresPermissionHint, "error");
        return;
      }

      const now = new Date().toISOString();
      const currentSig = data.signatories[roleKey];
      const isDelegated = Boolean(
        currentUserName && currentSig.assigned_name && currentUserName !== currentSig.assigned_name
      );

      const checkedBy = isDelegated
        ? `${currentUserName} (Staff Delegate)`
        : currentUserName;

      const updatedSig: CandidateApprovalSignatory = {
        ...currentSig,
        status: "approved",
        checked_by: checkedBy,
        signed_at: now,
      };

      const updated: CandidateApproval = {
        ...data,
        signatories: {
          ...data.signatories,
          [roleKey]: updatedSig,
        },
      };

      setData(updated);
      setSaving(true);
      try {
        const saved = await saveCandidateApproval(updated);
        setData(saved);

        const notifyRes = await notifyCandidateApprovalStepSigned({
          candidate,
          approval: saved,
          signedStep: stepKey,
          actorName: currentUserName,
          actorRole: role?.name || "Staff",
          isDelegated,
        });

        toast(notifyRes.title, notifyRes.message, "success");
      } catch {
        toast("Error", "Failed to record approval sign-off.", "error");
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

    const now = new Date().toISOString();
    const sigs = { ...data.signatories };

    (Object.keys(sigs) as Array<keyof typeof sigs>).forEach((k) => {
      sigs[k] = {
        ...sigs[k],
        status: "approved",
        checked_by: sigs[k].checked_by || currentUserName,
        signed_at: sigs[k].signed_at || now,
      };
    });

    const updated: CandidateApproval = {
      ...data,
      signatories: sigs,
      status: "approved",
      completed_at: now,
    };

    setData(updated);
    setSaving(true);
    try {
      const saved = await saveCandidateApproval(updated);
      setData(saved);
      toast(
        "Candidate Approved",
        "All 4 executive approval steps have been signed and approved!",
        "success"
      );
    } catch {
      toast("Error", "Failed to approve all steps.", "error");
    } finally {
      setSaving(false);
    }
  }, [data, currentUserName, isAdmin]);

  const handleExportPdf = useCallback(() => {
    if (!data) return;
    exportCandidateApprovalPdf(data);
  }, [data]);

  const handleAdvanceNext = useCallback(async () => {
    const saved = await handleSave(false);
    if (!saved) return;
    if (onAdvanceStage) {
      await onAdvanceStage("salary_negotiation");
    }
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
    handleAdvanceNext,
  };
}
