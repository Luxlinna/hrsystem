import { useOnboardingJourneyMutations } from "./useOnboardingJourneyMutations";
import { useOnboardingDocMutations } from "./useOnboardingDocMutations";
import type { OnboardingRequest, OnboardingDoc, EmployeeOption } from "../types";

interface UseOnboardingMutationsProps {
  requests: OnboardingRequest[];
  documents: OnboardingDoc[];
  employees: EmployeeOption[];
  actorName: string;
  roleName?: string;
  loadData: () => Promise<void>;
  setRequests: React.Dispatch<React.SetStateAction<OnboardingRequest[]>>;
  setExpandedRequest: (id: string | null) => void;
  getDocsForRequestAndStage: (reqId: string, stageKey: string) => OnboardingDoc[];
}

export function useOnboardingMutations({
  requests,
  documents,
  employees,
  actorName,
  roleName = "Unknown",
  loadData,
  setRequests,
  setExpandedRequest,
  getDocsForRequestAndStage,
}: UseOnboardingMutationsProps) {
  const journeyMutations = useOnboardingJourneyMutations({
    requests,
    documents,
    employees,
    actorName,
    roleName,
    loadData,
    setRequests,
    setExpandedRequest,
  });

  const docMutations = useOnboardingDocMutations({
    loadData,
    getDocsForRequestAndStage,
  });

  return {
    ...journeyMutations,
    ...docMutations,
  };
}
