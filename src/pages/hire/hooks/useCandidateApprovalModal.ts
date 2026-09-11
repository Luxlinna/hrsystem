import { useState, useEffect, useCallback, useMemo } from "react";
import type { Candidate, Interview, CandidateApproval, CandidateApprovalSignatory } from "../types";
import {
  fetchCandidateApproval,
  saveCandidateApproval,
  isCandidateApprovalCompleted,
} from "../services/candidateApprovalService";
import { exportCandidateApprovalPdf } from "../exports/exportCandidateApprovalPdf";
import { exportCandidateApprovalWord } from "../exports/exportCandidateApprovalWord";
import { supabase } from "@/lib/supabase";
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
          const updatedSigs = { ...res.signatories };
          let changed = false;
          const roleName = (role?.name || "").trim().toLowerCase();

          // If current user is BU CEO / Branch Admin and Step 1 not signed
          if (updatedSigs.ceo && updatedSigs.ceo.status !== "approved" && currentUserName) {
            if (isBranchAdmin || /(bu\s*ceo|ceo|branch\s*admin)/i.test(roleName) || role?.candidate_approval_ceo_sign) {
              if (updatedSigs.ceo.assigned_name !== currentUserName) {
                updatedSigs.ceo.assigned_name = currentUserName;
                changed = true;
              }
            }
          }

          // If current user is HR Manager and Step 2 not signed
          if (updatedSigs.hr_manager && updatedSigs.hr_manager.status !== "approved" && currentUserName) {
            if (/(hr\s*manager|talent\s*manager)/i.test(roleName) || role?.candidate_approval_hr_sign) {
              if (updatedSigs.hr_manager.assigned_name !== currentUserName) {
                updatedSigs.hr_manager.assigned_name = currentUserName;
                changed = true;
              }
            }
          }

          // If current user is HR Admin Director and Step 3 not signed
          if (updatedSigs.division_director && updatedSigs.division_director.status !== "approved" && currentUserName) {
            if (/(hr.*director|division\s*director)/i.test(roleName) || role?.candidate_approval_director_sign) {
              if (updatedSigs.division_director.assigned_name !== currentUserName) {
                updatedSigs.division_director.assigned_name = currentUserName;
                changed = true;
              }
            }
          }

          // If current user is Chairwoman and Step 4 not signed
          if (updatedSigs.chairwoman && updatedSigs.chairwoman.status !== "approved" && currentUserName) {
            if (/(chair|board)/i.test(roleName) || role?.candidate_approval_chairwoman_sign) {
              if (updatedSigs.chairwoman.assigned_name !== currentUserName) {
                updatedSigs.chairwoman.assigned_name = currentUserName;
                changed = true;
              }
            }
          }

          const finalData = changed ? { ...res, signatories: updatedSigs } : res;
          setData(finalData);
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
          if (!mounted) return;
          if (payload.new) {
            setData(payload.new as CandidateApproval);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
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
      const roleName = (role?.name || "").trim();

      const isRoleHolder =
        (stepKey === "ceo" && /(ceo|bu\s*ceo|branch\s*admin)/i.test(roleName)) ||
        (stepKey === "hr_manager" && /(hr\s*manager|talent\s*manager)/i.test(roleName)) ||
        (stepKey === "division_director" && /(hr.*director|division\s*director)/i.test(roleName)) ||
        (stepKey === "chairwoman" && /(chair|board)/i.test(roleName));

      const isDelegated = !isRoleHolder && Boolean(
        currentUserName && currentSig.assigned_name && currentUserName !== currentSig.assigned_name
      );

      const checkedBy = isDelegated
        ? `${currentUserName} (Staff Delegate)`
        : currentUserName;

      const updatedSig: CandidateApprovalSignatory = {
        ...currentSig,
        status: "approved",
        assigned_name: isRoleHolder ? currentUserName : currentSig.assigned_name,
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

  const handleExportWord = useCallback(async () => {
    if (!data) return;
    try {
      await exportCandidateApprovalWord(data);
      toast("Success", "Word document exported successfully.", "success");
    } catch (err) {
      console.error("Failed to export Word document:", err);
      toast("Export Error", "Failed to export Word document.", "error");
    }
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
    handleExportWord,
    handleAdvanceNext,
  };
}
