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

    const { data: resData, error } = editingCourseId
      ? await supabase.from("training_courses").update(payload).eq("id", editingCourseId).select().single()
      : await supabase.from("training_courses").insert(payload).select().single();

    setSaving(false);
    if (error) {
      toast("Error", "Failed to save course", "error");
      return;
    }
    toast("Success", editingCourseId ? "Course updated" : "Course created", "success");
    logActivity({
      module: "training",
      action: editingCourseId ? "updated" : "created",
      entityType: "training_course",
      entityId: resData?.id || editingCourseId,
      actorName,
      actorRole: "Admin",
      description: `${editingCourseId ? "Updated" : "Created"} training course "${newCourse.title.trim()}"`,
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
