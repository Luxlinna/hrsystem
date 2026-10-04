import { useJobMutations } from "./useJobMutations";
import { useCandidateMutations } from "./useCandidateMutations";
import { useInterviewMutations } from "./useInterviewMutations";

interface UseHireMutationsProps {
  actorName: string;
  actorRole: string;
  loadData: () => Promise<void>;
}

export function useHireMutations({
  actorName,
  actorRole,
  loadData,
}: UseHireMutationsProps) {
  const jobMutations = useJobMutations({ actorName, loadData });
  const candidateMutations = useCandidateMutations({ actorName, actorRole, loadData });
  const interviewMutations = useInterviewMutations({ actorName, loadData });

  return {
    ...jobMutations,
    ...candidateMutations,
    ...interviewMutations,
  };
}
