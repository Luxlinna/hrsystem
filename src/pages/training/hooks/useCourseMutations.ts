import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import type { Course, CourseFormState } from "../types";
import { emptyCourseForm } from "../constants";
import { encodeCourseDescription } from "../components/modals/courseModalUtils";

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
    const safeDate = typeof initialDate === "string" ? initialDate : new Date().toISOString().slice(0, 10);
    setEditingCourseId(null);
    setNewCourse({
      ...emptyCourseForm,
      is_admin_course: isSuperAdmin && !effectiveBranchId,
      branch_id: targetBranch,
      scheduled_date: safeDate,
      start_time: "09:00",
      end_time: "11:00",
      duration_hours: "2",
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

    const encodedDescription = encodeCourseDescription(newCourse.description, {
      scheduled_date: newCourse.scheduled_date,
      start_time: newCourse.start_time,
      end_time: newCourse.end_time,
      location: newCourse.location,
      created_by_name: actorName,
    });

    const payload: Record<string, any> = {
      title: newCourse.title.trim(),
      description: encodedDescription || null,
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

    // If creator invited employees, auto-enroll them & send notifications
    if (savedCourseId && newCourse.invited_employee_ids && newCourse.invited_employee_ids.length > 0) {
      const uniqueInvitedEmpIds = Array.from(new Set(newCourse.invited_employee_ids));

      // Query existing enrollments for this course to prevent duplicates
      const { data: existingEnrs } = await supabase
        .from("training_enrollments")
        .select("employee_id")
        .eq("course_id", savedCourseId);

      const existingSet = new Set((existingEnrs || []).map((x) => x.employee_id));
      const finalToEnroll = uniqueInvitedEmpIds.filter((id) => !existingSet.has(id));

      if (finalToEnroll.length > 0) {
        const enrollRecords = finalToEnroll.map((empId) => ({
          course_id: savedCourseId,
          employee_id: empId,
          status: "enrolled",
          progress: 0,
          due_date: newCourse.scheduled_date || null,
        }));

        await supabase.from("training_enrollments").insert(enrollRecords);

        // Fetch employee info to resolve their user_id & branch
        const { data: invitedEmps } = await supabase
          .from("employees")
          .select("id, first_name, last_name, email, branch_id")
          .in("id", finalToEnroll);

      const emails = (invitedEmps || []).map((e) => e.email).filter(Boolean);
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

      const scheduleDetails = newCourse.scheduled_date
        ? ` scheduled on ${newCourse.scheduled_date}${newCourse.start_time ? ` at ${newCourse.start_time}` : ""}`
        : "";
      const locationDetails = newCourse.location ? ` at ${newCourse.location}` : "";

      // Send individual notifications to each invited employee
      await Promise.all(
        (invitedEmps || []).map(async (emp) => {
          const recipientUserId = emp.email ? userRolesMap.get(emp.email.toLowerCase()) || null : null;
          return notify({
            title: `Training Invitation: ${newCourse.title.trim()}`,
            message: `You have been invited and enrolled in "${newCourse.title.trim()}"${scheduleDetails}${locationDetails}.`,
            type: "info",
            source: "training",
            entityId: savedCourseId,
            recipientUserId,
            branchId: emp.branch_id || resolvedBranchId,
          });
        })
      );
      }
    }

    // If course booked a meeting room, sync reservation into room_bookings
    if (newCourse.location && newCourse.scheduled_date && newCourse.start_time && newCourse.end_time) {
      const locLower = newCourse.location.toLowerCase().trim();
      const { data: mRooms } = await supabase
        .from("meeting_rooms")
        .select("id, name, floor, capacity, branch_id")
        .is("deleted_at", null);

      const matchedRoom = (mRooms || []).find((r) => {
        const rNameLower = r.name.toLowerCase().trim();
        return (
          locLower === rNameLower ||
          locLower.includes(rNameLower) ||
          rNameLower.includes(locLower.split(" (")[0].trim())
        );
      });

      if (matchedRoom) {
        // Resolve employee ID for creator if possible
        const { data: creatorEmp } = await supabase
          .from("employees")
          .select("id")
          .ilike("first_name", `%${actorName.split(" ")[0]}%`)
          .limit(1)
          .maybeSingle();

        // Check if a booking already exists for this training course session
        const { data: existingBooking } = await supabase
          .from("room_bookings")
          .select("id, status")
          .eq("room_id", matchedRoom.id)
          .eq("date", newCourse.scheduled_date)
          .ilike("title", `%${newCourse.title.trim()}%`)
          .maybeSingle();

        const bookingPayload = {
          room_id: matchedRoom.id,
          booked_by: creatorEmp?.id || null,
          title: `🎓 Training: ${newCourse.title.trim()}`,
          date: newCourse.scheduled_date,
          start_time: newCourse.start_time,
          end_time: newCourse.end_time,
          attendees_count: matchedRoom.capacity || 10,
          status: "pending" as const,
          special_requirements: `Category: ${newCourse.category} · Host: ${newCourse.instructor || actorName} · Purpose: Staff Training Session`,
          refreshments: "None",
        };

        const isNewBooking = !existingBooking;
        let createdBookingId = existingBooking?.id;

        if (existingBooking) {
          await supabase.from("room_bookings").update({
            ...bookingPayload,
            status: existingBooking.status || "pending",
          }).eq("id", existingBooking.id);
        } else {
          const { data: insertedB } = await supabase.from("room_bookings").insert(bookingPayload).select().single();
          createdBookingId = insertedB?.id;
        }

        // Notify branch admins / managers of the pending room reservation
        if (isNewBooking && createdBookingId) {
          const floorText = `Floor ${matchedRoom.floor || 3}`;
          const timeText = `${newCourse.start_time}–${newCourse.end_time}`;

          await notify({
            source: "meeting_rooms",
            type: "info",
            title: "New Training Room Booking (Pending Approval)",
            message: `${actorName} reserved ${matchedRoom.name} (${floorText}) on ${newCourse.scheduled_date} (${timeText}) for training course "${newCourse.title.trim()}". Awaiting branch admin approval.`,
            entityId: createdBookingId,
            branchId: matchedRoom.branch_id || resolvedBranchId,
          });

          notifyTelegramEvent(
            `🚪 <b>New Training Room Booking Request</b>\n\n👤 <b>Requested By:</b> ${escapeTelegramHtml(actorName)}\n🏢 <b>Room:</b> ${escapeTelegramHtml(matchedRoom.name)} (${floorText})\n📅 <b>When:</b> ${newCourse.scheduled_date}, ${timeText}\n🎓 <b>Course:</b> ${escapeTelegramHtml(newCourse.title.trim())}\n⏳ <b>Status:</b> Pending Branch Admin Approval`,
            { text: "Open Meeting Rooms", url: hrNexusUrl("/meeting-rooms") }
          );
        }
      }
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
