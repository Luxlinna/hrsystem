import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { notify } from "@/lib/notify";
import type { Course, CourseFormState, Enrollment, Employee, Branch } from "../types";
import { emptyCourseForm } from "../constants";

interface UseTrainingMutationsProps {
  actorName: string;
  canManage: boolean;
  isSuperAdmin: boolean;
  effectiveBranchId: string | null;
  userBranchId: string | null;
  branches: Branch[];
  courses: Course[];
  employees: Employee[];
  fetchData: () => Promise<void>;
}

export function useTrainingMutations({
  actorName,
  canManage,
  isSuperAdmin,
  effectiveBranchId,
  userBranchId,
  branches,
  courses,
  employees,
  fetchData,
}: UseTrainingMutationsProps) {
  const [saving, setSaving] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [newCourse, setNewCourse] = useState<CourseFormState>(emptyCourseForm);

  const [enrollCourseId, setEnrollCourseId] = useState<string | null>(null);
  const [enrollEmployeeIds, setEnrollEmployeeIds] = useState<string[]>([]);
  const [enrollDueDate, setEnrollDueDate] = useState("");

  const targetBranch = effectiveBranchId || userBranchId || "";

  const openNewCourse = () => {
    if (!canManage) {
      toast("Permission Denied", "Only administrators and managers can create training courses.", "error");
      return;
    }
    setEditingCourseId(null);
    setNewCourse({
      ...emptyCourseForm,
      is_admin_course: isSuperAdmin && !effectiveBranchId,
      branch_id: targetBranch,
    });
    setShowCourseModal(true);
  };

  const openEditCourse = (course: Course) => {
    if (!canManage) return;
    setNewCourse({
      title: course.title,
      description: course.description || "",
      category: course.category,
      duration_hours: course.duration_hours != null ? String(course.duration_hours) : "",
      instructor: course.instructor || "",
      format: course.format,
      status: course.status,
      branch_id: course.branch_id || targetBranch,
      is_admin_course: !course.branch_id,
    });
    setEditingCourseId(course.id);
    setSelectedCourse(null);
    setShowCourseModal(true);
  };

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

  const saveCourse = useCallback(async () => {
    if (!newCourse.title.trim() || !canManage) return;
    setSaving(true);

    const resolvedBranchId = newCourse.is_admin_course ? null : (newCourse.branch_id || targetBranch || null);

    const payload = {
      title: newCourse.title.trim(),
      description: newCourse.description || null,
      category: newCourse.category,
      duration_hours: newCourse.duration_hours ? parseFloat(newCourse.duration_hours) : null,
      instructor: newCourse.instructor || null,
      format: newCourse.format,
      status: newCourse.status,
      branch_id: resolvedBranchId,
    };

    const { error } = editingCourseId
      ? await supabase.from("training_courses").update(payload).eq("id", editingCourseId)
      : await supabase.from("training_courses").insert(payload);

    setSaving(false);
    if (error) {
      toast("Error", "Failed to save course", "error");
      return;
    }
    toast("Success", editingCourseId ? "Course updated" : "Course created", "success");
    setShowCourseModal(false);
    setEditingCourseId(null);
    setNewCourse(emptyCourseForm);
    await fetchData();
  }, [newCourse, canManage, targetBranch, editingCourseId, fetchData]);

  const deleteCourse = useCallback(
    async (course: Course) => {
      if (!canManage) return;
      if (
        !confirm(
          `Delete "${course.title}"? It will be moved to the Recycle Bin and can be restored later.`
        )
      )
        return;
      const { error } = await supabase
        .from("training_courses")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", course.id);
      if (error) {
        toast("Error", "Failed to delete course", "error");
        return;
      }
      toast("Success", "Course moved to recycle bin", "success");
      setSelectedCourse(null);
      await fetchData();
    },
    [canManage, actorName, fetchData]
  );

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
  }, [enrollCourseId, enrollEmployeeIds, canManage, enrollDueDate, courses, fetchData]);

  const updateEnrollment = useCallback(
    async (id: string, updates: Partial<Enrollment>) => {
      if (!canManage) return;
      const { error } = await supabase
        .from("training_enrollments")
        .update(updates)
        .eq("id", id);
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
    saving,
    selectedCourse,
    setSelectedCourse,
    showCourseModal,
    setShowCourseModal,
    showEnrollModal,
    setShowEnrollModal,
    editingCourseId,
    newCourse,
    setNewCourse,
    enrollCourseId,
    setEnrollCourseId,
    enrollEmployeeIds,
    setEnrollEmployeeIds,
    enrollDueDate,
    setEnrollDueDate,
    openNewCourse,
    openEditCourse,
    openEnroll,
    saveCourse,
    deleteCourse,
    saveEnrollment,
    updateEnrollment,
    deleteEnrollment,
  };
}
