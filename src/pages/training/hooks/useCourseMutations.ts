import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { Course, CourseFormState } from "../types";
import { emptyCourseForm } from "../constants";

interface UseCourseMutationsProps {
  actorName: string;
  canManage: boolean;
  isSuperAdmin: boolean;
  effectiveBranchId: string | null;
  userBranchId: string | null;
  fetchData: () => Promise<void>;
  setSaving: (v: boolean) => void;
}

export function useCourseMutations({
  actorName,
  canManage,
  isSuperAdmin,
  effectiveBranchId,
  userBranchId,
  fetchData,
  setSaving,
}: UseCourseMutationsProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [newCourse, setNewCourse] = useState<CourseFormState>(emptyCourseForm);

  const targetBranch = effectiveBranchId || userBranchId || "";

  const openNewCourse = (initialDate?: string) => {
    if (!canManage) {
      toast("Permission Denied", "Only administrators and managers can create training courses.", "error");
      return;
    }
    setEditingCourseId(null);
    setNewCourse({
      ...emptyCourseForm,
      is_admin_course: isSuperAdmin && !effectiveBranchId,
      branch_id: targetBranch,
      scheduled_date: initialDate || new Date().toISOString().slice(0, 10),
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
      scheduled_date: course.scheduled_date || "",
      start_time: course.start_time || "09:00",
      end_time: course.end_time || "11:00",
      location: course.location || "",
      invited_employee_ids: [],
    });
    setEditingCourseId(course.id);
    setSelectedCourse(null);
    setShowCourseModal(true);
  };

  const saveCourse = useCallback(async () => {
    if (!newCourse.title.trim() || !canManage) return;
    setSaving(true);

    const resolvedBranchId = newCourse.is_admin_course ? null : (newCourse.branch_id || targetBranch || null);

    const payload: Record<string, any> = {
      title: newCourse.title.trim(),
      description: newCourse.description || null,
      category: newCourse.category,
      duration_hours: newCourse.duration_hours ? parseFloat(newCourse.duration_hours) : null,
      instructor: newCourse.instructor || null,
      format: newCourse.format,
      status: newCourse.status,
      branch_id: resolvedBranchId,
      scheduled_date: newCourse.scheduled_date || null,
      start_time: newCourse.start_time || null,
      end_time: newCourse.end_time || null,
      location: newCourse.location || null,
    };

    if (!editingCourseId) {
      payload.created_by_name = actorName;
    }

    let resData: any = null;
    const { data, error } = editingCourseId
      ? await supabase.from("training_courses").update(payload).eq("id", editingCourseId).select().single()
      : await supabase.from("training_courses").insert(payload).select().single();

    if (error) {
      // Retry without new schedule columns if database column migration is pending
      console.warn("Retrying course save without schedule columns:", error);
      delete payload.scheduled_date;
      delete payload.start_time;
      delete payload.end_time;
      delete payload.location;
      delete payload.created_by_name;

      const { data: retryData, error: retryErr } = editingCourseId
        ? await supabase.from("training_courses").update(payload).eq("id", editingCourseId).select().single()
        : await supabase.from("training_courses").insert(payload).select().single();

      if (retryErr) {
        setSaving(false);
        toast("Error", "Failed to save course", "error");
        return;
      }
      resData = retryData;
    } else {
      resData = data;
    }

    const savedCourseId = resData?.id || editingCourseId;

    // If creator invited employees, auto-enroll them
    if (savedCourseId && newCourse.invited_employee_ids && newCourse.invited_employee_ids.length > 0) {
      const enrollRecords = newCourse.invited_employee_ids.map((empId) => ({
        course_id: savedCourseId,
        employee_id: empId,
        status: "enrolled",
        progress: 0,
        due_date: newCourse.scheduled_date || null,
      }));

      await supabase.from("training_enrollments").insert(enrollRecords);
    }

    setSaving(false);
    toast("Success", editingCourseId ? "Course updated" : "Training session scheduled successfully", "success");
    logActivity({
      module: "training",
      action: editingCourseId ? "updated" : "created",
      entityType: "training_course",
      entityId: savedCourseId,
      actorName,
      actorRole: "Admin",
      description: `${editingCourseId ? "Updated" : "Scheduled"} training course "${newCourse.title.trim()}"${
        newCourse.scheduled_date ? ` for ${newCourse.scheduled_date}` : ""
      }`,
      branchId: resolvedBranchId,
    });
    setShowCourseModal(false);
    setEditingCourseId(null);
    setNewCourse(emptyCourseForm);
    await fetchData();
  }, [newCourse, canManage, targetBranch, editingCourseId, actorName, fetchData, setSaving]);

  const deleteCourse = useCallback(
    async (course: Course) => {
      if (!canManage) return;
      if (!confirm(`Delete "${course.title}"? It will be moved to the Recycle Bin and can be restored later.`)) return;

      const { error } = await supabase
        .from("training_courses")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", course.id);

      if (error) {
        toast("Error", "Failed to delete course", "error");
        return;
      }
      toast("Success", "Course moved to recycle bin", "success");
      logActivity({
        module: "training",
        action: "deleted",
        entityType: "training_course",
        entityId: course.id,
        actorName,
        actorRole: "Admin",
        description: `Moved training course "${course.title}" to Recycle Bin`,
        branchId: course.branch_id || targetBranch,
      });
      setSelectedCourse(null);
      await fetchData();
    },
    [canManage, actorName, targetBranch, fetchData]
  );

  return {
    selectedCourse,
    setSelectedCourse,
    showCourseModal,
    setShowCourseModal,
    editingCourseId,
    newCourse,
    setNewCourse,
    openNewCourse,
    openEditCourse,
    saveCourse,
    deleteCourse,
  };
}
