import { useState } from "react";
import type { Course, Employee, Branch, Enrollment } from "../types";
import { useCourseMutations } from "./useCourseMutations";
import { useEnrollmentMutations } from "./useEnrollmentMutations";

interface UseTrainingMutationsProps {
  actorName: string;
  canManage: boolean;
  isSuperAdmin: boolean;
  effectiveBranchId: string | null;
  userBranchId: string | null;
  branches: Branch[];
  courses: Course[];
  employees: Employee[];
  enrollments?: Enrollment[];
  fetchData: () => Promise<void>;
}

export function useTrainingMutations({
  actorName,
  canManage,
  isSuperAdmin,
  effectiveBranchId,
  userBranchId,
  courses,
  enrollments = [],
  fetchData,
}: UseTrainingMutationsProps) {
  const [saving, setSaving] = useState(false);

  const courseMutations = useCourseMutations({
    actorName,
    canManage,
    isSuperAdmin,
    effectiveBranchId,
    userBranchId,
    enrollments,
    fetchData,
    setSaving,
  });

  const enrollmentMutations = useEnrollmentMutations({
    canManage,
    courses,
    fetchData,
    setSaving,
  });

  return {
    saving,
    ...courseMutations,
    ...enrollmentMutations,
  };
}
