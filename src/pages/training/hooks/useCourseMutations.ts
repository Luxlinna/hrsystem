import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import type { Course, CourseFormState, Enrollment } from "../types";
import { emptyCourseForm } from "../constants";
import { encodeCourseDescription } from "../components/modals/courseModalUtils";

interface UseCourseMutationsProps {
  actorName: string;
  canManage: boolean;
  isSuperAdmin: boolean;
  effectiveBranchId: string | null;
  userBranchId: string | null;
  enrollments?: Enrollment[];
  fetchData: () => Promise<void>;
  setSaving: (v: boolean) => void;
}

export function useCourseMutations({
  actorName,
  canManage,
  isSuperAdmin,
  effectiveBranchId,
  userBranchId,
  enrollments = [],
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
      special_requirements: [],
      custom_requirement: "",
      refreshments: [],
      custom_refreshment: "",
    });
    setShowCourseModal(true);
  };

  const openEditCourse = async (course: Course) => {
    if (!canManage) return;

    // Load currently enrolled employees for this course
    const existingEnrolledIds = enrollments
      .filter((e) => e.course_id === course.id && e.status !== "dropped")
      .map((e) => e.employee_id);

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
      invited_employee_ids: existingEnrolledIds,
      special_requirements: course.special_requirements || [],
      custom_requirement: course.custom_requirement || "",
      refreshments: course.refreshments || [],
      custom_refreshment: course.custom_refreshment || "",
    });
    setEditingCourseId(course.id);
    setSelectedCourse(null);
    setShowCourseModal(true);

    // Also fetch fresh from database to ensure complete sync
    try {
      const { data: dbEnrs } = await supabase
        .from("training_enrollments")
        .select("employee_id")
        .eq("course_id", course.id)
        .neq("status", "dropped")
        .is("deleted_at", null);

      if (dbEnrs && dbEnrs.length > 0) {
        const dbIds = Array.from(new Set(dbEnrs.map((x) => x.employee_id)));
        setNewCourse((prev) => ({
          ...prev,
          invited_employee_ids: dbIds,
        }));
      }
    } catch (e) {
      console.warn("Could not query fresh enrolled staff:", e);
    }
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
      special_requirements: newCourse.special_requirements,
      custom_requirement: newCourse.custom_requirement,
      refreshments: newCourse.refreshments,
      custom_refreshment: newCourse.custom_refreshment,
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

    // Sync invited / enrolled employees
    if (savedCourseId) {
      const uniqueInvitedEmpIds = Array.from(new Set(newCourse.invited_employee_ids || []));

      // Query existing enrollments for this course
      const { data: existingEnrs } = await supabase
        .from("training_enrollments")
        .select("id, employee_id")
        .eq("course_id", savedCourseId)
        .is("deleted_at", null);

      const existingMap = new Map((existingEnrs || []).map((x) => [x.employee_id, x.id]));
      const finalToEnroll = uniqueInvitedEmpIds.filter((id) => !existingMap.has(id));
      const toRemoveIds = (existingEnrs || [])
        .filter((x) => !uniqueInvitedEmpIds.includes(x.employee_id))
        .map((x) => x.id);

      // Remove deselected employees if editing
      if (toRemoveIds.length > 0) {
        await supabase.from("training_enrollments").delete().in("id", toRemoveIds);
      }

      // Add newly selected employees
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
    const isRoomLocation = newCourse.location && newCourse.scheduled_date && newCourse.start_time && newCourse.end_time;
    const locLower = (newCourse.location || "").toLowerCase().trim();

    // Query any existing room bookings for this course
    const { data: allExistingBookings } = await supabase
      .from("room_bookings")
      .select("id, status, room_id")
      .ilike("title", `%${newCourse.title.trim()}%`)
      .is("deleted_at", null);

    let matchedRoom: any = null;
    if (isRoomLocation) {
      const { data: mRooms } = await supabase
        .from("meeting_rooms")
        .select("id, name, floor, capacity, branch_id")
        .is("deleted_at", null);

      matchedRoom = (mRooms || []).find((r) => {
        const rNameLower = r.name.toLowerCase().trim();
        return (
          locLower === rNameLower ||
          locLower.includes(rNameLower) ||
          rNameLower.includes(locLower.split(" (")[0].trim())
        );
      });
    }

    if (matchedRoom) {
      // Resolve employee ID for creator
      let bookedByEmpId: string | null = null;
      if (actorName) {
        const { data: empByName } = await supabase
          .from("employees")
          .select("id")
          .or(`email.ilike.%${actorName}%,first_name.ilike.%${actorName.split(" ")[0]}%`)
          .limit(1)
          .maybeSingle();
        if (empByName?.id) {
          bookedByEmpId = empByName.id;
        }
      }
      if (!bookedByEmpId) {
        const { data: firstEmp } = await supabase
          .from("employees")
          .select("id")
          .limit(1)
          .maybeSingle();
        bookedByEmpId = firstEmp?.id || null;
      }

      const combinedReqs = [
        ...(newCourse.special_requirements || []),
        newCourse.custom_requirement ? `Custom: ${newCourse.custom_requirement}` : null,
      ]
        .filter(Boolean)
        .join(", ") || "None";

      const combinedRef = [
        ...(newCourse.refreshments || []),
        newCourse.custom_refreshment ? `Custom: ${newCourse.custom_refreshment}` : null,
      ]
        .filter(Boolean)
        .join(", ") || "None";

      const bookingPayload = {
        room_id: matchedRoom.id,
        booked_by: bookedByEmpId,
        title: `🎓 Training: ${newCourse.title.trim()}`,
        date: newCourse.scheduled_date,
        start_time: newCourse.start_time,
        end_time: newCourse.end_time,
        attendees_count: newCourse.invited_employee_ids?.length || matchedRoom.capacity || 10,
        status: "pending" as const,
        special_requirements: combinedReqs,
        refreshments: combinedRef,
      };

      const primaryBooking = allExistingBookings?.[0];
      const isNewBooking = !primaryBooking;
      let createdBookingId = primaryBooking?.id;

      if (primaryBooking) {
        // Update primary booking with new room and schedule
        await supabase
          .from("room_bookings")
          .update({
            ...bookingPayload,
            room_id: matchedRoom.id,
            status: primaryBooking.status || "pending",
          })
          .eq("id", primaryBooking.id);

        // Remove any orphan duplicate bookings from previous room changes
        const orphanIds = (allExistingBookings || []).slice(1).map((b) => b.id);
        if (orphanIds.length > 0) {
          await supabase.from("room_bookings").delete().in("id", orphanIds);
        }
      } else {
        const { data: insertedB } = await supabase
          .from("room_bookings")
          .insert(bookingPayload)
          .select()
          .single();
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
    } else if (allExistingBookings && allExistingBookings.length > 0) {
      // Course switched from a physical room to online/custom — remove old room reservations
      const removeIds = allExistingBookings.map((b) => b.id);
      await supabase.from("room_bookings").delete().in("id", removeIds);
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

      // Also clean up any associated room bookings for this course
      try {
        await supabase
          .from("room_bookings")
          .delete()
          .ilike("title", `%${course.title.trim()}%`);
      } catch (e) {
        console.warn("Could not clean up room booking for deleted course:", e);
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
