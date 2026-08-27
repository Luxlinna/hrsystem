import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/notify";
import { logActivity } from "@/lib/audit";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import type { MeetingRoom, Booking, BookingEmployee, BookingFormData, ReasonModalState, ApprovalModalState } from "../types";
import { SPECIAL_REQUIREMENTS_OPTIONS, REFRESHMENTS_OPTIONS, INITIAL_BOOKING_FORM } from "../constants";
import { fmtTime, addMinutesToTime } from "../roomUtils";

interface UseBookingMutationsProps {
  rooms: MeetingRoom[];
  bookings: Booking[];
  employeeId: string;
  currentEmployee: BookingEmployee | null;
  selectedDate: string;
  roleName?: string;
  userEmail?: string | null;
  loadBookings: () => Promise<void>;
  showToast: (type: "success" | "error" | "info", message: string) => void;
}

export function useBookingMutations({
  rooms,
  bookings,
  employeeId,
  currentEmployee,
  selectedDate,
  roleName = "Staff",
  userEmail,
  loadBookings,
  showToast,
}: UseBookingMutationsProps) {
  const [modalRoom, setModalRoom] = useState<MeetingRoom | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [saving, setSaving] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    ...INITIAL_BOOKING_FORM,
    date: selectedDate,
  });

  const [reasonModal, setReasonModal] = useState<ReasonModalState>({
    isOpen: false,
    booking: null,
    action: "cancel",
    reason: "",
  });

  const [approvalModal, setApprovalModal] = useState<ApprovalModalState>({
    isOpen: false,
    booking: null,
    approvedReqs: [],
    declinedReqs: [],
    approvedRef: [],
    declinedRef: [],
    notes: "",
  });

  const openBookModal = useCallback((room?: MeetingRoom, date?: string, startTime?: string) => {
    const targetRoom = room || rooms[0] || null;
    const start = startTime || "14:00";
    const end = addMinutesToTime(start, 120);
    setEditingBooking(null);
    setModalRoom(targetRoom);
    setBookingForm({
      title: "",
      date: date || selectedDate,
      start_time: start,
      end_time: end,
      attendees_count: targetRoom?.capacity ? Math.min(5, targetRoom.capacity) : 5,
      selected_requirements: ["IT Support Assistance", "4K Camera & Conf Mic"],
      custom_requirements: "",
      selected_refreshments: ["Bottled Drinking Water"],
      custom_refreshments: "",
    });
  }, [rooms, selectedDate]);

  const openEditModal = useCallback((booking: Booking) => {
    const isCreator =
      booking.booked_by === employeeId ||
      (Boolean(userEmail) && booking.employees?.email === userEmail);

    if (!isCreator) {
      showToast("error", "You can only edit your own reservations.");
      return;
    }

    if (booking.status !== "pending") {
      showToast("error", "Bookings can only be edited before Admin/HR approval. Approved bookings cannot be edited.");
      return;
    }

    const targetRoom = rooms.find((r) => r.id === booking.room_id) || rooms[0] || null;
    setEditingBooking(booking);
    setModalRoom(targetRoom);

    const rawReqs = (booking.special_requirements || "").split(",").map((s) => s.trim()).filter(Boolean);
    const knownReqs = SPECIAL_REQUIREMENTS_OPTIONS.map((o) => o.label);
    const selectedReqs = rawReqs.filter((r) => knownReqs.includes(r));
    const customReqs = rawReqs.filter((r) => !knownReqs.includes(r)).join(", ");

    const rawRef = (booking.refreshments || "").split(",").map((s) => s.trim()).filter(Boolean);
    const knownRef = REFRESHMENTS_OPTIONS.map((o) => o.label);
    const selectedRef = rawRef.filter((r) => knownRef.includes(r));
    const customRef = rawRef.filter((r) => !knownRef.includes(r)).join(", ");

    setBookingForm({
      title: booking.title,
      date: booking.date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      attendees_count: booking.attendees_count || 1,
      selected_requirements: selectedReqs,
      custom_requirements: customReqs,
      selected_refreshments: selectedRef,
      custom_refreshments: customRef,
    });

    if (selectedBooking) {
      setSelectedBooking(null);
    }
  }, [employeeId, userEmail, rooms, selectedBooking, showToast]);

  const checkOverlap = useCallback((
    roomId: string,
    date: string,
    start: string,
    end: string,
    excludeBookingId?: string
  ): Booking | undefined => {
    return bookings.find((b) => {
      if (b.room_id !== roomId || b.date !== date) return false;
      if (excludeBookingId && b.id === excludeBookingId) return false;
      if (b.status === "cancelled" || b.status === "rejected") return false;
      return start < b.end_time && end > b.start_time;
    });
  }, [bookings]);

  const handleBook = useCallback(async () => {
    if (!modalRoom) return showToast("error", "Please select a meeting room.");
    if (!employeeId) return showToast("error", "Employee profile not loaded. Please reload.");
    if (!bookingForm.title.trim()) return showToast("error", "Please enter a meeting title.");
    if (bookingForm.end_time <= bookingForm.start_time) {
      return showToast("error", "End time must be after start time.");
    }

    if (modalRoom.capacity && bookingForm.attendees_count > modalRoom.capacity) {
      return showToast(
        "error",
        `Attendees (${bookingForm.attendees_count} ppl) exceeds ${modalRoom.name} capacity (max ${modalRoom.capacity} ppl).`
      );
    }

    const conflict = checkOverlap(
      modalRoom.id,
      bookingForm.date,
      bookingForm.start_time,
      bookingForm.end_time,
      editingBooking?.id
    );
    if (conflict) {
      return showToast(
        "error",
        `${modalRoom.name} is already booked (${conflict.status}) by ${
          conflict.employees?.first_name || "another member"
        } from ${fmtTime(conflict.start_time)} to ${fmtTime(conflict.end_time)}.`
      );
    }

    setSaving(true);

    const finalRequirements = [
      ...bookingForm.selected_requirements,
      bookingForm.custom_requirements.trim(),
    ].filter(Boolean).join(", ") || "None";

    const finalRefreshments = [
      ...bookingForm.selected_refreshments,
      bookingForm.custom_refreshments.trim(),
    ].filter(Boolean).join(", ") || "None";

    const empName = currentEmployee
      ? `${currentEmployee.first_name} ${currentEmployee.last_name}`
      : "An employee";

    if (editingBooking) {
      if (editingBooking.status !== "pending") {
        setSaving(false);
        showToast("error", "Approved reservations cannot be edited.");
        return;
      }

      const { error } = await supabase
        .from("room_bookings")
        .update({
          room_id: modalRoom.id,
          title: bookingForm.title.trim(),
          date: bookingForm.date,
          start_time: bookingForm.start_time,
          end_time: bookingForm.end_time,
          attendees_count: Number(bookingForm.attendees_count) || 1,
          special_requirements: finalRequirements,
          refreshments: finalRefreshments,
        })
        .eq("id", editingBooking.id);

      setSaving(false);

      if (error) {
        showToast("error", "Failed to update reservation.");
        return;
      }

      await notify({
        source: "meeting_rooms",
        type: "info",
        title: "Meeting Room Booking Modified",
        message: `${empName} modified reservation for ${modalRoom.name} (Floor ${modalRoom.floor || 3}) on ${bookingForm.date} (${fmtTime(bookingForm.start_time)}–${fmtTime(bookingForm.end_time)}) "${bookingForm.title}".`,
        entityId: editingBooking.id,
      });

      notifyTelegramEvent(
        `✏️ <b>Room Booking Modified</b>\n\n👤 <b>By:</b> ${escapeTelegramHtml(empName)}\n🏢 <b>Room:</b> ${escapeTelegramHtml(modalRoom.name)} (Floor ${modalRoom.floor || 3})\n📅 <b>When:</b> ${bookingForm.date}, ${fmtTime(bookingForm.start_time)}–${fmtTime(bookingForm.end_time)}\n📌 <b>Title:</b> ${escapeTelegramHtml(bookingForm.title)}`,
        { text: "Open in HR Nexus", url: hrNexusUrl("/meeting-rooms") }
      );

      logActivity({
        module: "meeting_rooms",
        action: "updated",
        entityType: "room_booking",
        entityId: editingBooking.id,
        actorName: empName,
        actorRole: roleName,
        description: `Modified booking for ${modalRoom.name} (Floor ${modalRoom.floor || 3}): "${bookingForm.title}"`,
      });

      showToast("success", "Booking updated successfully!");
      setEditingBooking(null);
      setModalRoom(null);
      loadBookings();
      return;
    }

    // Create new booking
    const { data, error } = await supabase
      .from("room_bookings")
      .insert({
        room_id: modalRoom.id,
        booked_by: employeeId,
        title: bookingForm.title.trim(),
        date: bookingForm.date,
        start_time: bookingForm.start_time,
        end_time: bookingForm.end_time,
        attendees_count: Number(bookingForm.attendees_count) || 1,
        special_requirements: finalRequirements,
        refreshments: finalRefreshments,
        status: "pending",
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      showToast("error", "Failed to book room.");
      return;
    }

    await notify({
      source: "meeting_rooms",
      type: "info",
      title: "New Meeting Room Booking Request",
      message: `${empName} requested ${modalRoom.name} (Floor ${modalRoom.floor || 3}) on ${bookingForm.date} (${fmtTime(bookingForm.start_time)}–${fmtTime(bookingForm.end_time)}) "${bookingForm.title}".`,
      entityId: data.id,
    });

    notifyTelegramEvent(
      `🚪 <b>New Room Booking Request</b>\n\n👤 <b>Booked By:</b> ${escapeTelegramHtml(empName)}\n🏢 <b>Room:</b> ${escapeTelegramHtml(modalRoom.name)} (Floor ${modalRoom.floor || 3})\n📅 <b>When:</b> ${bookingForm.date}, ${fmtTime(bookingForm.start_time)}–${fmtTime(bookingForm.end_time)}\n📌 <b>Title:</b> ${escapeTelegramHtml(bookingForm.title)}\n👥 <b>Attendees:</b> ${bookingForm.attendees_count} ppl\n🍿 <b>Snacks:</b> ${escapeTelegramHtml(finalRefreshments)}`,
      { text: "Open in HR Nexus", url: hrNexusUrl("/meeting-rooms") }
    );

    logActivity({
      module: "meeting_rooms",
      action: "created",
      entityType: "room_booking",
      entityId: data.id,
      actorName: empName,
      actorRole: roleName,
      description: `Requested ${modalRoom.name} (Floor ${modalRoom.floor || 3}) on ${bookingForm.date}: "${bookingForm.title}"`,
    });

    showToast("success", `Booking submitted for ${modalRoom.name} (Pending Admin/HR Approval)!`);
    setModalRoom(null);
    loadBookings();
  }, [modalRoom, employeeId, bookingForm, checkOverlap, editingBooking, currentEmployee, roleName, showToast, loadBookings]);

  // Direct cancel for own pending reservation
  const handleCancelOwnBooking = useCallback(async (booking: Booking) => {
    const isCreator =
      booking.booked_by === employeeId ||
      (Boolean(userEmail) && booking.employees?.email === userEmail);

    if (!isCreator) {
      showToast("error", "You can only cancel your own reservations.");
      return;
    }

    setProcessingAction(true);
    const { error } = await supabase
      .from("room_bookings")
      .update({
        status: "cancelled",
        cancelled_by: employeeId,
        cancelled_at: new Date().toISOString(),
        rejection_reason: "Cancelled by employee",
      })
      .eq("id", booking.id);

    setProcessingAction(false);

    if (error) {
      showToast("error", "Failed to cancel booking.");
      return;
    }

    showToast("success", "Reservation cancelled.");
    setSelectedBooking(null);
    loadBookings();
  }, [employeeId, userEmail, showToast, loadBookings]);

  return {
    modalRoom,
    setModalRoom,
    editingBooking,
    setEditingBooking,
    selectedBooking,
    setSelectedBooking,
    saving,
    processingAction,
    setProcessingAction,
    bookingForm,
    setBookingForm,
    reasonModal,
    setReasonModal,
    approvalModal,
    setApprovalModal,
    openBookModal,
    openEditModal,
    checkOverlap,
    handleBook,
    handleCancelOwnBooking,
  };
}
