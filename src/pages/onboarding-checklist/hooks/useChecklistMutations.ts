import { useChecklistTaskMutations } from "./useChecklistTaskMutations";
import { useChecklistHireMutations } from "./useChecklistHireMutations";
import type { OnboardingHire, ChecklistTask } from "../types";

interface UseChecklistMutationsProps {
  selectedHire: OnboardingHire | null;
  hireTasks: ChecklistTask[];
  completerName: string;
  isTaskLocked: (task: ChecklistTask) => boolean;
  loadData: () => Promise<void>;
  setTasks: React.Dispatch<React.SetStateAction<ChecklistTask[]>>;
  setSelectedHire: React.Dispatch<React.SetStateAction<OnboardingHire | null>>;
  setHires: React.Dispatch<React.SetStateAction<OnboardingHire[]>>;
}

export function useChecklistMutations({
  selectedHire,
  hireTasks,
  completerName,
  isTaskLocked,
  loadData,
  setTasks,
  setSelectedHire,
  setHires,
}: UseChecklistMutationsProps) {
  const taskMutations = useChecklistTaskMutations({
    selectedHire,
    hireTasks,
    completerName,
    isTaskLocked,
    loadData,
    setTasks,
  });

  const hireMutations = useChecklistHireMutations({
    selectedHire,
    completerName,
    setSelectedHire,
    setHires,
    loadData,
  });

  return {
    ...taskMutations,
    ...hireMutations,
  };
}
