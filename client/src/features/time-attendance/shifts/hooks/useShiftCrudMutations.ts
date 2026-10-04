import { useShiftCreateEditMutations } from "./useShiftCreateEditMutations";
import { useShiftDuplicateDeleteMutations } from "./useShiftDuplicateDeleteMutations";

interface UseShiftCrudMutationsProps {
  actorName: string;
  isSuperAdmin: boolean;
  userBranchId: string | null;
  effectiveBranchId: string | null;
  defaultBranchId: string;
  defaultDepartment: string;
  currentDate: Date;
  loadData: () => Promise<void>;
  setSubmitting: (v: boolean) => void;
}

export function useShiftCrudMutations({
  actorName,
  isSuperAdmin,
  userBranchId,
  effectiveBranchId,
  defaultBranchId,
  defaultDepartment,
  currentDate,
  loadData,
  setSubmitting,
}: UseShiftCrudMutationsProps) {
  const dupDel = useShiftDuplicateDeleteMutations({
    actorName,
    loadData,
    setSubmitting,
  });

  const createEdit = useShiftCreateEditMutations({
    isSuperAdmin,
    userBranchId,
    effectiveBranchId,
    defaultBranchId,
    defaultDepartment,
    currentDate,
    loadData,
    setSubmitting,
    setSelectedShift: dupDel.setSelectedShift,
    selectedShift: dupDel.selectedShift,
  });

  return {
    ...dupDel,
    ...createEdit,
  };
}
