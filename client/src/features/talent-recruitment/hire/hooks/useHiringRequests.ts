import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { HiringRequest, NewHiringRequestFormState, Branch, Job } from "../types";
import { INITIAL_HIRING_REQUEST_FORM } from "../constants";
import { useHiringRequestDecision } from "./useHiringRequestDecision";
import { submitHiringRequest } from "./hiringRequestCreation";

interface UseHiringRequestsProps {
  actorName: string;
  actorRole: string;
  actorEmail?: string;
  myEmployeeId?: string;
  userBranchId?: string | null;
  userBranchName?: string | null;
  targetBranch?: string | null;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  isBranchAdmin?: boolean;
  canBranchApprove?: boolean;
  canChairmanApprove?: boolean;
  canRequest?: boolean;
  loadData: () => Promise<void>;
  branches?: Branch[];
  jobs?: Job[];
}

export function useHiringRequests({
  actorName,
  actorRole,
  actorEmail,
  myEmployeeId,
  userBranchId,
  userBranchName,
  targetBranch,
  isAdmin = false,
  isSuperAdmin = false,
  isBranchAdmin = false,
  canBranchApprove = false,
  canChairmanApprove = false,
  canRequest = true,
  loadData,
  branches = [],
  jobs = [],
}: UseHiringRequestsProps) {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState<NewHiringRequestFormState>(INITIAL_HIRING_REQUEST_FORM);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [hiringRequests, setHiringRequests] = useState<HiringRequest[]>([]);

  const decision = useHiringRequestDecision({
    actorName,
    actorRole,
    userBranchName: userBranchName || undefined,
    loadData,
    canChairmanApprove,
    isSuperAdmin,
  });

  const [editingRequest, setEditingRequest] = useState<HiringRequest | null>(null);

  const openCreateRequest = useCallback((defaultBranchId?: string) => {
    if (!canRequest) {
      toast("Access Restricted", "Only Business Unit Managers and Authorized Leadership can submit hiring requisitions.", "warning");
      return;
    }

    setEditingRequest(null);
    const activeBranchId = defaultBranchId || targetBranch || userBranchId || "";
    const matchedBranch = branches.find((b) => b.id === activeBranchId);
    const resolvedBuName = matchedBranch?.name || userBranchName || "";

    let savedDraft: Partial<NewHiringRequestFormState> = {};
    try {
      const stored = localStorage.getItem("hr_hiring_request_draft");
      if (stored) savedDraft = JSON.parse(stored) || {};
    } catch (err) {
      console.warn("Could not parse draft:", err);
    }

    setRequestForm({
      ...INITIAL_HIRING_REQUEST_FORM,
      company: "UNI",
      business_unit: resolvedBuName,
      branch_id: activeBranchId,
      ...savedDraft,
    });
    setShowRequestModal(true);
  }, [canRequest, branches, targetBranch, userBranchId, userBranchName]);

  const openEditRequest = useCallback((req: HiringRequest) => {
    setEditingRequest(req);
    setRequestForm({
      title: req.title || "",
      position: req.position || req.title || "",
      department: req.department || "",
      division: req.division || "",
      company: req.company || "UNI",
      business_unit: req.business_unit || req.branches?.name || "",
      site: req.site || "",
      branch_id: req.branch_id || "",
      position_type: req.position_type || "new",
      replacement_for_id: req.replacement_for_id || "",
      replacement_for_name: req.replacement_for_name || "",
      location: req.location || "",
      employee_type: req.employee_type || req.employment_type || "FULL-TIME",
      employment_type: req.employment_type || req.employee_type || "FULL-TIME",
      employee_level: req.employee_level || "Senior",
      contract_type: req.contract_type || "1-YEAR FDC",
      target_joining_date: req.target_joining_date || "",
      job_description: req.job_description || "",
      jd_summary: req.jd_summary || "",
      jd_responsibilities: req.jd_responsibilities || "",
      jd_requirements: req.jd_requirements || "",
      jd_qualifications: req.jd_qualifications || "",
      jd_reporting_line: req.jd_reporting_line || "",
      hiring_manager_id: req.hiring_manager_id || "",
      hiring_manager_name: req.hiring_manager_name || "",
      headcount: req.headcount || 1,
      salary_min: req.salary_min != null ? String(req.salary_min) : "",
      salary_max: req.salary_max != null ? String(req.salary_max) : "",
      justification: req.justification || "",
      urgency: req.urgency || "medium",
      assigned_recruiter_id: req.assigned_recruiter_id || req.hr_assigned_to_id || "",
      assigned_recruiter_name: req.assigned_recruiter_name || req.hr_assigned_to_name || "",
    });
    setShowRequestModal(true);
  }, []);

  const handleCreateRequest = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canRequest && !editingRequest) {
        toast("Access Restricted", "Only Business Unit Managers and Authorized Leadership can submit hiring requisitions.", "warning");
        return;
      }
      if (!requestForm.title.trim() || !requestForm.department.trim()) {
        toast("Validation", "Please provide a job title and department.", "error");
        return;
      }

      // Handle Edit Mode Update
      if (editingRequest) {
        setSubmittingRequest(true);
        try {
          const { error } = await supabase
            .from("hiring_requests")
            .update({
              title: requestForm.title.trim(),
              position: requestForm.title.trim(),
              department: requestForm.department.trim(),
              division: requestForm.division || null,
              company: requestForm.company || "UNI",
              business_unit: requestForm.business_unit || null,
              site: requestForm.site || null,
              branch_id: requestForm.branch_id || null,
              position_type: requestForm.position_type || "new",
              replacement_for_id: requestForm.replacement_for_id || null,
              replacement_for_name: requestForm.replacement_for_name || null,
              location: requestForm.location || null,
              employee_type: requestForm.employee_type || requestForm.employment_type || "FULL-TIME",
              employment_type: requestForm.employment_type || requestForm.employee_type || "FULL-TIME",
              employee_level: requestForm.employee_level || "Senior",
              contract_type: requestForm.contract_type || "1-YEAR FDC",
              target_joining_date: requestForm.target_joining_date || null,
              job_description: requestForm.job_description || null,
              jd_summary: requestForm.jd_summary || null,
              jd_responsibilities: requestForm.jd_responsibilities || null,
              jd_requirements: requestForm.jd_requirements || null,
              jd_qualifications: requestForm.jd_qualifications || null,
              jd_reporting_line: requestForm.jd_reporting_line || null,
              hiring_manager_id: requestForm.hiring_manager_id || null,
              hiring_manager_name: requestForm.hiring_manager_name || null,
              headcount: Number(requestForm.headcount) || 1,
              salary_min: requestForm.salary_min ? Number(requestForm.salary_min) : null,
              salary_max: requestForm.salary_max ? Number(requestForm.salary_max) : null,
              justification: requestForm.justification || null,
              urgency: requestForm.urgency || "medium",
              assigned_recruiter_id: requestForm.assigned_recruiter_id || null,
              assigned_recruiter_name: requestForm.assigned_recruiter_name || null,
              hr_assigned_to_id: requestForm.assigned_recruiter_id || null,
              hr_assigned_to_name: requestForm.assigned_recruiter_name || null,
            })
            .eq("id", editingRequest.id);

          if (error) throw error;

          // Update linked job posting if present
          if (editingRequest.job_posting_id) {
            await supabase
              .from("job_postings")
              .update({
                title: requestForm.title.trim(),
                department: requestForm.department.trim(),
                description: requestForm.job_description || requestForm.jd_summary || "",
                headcount: Number(requestForm.headcount) || 1,
                salary_min: requestForm.salary_min ? Number(requestForm.salary_min) : null,
                salary_max: requestForm.salary_max ? Number(requestForm.salary_max) : null,
                employment_type: requestForm.employment_type || "FULL-TIME",
              })
              .eq("id", editingRequest.job_posting_id);
          }

          toast("Requisition Updated", `Hiring requisition ${editingRequest.requisition_id || ""} updated successfully.`, "success");
          setShowRequestModal(false);
          setEditingRequest(null);
          await loadData();
        } catch (err: any) {
          toast("Error", err.message || "Failed to update hiring request", "error");
        } finally {
          setSubmittingRequest(false);
        }
        return;
      }

      setSubmittingRequest(true);
      try {
        const { reqCode, branchName, isBuCeoAdmin } = await submitHiringRequest({
          requestForm,
          actorName,
          actorRole,
          actorEmail,
          myEmployeeId,
          userBranchId,
          userBranchName,
          branches,
          isBranchAdmin,
          canBranchApprove,
        });

        const msg = isBuCeoAdmin
          ? `Requisition ${reqCode} endorsed by BU CEO and forwarded to HR Division.`
          : `Requisition ${reqCode} submitted for ${branchName} leadership review.`;
        toast("Request Submitted", msg, "success");
        setShowRequestModal(false);
        await loadData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to submit hiring request", "error");
      } finally {
        setSubmittingRequest(false);
      }
    },
    [canRequest, editingRequest, requestForm, myEmployeeId, actorName, actorRole, actorEmail, loadData, branches, userBranchId, userBranchName, isBranchAdmin, canBranchApprove]
  );

  const handleDeleteRequest = useCallback(
    async (id: string) => {
      const target = hiringRequests.find((r) => r.id === id);
      const isOwner = Boolean(
        (myEmployeeId && target?.requested_by_id === myEmployeeId) ||
        (actorEmail && target?.requested_by_email?.toLowerCase() === actorEmail.toLowerCase()) ||
        (actorName && target?.requested_by_name?.toLowerCase() === actorName.toLowerCase())
      );

      const canDelete = isOwner || isSuperAdmin;

      if (!canDelete) {
        toast("Permission Denied", "Only the requester (or Super Admin) can delete this hiring requisition. Other reviewers can only reject it.", "error");
        return;
      }

      const reqTitle = target?.requisition_id ? `${target.requisition_id} (${target.title || "Requisition"})` : target?.title || "this hiring requisition";
      if (!confirm(`Are you sure you want to delete ${reqTitle}?\n\nThis will also automatically remove any opening job and associated approvals linked to this requisition.`)) return;

      try {
        const nowIso = new Date().toISOString();
        const relatedJobIds = new Set<string>();
        if (target?.job_posting_id) {
          relatedJobIds.add(target.job_posting_id);
        }

        const targetTitle = (target?.title || "").trim().toLowerCase();
        const targetDept = (target?.department || "").trim().toLowerCase();
        const targetBranchId = target?.branch_id;

        if (targetTitle) {
          jobs.forEach((j) => {
            const jTitle = (j.title || "").trim().toLowerCase();
            const jDept = (j.department || "").trim().toLowerCase();
            if (jTitle === targetTitle) {
              if (!targetDept || !jDept || jDept === targetDept) {
                if (!targetBranchId || !j.branch_id || j.branch_id === targetBranchId) {
                  relatedJobIds.add(j.id);
                }
              }
            }
          });
        }

        const allJobIds = Array.from(relatedJobIds);

        // 1. Find all candidates linked to this requisition or any matched opening job
        let candidateQuery = supabase.from("candidates").select("id").is("deleted_at", null);
        if (allJobIds.length > 0) {
          candidateQuery = candidateQuery.or(`job_posting_id.in.(${allJobIds.join(",")}),hiring_request_id.eq.${id}`);
        } else {
          candidateQuery = candidateQuery.eq("hiring_request_id", id);
        }
        const { data: linkedCandidates } = await candidateQuery;
        const candIds = (linkedCandidates || []).map((c: any) => c.id).filter(Boolean);

        // 2. Cascade delete candidate approvals, applications, interviews, contracts, offers & candidates
        if (candIds.length > 0) {
          await supabase.from("candidate_approvals").delete().in("candidate_id", candIds);
          await supabase.from("candidate_applications").delete().in("candidate_id", candIds);

          try {
            const raw = localStorage.getItem("hrm_candidate_approvals_store");
            if (raw) {
              const list = JSON.parse(raw);
              const remaining = list.filter((a: any) => !candIds.includes(a.candidate_id));
              localStorage.setItem("hrm_candidate_approvals_store", JSON.stringify(remaining));
            }
          } catch {
            // Ignore localStorage errors
          }

          await supabase.from("interviews").update({ deleted_at: nowIso }).in("candidate_id", candIds);
          await supabase.from("candidate_contracts").update({ deleted_at: nowIso }).in("candidate_id", candIds);
          await supabase.from("candidate_offers").update({ deleted_at: nowIso }).in("candidate_id", candIds);
          await supabase.from("candidates").update({ deleted_at: nowIso }).in("id", candIds);
        }

        // 3. Auto-delete all related opening jobs
        if (allJobIds.length > 0) {
          await supabase.from("job_postings").update({
            deleted_at: nowIso,
            status: "closed",
          }).in("id", allJobIds);
          await supabase.from("job_postings").delete().in("id", allJobIds);
        }

        // 4. Clean up approval requests and notifications for this requisition
        await supabase.from("approval_requests").delete().eq("entity_id", id);
        await supabase.from("notifications").delete().or(`hiring_request_id.eq.${id},reference_id.eq.${id}`);

        // 5. Delete the hiring requisition itself
        const { error } = await supabase.from("hiring_requests").update({
          deleted_at: nowIso,
          deleted_by: actorName || actorEmail || "Unknown",
          status: "cancelled",
        }).eq("id", id);

        if (error) {
          const delRes = await supabase.from("hiring_requests").delete().eq("id", id);
          if (delRes.error) throw delRes.error;
        }

        setHiringRequests((prev) => prev.filter((r) => r.id !== id));
        toast("Deleted", "Hiring requisition, opening job, and associated approvals have been deleted.", "info");

        logActivity({
          module: "hire",
          action: "deleted",
          entityType: "hiring_request",
          entityId: id,
          actorName: actorName || "User",
          actorRole: actorRole || "Unknown",
          description: `Deleted hiring requisition ${target?.requisition_id || id} (${target?.title || "Role"}) and associated opening job & approvals`,
        });

        await loadData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to delete request", "error");
      }
    },
    [hiringRequests, jobs, myEmployeeId, actorEmail, actorName, actorRole, isSuperAdmin, loadData, setHiringRequests]
  );

  return {
    showRequestModal,
    setShowRequestModal,
    editingRequest,
    setEditingRequest,
    openEditRequest,
    requestForm,
    setRequestForm,
    submittingRequest,
    hiringRequests,
    setHiringRequests,
    openCreateRequest,
    handleCreateRequest,
    handleDeleteRequest,
    ...decision,
  };
}

