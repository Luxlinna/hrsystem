import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { OnboardingRequest, OnboardingDoc, EmployeeOption } from "../types";

export function useOnboardingData(
  onHighlight: (id: string) => void
) {
  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [documents, setDocuments] = useState<OnboardingDoc[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const loadData = useCallback(async () => {
    try {
      const [{ data: ob }, { data: docs }, { data: emps }] = await Promise.all([
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
        supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, avatar_url, branches(name)")
          .is("deleted_at", null)
          .order("first_name"),
      ]);
      setRequests((ob as unknown as OnboardingRequest[]) || []);
      setDocuments(docs || []);
      const formattedEmps = (emps || []).map((e: any) => ({
        ...e,
        branches: Array.isArray(e.branches) ? e.branches[0] || null : e.branches || null,
      }));
      setEmployees(formattedEmps);
    } catch (err) {
      console.error("Failed to load onboarding data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Handle URL highlight param
  useEffect(() => {
    if (!highlightId || requests.length === 0) return;
    if (!requests.some((r) => r.id === highlightId)) return;
    onHighlight(highlightId);
    const t = setTimeout(() => {
      const el = document.getElementById(`onboarding-request-${highlightId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    }, 150);
    return () => clearTimeout(t);
  }, [highlightId, requests, onHighlight]);

  return {
    requests,
    setRequests,
    documents,
    employees,
    loading,
    loadData,
  };
}
