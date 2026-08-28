import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import type { OnboardingRequest, OnboardingDoc, EmployeeOption } from "../types";

export function useOnboardingData(
  onHighlight: (id: string) => void
) {
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId, userBranchName } = useBranchScope();

  // Partner Privacy Rule: Super Admin or any user CANNOT access other partner branches' onboarding pipeline.
  // Access is strictly confined to the user's home branch (userBranchId).
  const isPartnerBranchBlocked = Boolean(
    !userBranchId || (effectiveBranchId && effectiveBranchId !== userBranchId)
  );
  const targetBranch = isPartnerBranchBlocked ? null : userBranchId;

  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [documents, setDocuments] = useState<OnboardingDoc[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const loadData = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setRequests([]);
      setDocuments([]);
      setEmployees([]);
      setLoading(false);
      return;
    }

    try {
      const [{ data: emps }, { data: ob }, { data: docs }] = await Promise.all([
        supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, avatar_url, branch_id, branches(name)")
          .eq("branch_id", targetBranch)
          .is("deleted_at", null)
          .order("first_name"),
        supabase
          .from("onboarding_requests")
          .select("*, employees(first_name, last_name, role, department, branch_id, branches(name))")
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

      const filteredRequests = ((ob || []) as unknown as OnboardingRequest[]).filter(
        (r) => empIds.has(r.employee_id) || (r.employees as any)?.branch_id === targetBranch
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
  }, [isPartnerBranchBlocked, targetBranch]);

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

  // Scoped requests
  const scopedRequests = useMemo(() => {
    const targetBranch = effectiveBranchId || (isBranchAdmin ? userBranchId : null);
    if (!targetBranch) return requests;
    return requests.filter((r) => (r.employees as any)?.branch_id === targetBranch);
  }, [requests, effectiveBranchId, isBranchAdmin, userBranchId]);

  // Scoped employees
  const scopedEmployees = useMemo(() => {
    const targetBranch = effectiveBranchId || (isBranchAdmin ? userBranchId : null);
    if (!targetBranch) return employees;
    return employees.filter((e: any) => e.branch_id === targetBranch);
  }, [employees, effectiveBranchId, isBranchAdmin, userBranchId]);

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
