import { useMemo, useCallback } from "react";
import type { OnboardingRequest, OnboardingDoc, EmployeeOption } from "../types";
import { STAGES } from "../constants";

export function useOnboardingCalculations(
  requests: OnboardingRequest[],
  documents: OnboardingDoc[],
  employees: EmployeeOption[],
  empSearch: string
) {
  const getDocsForRequestAndStage = useCallback(
    (reqId: string, stageKey: string) =>
      documents.filter((d) => d.onboarding_request_id === reqId && d.stage === stageKey),
    [documents]
  );

  const getStageProgress = useCallback(
    (reqId: string, stageKey: string) => {
      const docs = getDocsForRequestAndStage(reqId, stageKey);
      if (docs.length === 0) return 0;
      return Math.round(
        (docs.filter((d) => d.status === "complete").length / docs.length) * 100
      );
    },
    [getDocsForRequestAndStage]
  );

  const isStageComplete = useCallback(
    (reqId: string, stageKey: string) => {
      const docs = getDocsForRequestAndStage(reqId, stageKey);
      return docs.length > 0 && docs.every((d) => d.status === "complete");
    },
    [getDocsForRequestAndStage]
  );

  const isDocOverdue = useCallback((doc: OnboardingDoc) => {
    if (doc.status === "complete" || !doc.due_date) return false;
    return new Date(doc.due_date) < new Date();
  }, []);

  // Eligible employees who have not been onboarded yet
  const onboardedEmployeeIds = useMemo(
    () => new Set(requests.map((r) => r.employee_id)),
    [requests]
  );

  const eligibleEmployees = useMemo(
    () => employees.filter((e) => !onboardedEmployeeIds.has(e.id)),
    [employees, onboardedEmployeeIds]
  );

  const filteredEligibleEmployees = useMemo(() => {
    if (!empSearch.trim()) return eligibleEmployees;
    const q = empSearch.toLowerCase();
    return eligibleEmployees.filter(
      (e) =>
        e.first_name.toLowerCase().includes(q) ||
        e.last_name.toLowerCase().includes(q) ||
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
        (e.role && e.role.toLowerCase().includes(q)) ||
        (e.department && e.department.toLowerCase().includes(q)) ||
        (e.branches?.name && e.branches.name.toLowerCase().includes(q))
    );
  }, [eligibleEmployees, empSearch]);

  // Operational metrics
  const totalActive = useMemo(
    () => requests.filter((r) => r.status !== "completed").length,
    [requests]
  );

  const pendingApproval = useMemo(
    () => requests.filter((r) => r.status === "pending").length,
    [requests]
  );

  const inDocStage = useMemo(
    () => requests.filter((r) => r.status === "approved" && r.stage === "document").length,
    [requests]
  );

  const completed = useMemo(
    () => requests.filter((r) => r.status === "completed").length,
    [requests]
  );

  return {
    getDocsForRequestAndStage,
    getStageProgress,
    isStageComplete,
    isDocOverdue,
    eligibleEmployees,
    filteredEligibleEmployees,
    totalActive,
    pendingApproval,
    inDocStage,
    completed,
  };
}
