import { useState } from "react";
import type { Shift } from "../types";
import { useShiftCrudMutations } from "./useShiftCrudMutations";
import { useShiftAssignmentMutations } from "./useShiftAssignmentMutations";
import { useShiftScheduleActions } from "./useShiftScheduleActions";

interface UseShiftMutationsProps {
  actorName: string;
  isSuperAdmin: boolean;
  userBranchId: string | null;
  effectiveBranchId: string | null;
  defaultBranchId: string;
  defaultDepartment: string;
  currentDate: Date;
  weekShifts: Shift[];
  filteredShifts: Shift[];
  assignments: any[];
  loadData: () => Promise<void>;
  navigateNext: () => void;
}

export function useShiftMutations({
  actorName,
  isSuperAdmin,
  userBranchId,
  effectiveBranchId,
  defaultBranchId,
  defaultDepartment,
  currentDate,
  weekShifts,
  filteredShifts,
  assignments,
  loadData,
  navigateNext,
}: UseShiftMutationsProps) {
  const [submitting, setSubmitting] = useState(false);

  const crud = useShiftCrudMutations({
    actorName,
    isSuperAdmin,
    userBranchId,
    effectiveBranchId,
    defaultBranchId,
    defaultDepartment,
    currentDate,
    loadData,
    setSubmitting,
  });

  const assignment = useShiftAssignmentMutations({
    actorName,
    selectedShift: crud.selectedShift,
    loadData,
    setSubmitting,
  });

  const schedule = useShiftScheduleActions({
    currentDate,
    weekShifts,
    filteredShifts,
    assignments,
    loadData,
    navigateNext,
    setSubmitting,
  });

  return {
    submitting,
    ...crud,
    ...assignment,
    ...schedule,
  };
}
