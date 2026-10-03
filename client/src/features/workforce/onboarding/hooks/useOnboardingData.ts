import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import { usePermissions } from "@/hooks/usePermissions";
import type { OnboardingRequest, OnboardingDoc, EmployeeOption, HireDocument } from "../types";
import { matchHireDocToOnboardingDoc } from "../utils/hireDocumentUtils";
import { DOC_TO_TASK } from "@/lib/onboarding";

export function useOnboardingData(
  onHighlight: (id: string) => void
) {
  const { role, loading: permLoading } = usePermissions();
  const {
    isSuperAdmin,
    isBranchAdmin,
    isHrDivision,
    effectiveBranchId,
    effectiveBranchName,
    userBranchId,
    userBranchName,
    targetBranch,
    isPartnerBranchBlocked,
    loading: branchLoading,
  } = useBranchScope();

  const hasEnterprisePermission = Boolean(
    isSuperAdmin ||
    role?.hiring_requests_hr_admin_approve ||
    role?.hiring_requests_hr_review ||
    role?.hiring_requests_chairman_approve ||
    isHrDivision
  );

  const isHrDivisionBranch = Boolean(
    /hr\s*division/i.test(effectiveBranchName || "") ||
    /hr\s*division/i.test(userBranchName || "")
  );

  const isAllBranches = !effectiveBranchId || effectiveBranchId === "all";
  const canViewCrossBranch = Boolean(
    hasEnterprisePermission && (isAllBranches || !effectiveBranchId || effectiveBranchId === userBranchId || isHrDivisionBranch)
  );

  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [documents, setDocuments] = useState<OnboardingDoc[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [hireDocumentsByRequestId, setHireDocumentsByRequestId] = useState<Record<string, HireDocument[]>>({});
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const loadData = useCallback(async () => {
    if (branchLoading || permLoading) return;
    if (isPartnerBranchBlocked || (!hasEnterprisePermission && !targetBranch && !userBranchId)) {
      setRequests([]);
      setDocuments([]);
      setEmployees([]);
      setHireDocumentsByRequestId({});
      setLoading(false);
      return;
    }

    try {
      let empQuery = supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, avatar_url, branch_id, branches(name)")
        .is("deleted_at", null)
        .order("first_name");

      const shouldScopeToBranch = !canViewCrossBranch && Boolean(targetBranch && !isHrDivisionBranch);
      if (shouldScopeToBranch && targetBranch) {
        empQuery = empQuery.eq("branch_id", targetBranch);
      }

      const [{ data: emps }, { data: ob }, { data: docs }] = await Promise.all([
        empQuery,
        supabase
          .from("onboarding_requests")
          .select("*, employees(id, first_name, last_name, email, role, department, branch_id, branches(name), candidate_code, candidate_id, location, resume_url, resume_name)")
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("onboarding_documents")
          .select("id, onboarding_request_id, document_name, stage, status, file_url, file_name, notes, due_date, created_at")
          .is("deleted_at", null)
          .order("created_at", { ascending: true }),
      ]);

      const formattedEmps = (emps || []).map((e: any) => ({
        ...e,
        branches: Array.isArray(e.branches) ? e.branches[0] || null : e.branches || null,
      }));

      const currentOb = ob || [];
      const isCrossBranch = canViewCrossBranch || isHrDivisionBranch;
      const filteredRequests = isCrossBranch
        ? (currentOb as unknown as OnboardingRequest[])
        : (currentOb as unknown as OnboardingRequest[]).filter(
            (r) => (r.employees as any)?.branch_id === targetBranch
          );

      const requestIds = new Set(filteredRequests.map((r) => r.id));
      const filteredDocs = (docs || []).filter((d) => requestIds.has(d.onboarding_request_id));

      // Batch-fetch candidate documents for all requests
      const candidateIds = Array.from(
        new Set(
          filteredRequests
            .map((r) => r.employees?.candidate_id)
            .filter((id): id is string => Boolean(id))
        )
      );
      const candidateCodes = Array.from(
        new Set(
          filteredRequests
            .filter((r) => !r.employees?.candidate_id && r.employees?.candidate_code)
            .map((r) => r.employees!.candidate_code)
            .filter((c): c is string => Boolean(c))
        )
      );
      const candidateEmails = Array.from(
        new Set(
          filteredRequests
            .filter((r) => !r.employees?.candidate_id && !r.employees?.candidate_code && r.employees?.email)
            .map((r) => r.employees!.email)
            .filter((em): em is string => Boolean(em))
        )
      );

      let candRows: any[] = [];
      const candQueries: Promise<any[]>[] = [];

      if (candidateIds.length > 0) {
        candQueries.push(
          (async () => {
            const { data } = await supabase
              .from("candidates")
              .select("id, email, candidate_code, full_name, documents, resume_url, resume_name")
              .in("id", candidateIds);
            return data || [];
          })()
        );
      }
      if (candidateCodes.length > 0) {
        candQueries.push(
          (async () => {
            const { data } = await supabase
              .from("candidates")
              .select("id, email, candidate_code, full_name, documents, resume_url, resume_name")
              .in("candidate_code", candidateCodes);
            return data || [];
          })()
        );
      }
      if (candidateEmails.length > 0) {
        candQueries.push(
          (async () => {
            const { data } = await supabase
              .from("candidates")
              .select("id, email, candidate_code, full_name, documents, resume_url, resume_name")
              .in("email", candidateEmails);
            return data || [];
          })()
        );
      }

      if (candQueries.length > 0) {
        const results = await Promise.all(candQueries);
        candRows = results.flat();
      }

      const candById = new Map<string, any>();
      const candByCode = new Map<string, any>();
      const candByEmail = new Map<string, any>();

      candRows.forEach((c) => {
        if (c.id) candById.set(c.id, c);
        if (c.candidate_code) candByCode.set(c.candidate_code, c);
        if (c.email) candByEmail.set(c.email.toLowerCase(), c);
      });

      const hireDocsMap: Record<string, import("../types").HireDocument[]> = {};

      filteredRequests.forEach((req) => {
        const emp = req.employees;
        const cand =
          (emp?.candidate_id ? candById.get(emp.candidate_id) : null) ||
          (emp?.candidate_code ? candByCode.get(emp.candidate_code) : null) ||
          (emp?.email ? candByEmail.get(emp.email.toLowerCase()) : null);

        const list: import("../types").HireDocument[] = [];

        if (cand) {
          const rawDocs = Array.isArray(cand.documents) ? cand.documents : [];
          rawDocs.forEach((d: any) => {
            if (!d || !d.url) return;
            list.push({
              name: d.name || "Candidate Document",
              url: d.url,
              size: d.size,
              type: d.type,
              uploaded_at: d.uploaded_at,
              stage_key: d.stage_key,
              notes: d.notes,
              doc_slot_key: d.doc_slot_key,
              verification_status: d.verification_status || "uploaded",
              rejection_reason: d.rejection_reason,
              reviewed_by: d.reviewed_by,
              reviewed_at: d.reviewed_at,
            });
          });

          if (cand.resume_url && !list.some((d) => d.url === cand.resume_url)) {
            list.unshift({
              name: cand.resume_name || "Resume / CV",
              url: cand.resume_url,
              type: "application/pdf",
              notes: "Submitted with job application",
              doc_slot_key: "resume",
              verification_status: "verified",
            });
          }
        }

        if (emp?.resume_url && !list.some((d) => d.url === emp.resume_url)) {
          list.unshift({
            name: emp.resume_name || "Resume / CV",
            url: emp.resume_url,
            type: "application/pdf",
            notes: "Employee resume on file",
            doc_slot_key: "resume",
            verification_status: "verified",
          });
        }

        if (list.length > 0) {
          hireDocsMap[req.id] = list;
        }
      });

      // Auto-bridge matching hire documents into pending onboarding documents
      const docsToUpdate: { docId: string; fileUrl: string; fileName: string; notes: string; reqId: string; taskName: string }[] = [];
      const updatedDocs = filteredDocs.map((doc) => {
        if (doc.stage === "document" && (doc.status !== "complete" || !doc.file_url)) {
          const hireDocs = hireDocsMap[doc.onboarding_request_id] || [];
          const match = matchHireDocToOnboardingDoc(doc.document_name, hireDocs);
          if (match && match.url) {
            const taskName = DOC_TO_TASK[doc.document_name] || doc.document_name;
            docsToUpdate.push({
              docId: doc.id,
              fileUrl: match.url,
              fileName: match.name,
              notes: match.notes || `Transferred from candidate recruitment (${match.name})`,
              reqId: doc.onboarding_request_id,
              taskName,
            });
            return {
              ...doc,
              status: "complete",
              file_url: match.url,
              file_name: match.name,
              notes: match.notes || `Transferred from candidate recruitment (${match.name})`,
            };
          }
        }
        return doc;
      });

      if (docsToUpdate.length > 0) {
        Promise.all(
          docsToUpdate.map(async (item) => {
            await supabase
              .from("onboarding_documents")
              .update({
                status: "complete",
                file_url: item.fileUrl,
                file_name: item.fileName,
                notes: item.notes,
              })
              .eq("id", item.docId);

            await supabase
              .from("onboarding_checklist_tasks")
              .update({ completed: true, completed_at: new Date().toISOString() })
              .eq("onboarding_request_id", item.reqId)
              .eq("task_name", item.taskName)
              .is("deleted_at", null);
          })
        ).catch((e) => console.error("Error auto-bridging hire docs:", e));
      }

      setRequests(filteredRequests);
      setDocuments(updatedDocs);
      setEmployees(formattedEmps);
      setHireDocumentsByRequestId(hireDocsMap);
    } catch (err) {
      console.error("Failed to load onboarding data:", err);
    } finally {
      setLoading(false);
    }
  }, [
    branchLoading, permLoading, isPartnerBranchBlocked, targetBranch, canViewCrossBranch,
    isHrDivisionBranch, hasEnterprisePermission, userBranchId
  ]);

  useEffect(() => {
    loadData();
    const ch = supabase
      .channel("onboarding-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "onboarding_requests" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "onboarding_documents" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => loadData())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [loadData]);

  // Scoped requests: when viewing a specific branch, strictly scope to targetBranch
  const scopedRequests = useMemo(() => {
    if (canViewCrossBranch || isHrDivisionBranch) {
      return requests;
    }
    const target = targetBranch || userBranchId;
    if (!target) return [];
    return requests.filter((r) => {
      const bId = (r.employees as any)?.branch_id;
      return bId === target;
    });
  }, [requests, targetBranch, userBranchId, canViewCrossBranch, isHrDivisionBranch]);

  // Scoped employees: when viewing a specific branch, strictly scope to targetBranch
  const scopedEmployees = useMemo(() => {
    if (canViewCrossBranch || isHrDivisionBranch) {
      return employees;
    }
    const target = targetBranch || userBranchId;
    if (!target) return [];
    return employees.filter((e: any) => e.branch_id === target);
  }, [employees, targetBranch, userBranchId, canViewCrossBranch, isHrDivisionBranch]);

  // Handle URL highlight param
  useEffect(() => {
    if (!highlightId || scopedRequests.length === 0) return;
    if (!scopedRequests.some((r) => r.id === highlightId)) return;
    onHighlight(highlightId);
    const t = setTimeout(() => {
      const el = document.getElementById(`onboarding-request-${highlightId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    }, 150);
    return () => clearTimeout(t);
  }, [highlightId, scopedRequests, onHighlight]);

  return {
    isPartnerBranchBlocked,
    userBranchId,
    userBranchName,
    targetBranch,
    isHrDivisionScope: canViewCrossBranch,
    requests: scopedRequests,
    allRequests: requests,
    setRequests,
    documents,
    employees: scopedEmployees,
    hireDocumentsByRequestId,
    loading,
    loadData,
  };
}
