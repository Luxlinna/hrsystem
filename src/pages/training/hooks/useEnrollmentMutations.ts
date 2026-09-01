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

  const openEnroll = (courseId?: string, defaultDueDate?: string) => {
    if (!canManage) {
      toast("Permission Denied", "Only administrators and managers can enroll employees.", "error");
      return;
    }
    const targetCourse = courses.find((c) => c.id === courseId) || courses[0] || null;
    setEnrollCourseId(targetCourse?.id || null);
    setEnrollEmployeeIds([]);
    const resolvedDate =
      defaultDueDate ||
      targetCourse?.scheduled_date ||
      targetCourse?.created_at?.slice(0, 10) ||
      "";
    setEnrollDueDate(resolvedDate);
    setShowEnrollModal(true);
  };

  const saveEnrollment = useCallback(async () => {
    if (!enrollCourseId || enrollEmployeeIds.length === 0 || !canManage) return;
    setSaving(true);

    const uniqueEmpIds = Array.from(new Set(enrollEmployeeIds));

    // Query existing enrollments for this course to prevent duplicates
    const { data: existingEnrs } = await supabase
      .from("training_enrollments")
      .select("employee_id")
      .eq("course_id", enrollCourseId);

    const existingSet = new Set((existingEnrs || []).map((x) => x.employee_id));
    const newEmpIds = uniqueEmpIds.filter((id) => !existingSet.has(id));

    if (newEmpIds.length === 0) {
      setSaving(false);
      setShowEnrollModal(false);
      toast("Notice", "Selected employee(s) are already enrolled in this course.", "info");
      return;
    }

    const records = newEmpIds.map((empId) => ({
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

    // Fetch employee info to resolve their user_id & branch
    const { data: enrolledEmps } = await supabase
      .from("employees")
      .select("id, first_name, last_name, email, branch_id")
      .in("id", newEmpIds);

    const emails = (enrolledEmps || []).map((e) => e.email).filter(Boolean);
    let userRolesMap = new Map<string, string>();
    if (emails.length > 0) {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("email, user_id")
        .in("email", emails);
      if (userRoles) {
        userRolesMap = new Map(userRoles.map((ur) => [ur.email.toLowerCase(), ur.user_id]));
      }
    }

    const courseObj = courses.find((c) => c.id === enrollCourseId);
    const courseName = courseObj?.title || "a training course";
    const scheduleDetails = courseObj?.scheduled_date
      ? ` scheduled on ${courseObj.scheduled_date}${courseObj.start_time ? ` at ${courseObj.start_time}` : ""}`
      : "";
    const locationDetails = courseObj?.location ? ` at ${courseObj.location}` : "";
    const dueDetails = enrollDueDate ? ` (Due: ${enrollDueDate})` : "";

    await Promise.all(
      (enrolledEmps || []).map(async (emp) => {
        const recipientUserId = emp.email ? userRolesMap.get(emp.email.toLowerCase()) || null : null;
        return notify({
          title: `Training Enrollment: ${courseName}`,
          message: `You have been enrolled in "${courseName}"${scheduleDetails}${locationDetails}${dueDetails}.`,
          type: "info",
          source: "training",
          entityId: enrollCourseId,
          recipientUserId,
          branchId: emp.branch_id,
        });
      })
    );

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
