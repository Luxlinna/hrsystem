import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { notify } from "@/lib/notify";
import type { Course, Enrollment } from "../types";

interface UseEnrollmentMutationsProps {
  canManage: boolean;
  courses: Course[];
  fetchData: () => Promise<void>;
  setSaving: (v: boolean) => void;
}

export function useEnrollmentMutations({
  canManage,
  courses,
  fetchData,
  setSaving,
}: UseEnrollmentMutationsProps) {
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCourseId, setEnrollCourseId] = useState<string | null>(null);
  const [enrollEmployeeIds, setEnrollEmployeeIds] = useState<string[]>([]);
  const [enrollDueDate, setEnrollDueDate] = useState("");

  const openEnroll = (courseId?: string) => {
    if (!canManage) {
      toast("Permission Denied", "Only administrators and managers can enroll employees.", "error");
      return;
    }
    setEnrollCourseId(courseId || courses[0]?.id || null);
    setEnrollEmployeeIds([]);
    setEnrollDueDate("");
    setShowEnrollModal(true);
  };

  const saveEnrollment = useCallback(async () => {
    if (!enrollCourseId || enrollEmployeeIds.length === 0 || !canManage) return;
    setSaving(true);

    const records = enrollEmployeeIds.map((empId) => ({
      course_id: enrollCourseId,
      employee_id: empId,
      status: "enrolled",
      progress: 0,
      due_date: enrollDueDate || null,
    }));

    const { error } = await supabase.from("training_enrollments").insert(records);
    setSaving(false);
    if (error) {
      toast("Error", "Failed to enroll employees", "error");
      return;
    }

    const courseName = courses.find((c) => c.id === enrollCourseId)?.title || "a training course";
    notify({
      title: `Enrolled in: ${courseName}`,
      message: `Enrolled in training course "${courseName}"${
        enrollDueDate ? ` with due date ${enrollDueDate}` : ""
      }.`,
      type: "info",
      source: "training",
      entityId: enrollCourseId,
    });

    toast("Success", `Enrolled ${enrollEmployeeIds.length} employee(s)`, "success");
    setShowEnrollModal(false);
    setEnrollCourseId(null);
    setEnrollEmployeeIds([]);
    setEnrollDueDate("");
    await fetchData();
  }, [enrollCourseId, enrollEmployeeIds, canManage, enrollDueDate, courses, fetchData, setSaving]);

  const updateEnrollment = useCallback(
    async (id: string, updates: Partial<Enrollment>) => {
      if (!canManage) return;
      const { error } = await supabase.from("training_enrollments").update(updates).eq("id", id);
      if (error) {
        toast("Error", "Failed to update enrollment", "error");
        return;
      }
      toast("Success", "Enrollment updated", "success");
      await fetchData();
    },
    [canManage, fetchData]
  );

  const deleteEnrollment = useCallback(
    async (enrollment: Enrollment) => {
      if (!canManage) return;
      if (!confirm("Remove this enrollment? It will be moved to the Recycle Bin.")) return;
      const { error } = await supabase
        .from("training_enrollments")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", enrollment.id);
      if (error) {
        toast("Error", "Failed to remove enrollment", "error");
        return;
      }
      toast("Success", "Enrollment removed", "success");
      await fetchData();
    },
    [canManage, fetchData]
  );

  return {
    showEnrollModal,
    setShowEnrollModal,
    enrollCourseId,
    setEnrollCourseId,
    enrollEmployeeIds,
    setEnrollEmployeeIds,
    enrollDueDate,
    setEnrollDueDate,
    openEnroll,
    saveEnrollment,
    updateEnrollment,
    deleteEnrollment,
  };
}
