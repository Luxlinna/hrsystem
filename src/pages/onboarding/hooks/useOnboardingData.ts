import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import type { OnboardingRequest, OnboardingDoc, EmployeeOption } from "../types";

import { startOnboardingForCandidate, startOnboardingForEmployee } from "@/lib/onboarding";

export function useOnboardingData(
  onHighlight: (id: string) => void
) {
  const {
    isSuperAdmin,
    isBranchAdmin,
    isHrDivision,
    effectiveBranchId,
    effectiveBranchName,
    userBranchId,
    userBranchName,
    targetBranch,
    isPartnerBranchBlocked
  } = useBranchScope();

  const isHrDivisionScope = Boolean(
    isHrDivision ||
    /hr\s*division|human\s*resource/i.test(effectiveBranchName || "") ||
    /hr\s*division|human\s*resource/i.test(userBranchName || "")
  );

  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [documents, setDocuments] = useState<OnboardingDoc[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const loadData = useCallback(async () => {
    if (isPartnerBranchBlocked || (!isSuperAdmin && !isHrDivisionScope && !targetBranch)) {
      setRequests([]);
      setDocuments([]);
      setEmployees([]);
      setLoading(false);
      return;
    }

    try {
      let empQuery = supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, avatar_url, branch_id, branches(name)")
        .is("deleted_at", null)
        .order("first_name");

      // HR Division and Super Admin can view/enroll employees across all branches.
      // Other BUs without HR Division are strictly limited to their own branch.
      if (!isSuperAdmin && !isHrDivisionScope && targetBranch) {
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
      const empIds = new Set(formattedEmps.map((e: any) => e.id));

      const currentOb = ob || [];
      const filteredRequests = (isSuperAdmin || isHrDivisionScope)
        ? (currentOb as unknown as OnboardingRequest[])
        : (currentOb as unknown as OnboardingRequest[]).filter(
            (r) => (r.employees as any)?.branch_id === targetBranch
          );

      const requestIds = new Set(filteredRequests.map((r) => r.id));
      const filteredDocs = (docs || []).filter((d) => requestIds.has(d.onboarding_request_id));

      setRequests(filteredRequests);
      setDocuments(filteredDocs);
      setEmployees(formattedEmps);
    } catch (err) {
      console.error("Failed to load onboarding data:", err);
    } finally {
      setLoading(false);
    }
  }, [isPartnerBranchBlocked, targetBranch, isSuperAdmin, isHrDivisionScope]);

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

  // Scoped requests (page-level branch filtering is handled by useOnboardingFilters)
  const scopedRequests = useMemo(() => {
    if (isSuperAdmin || isHrDivisionScope) {
      return requests;
    }
    const target = targetBranch || userBranchId;
    if (!target) return [];
    return requests.filter((r) => {
      const bId = (r.employees as any)?.branch_id;
      return bId === target;
    });
  }, [requests, targetBranch, userBranchId, isSuperAdmin, isHrDivisionScope]);

  // Scoped employees
  const scopedEmployees = useMemo(() => {
    if (isSuperAdmin || isHrDivisionScope) {
      return employees;
    }
    const target = targetBranch || userBranchId;
    if (!target) return [];
    return employees.filter((e: any) => e.branch_id === target);
  }, [employees, targetBranch, userBranchId, isSuperAdmin, isHrDivisionScope]);

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
    requests: scopedRequests,
    allRequests: requests,
    setRequests,
    documents,
    employees: scopedEmployees,
    loading,
    loadData,
  };
}
