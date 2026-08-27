import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { notify } from "@/lib/notify";
import type { Course, CourseFormState, Enrollment, Employee } from "../types";
import { emptyCourseForm } from "../constants";

interface UseTrainingMutationsProps {
  actorName: string;
  canManage: boolean;
  courses: Course[];
  employees: Employee[];
  fetchData: () => Promise<void>;
}

export function useTrainingMutations({
  actorName,
  canManage,
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

  const openNewCourse = () => {
    setEditingCourseId(null);
    setNewCourse(emptyCourseForm);
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
    });
    setEditingCourseId(course.id);
    setSelectedCourse(null);
    setShowCourseModal(true);
  };

  const openEnroll = (courseId?: string) => {
    setEnrollCourseId(courseId || courses[0]?.id || null);
    setEnrollEmployeeIds([]);
    setEnrollDueDate("");
    setShowEnrollModal(true);
  };

  const saveCourse = useCallback(async () => {
    if (!newCourse.title.trim() || !canManage) return;
    setSaving(true);
    const payload = {
      title: newCourse.title.trim(),
      description: newCourse.description || null,
      category: newCourse.category,
      duration_hours: newCourse.duration_hours ? parseFloat(newCourse.duration_hours) : null,
      instructor: newCourse.instructor || null,
      format: newCourse.format,
      status: newCourse.status,
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
  }, [newCourse, canManage, editingCourseId, fetchData]);

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
      toast("Deleted", `"${course.title}" moved to Recycle Bin.`, "success");
      setSelectedCourse(null);
      await fetchData();
    },
    [canManage, actorName, fetchData]
  );

  const saveEnrollment = useCallback(async () => {
    if (!enrollCourseId || enrollEmployeeIds.length === 0) return;
    setSaving(true);
    const payload = enrollEmployeeIds.map((empId) => ({
      course_id: enrollCourseId,
      employee_id: empId,
      due_date: enrollDueDate || null,
      status: "enrolled",
      progress: 0,
    }));
    const { error } = await supabase.from("training_enrollments").insert(payload);
    setSaving(false);
    if (error) {
      toast("Error", "Failed to enroll employees", "error");
      return;
    }

    const course = courses.find((item) => item.id === enrollCourseId);
    const enrolledEmployees = employees.filter((employee) =>
      enrollEmployeeIds.includes(employee.id)
    );

    await Promise.allSettled(
      enrolledEmployees.map((employee) =>
        notify({
          recipientUserId: employee.id,
          type: "info",
          source: "training",
          title: "New Training Course Assigned",
          message: `You have been enrolled in "${course?.title || "a new course"}".`,
          entityId: enrollCourseId,
        })
      )
    );

    toast("Success", `Enrolled ${enrollEmployeeIds.length} employee(s)`, "success");
    setShowEnrollModal(false);
    setEnrollEmployeeIds([]);
    await fetchData();
  }, [enrollCourseId, enrollEmployeeIds, enrollDueDate, courses, employees, fetchData]);

  const updateEnrollment = useCallback(
    async (id: string, updates: Partial<Enrollment>) => {
      const { error } = await supabase.from("training_enrollments").update(updates).eq("id", id);
      if (error) {
        toast("Error", "Failed to update enrollment", "error");
        return;
      }
      toast("Success", "Enrollment updated", "success");
      await fetchData();
    },
    [fetchData]
  );

  const deleteEnrollment = useCallback(
    async (enrollment: Enrollment) => {
      if (!canManage) return;
      if (
        !confirm(
          "Remove this enrollment record? It will be moved to the Recycle Bin and can be restored later."
        )
      )
        return;
      const { error } = await supabase
        .from("training_enrollments")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", enrollment.id);
      if (error) {
        toast("Error", "Failed to remove enrollment", "error");
        return;
      }
      toast("Removed", "Enrollment moved to Recycle Bin.", "success");
      await fetchData();
    },
    [canManage, actorName, fetchData]
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
