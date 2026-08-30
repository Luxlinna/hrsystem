import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { MeetingRoom, Booking, BookingEmployee } from "../types";
import { fmtTime } from "../roomUtils";
import { useBookingFormState } from "./useBookingFormState";
import { sendBookingNotification } from "../bookingNotifyUtils";

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
  const [saving, setSaving] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  const state = useBookingFormState({
    rooms,
    bookings,
    employeeId,
    selectedDate,
    userEmail,
    showToast,
  });

  const handleBook = useCallback(async () => {
    const { modalRoom, bookingForm, editingBooking, checkOverlap } = state;
    if (!modalRoom) return showToast("error", "Please select a meeting room.");
    if (!employeeId) return showToast("error", "Employee profile not loaded. Please reload.");
    if (!bookingForm.title.trim()) return showToast("error", "Please enter a meeting title.");
    if (bookingForm.end_time <= bookingForm.start_time) {
      return showToast("error", "End time must be after start time.");
    }

    if (modalRoom.capacity && bookingForm.attendees_count > modalRoom.capacity) {
      return showToast("error", `Attendees (${bookingForm.attendees_count} ppl) exceeds ${modalRoom.name} capacity (max ${modalRoom.capacity} ppl).`);
    }

    const conflict = checkOverlap(modalRoom.id, bookingForm.date, bookingForm.start_time, bookingForm.end_time, editingBooking?.id);
    if (conflict) {
      return showToast("error", `${modalRoom.name} is already booked (${conflict.status}) by ${conflict.employees?.first_name || "another member"} from ${fmtTime(conflict.start_time)} to ${fmtTime(conflict.end_time)}.`);
    }

    setSaving(true);
    const finalRequirements = [...bookingForm.selected_requirements, bookingForm.custom_requirements.trim()].filter(Boolean).join(", ") || "None";
    const finalRefreshments = [...bookingForm.selected_refreshments, bookingForm.custom_refreshments.trim()].filter(Boolean).join(", ") || "None";
    const empName = currentEmployee ? `${currentEmployee.first_name} ${currentEmployee.last_name}` : "An employee";

    if (editingBooking) {
      if (editingBooking.status !== "pending") {
        setSaving(false);
        return showToast("error", "Approved reservations cannot be edited.");
      }

      const { error } = await supabase.from("room_bookings").update({
        room_id: modalRoom.id,
        title: bookingForm.title.trim(),
        date: bookingForm.date,
        start_time: bookingForm.start_time,
        end_time: bookingForm.end_time,
        attendees_count: Number(bookingForm.attendees_count) || 1,
        special_requirements: finalRequirements,
        refreshments: finalRefreshments,
      }).eq("id", editingBooking.id);

      setSaving(false);
      if (error) return showToast("error", "Failed to update reservation.");

      await sendBookingNotification({ isEdit: true, bookingId: editingBooking.id, modalRoom, bookingForm, empName, roleName, finalRefreshments });
      showToast("success", "Booking updated successfully!");
      state.setEditingBooking(null);
      state.setModalRoom(null);
      loadBookings();
      return;
    }

    const { data, error } = await supabase.from("room_bookings").insert({
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
    }).select().single();

    setSaving(false);
    if (error) return showToast("error", "Failed to book room.");

    await sendBookingNotification({ isEdit: false, bookingId: data.id, modalRoom, bookingForm, empName, roleName, finalRefreshments });
    showToast("success", `Booking submitted for ${modalRoom.name} (Pending Admin/HR Approval)!`);
    state.setModalRoom(null);
    loadBookings();
  }, [state, employeeId, currentEmployee, roleName, showToast, loadBookings]);

  const handleCancelOwnBooking = useCallback(async (booking: Booking) => {
    const isCreator = booking.booked_by === employeeId || (Boolean(userEmail) && booking.employees?.email === userEmail);
    if (!isCreator) return showToast("error", "You can only cancel your own reservations.");

    setProcessingAction(true);
    const { error } = await supabase.from("room_bookings").update({
      status: "cancelled",
      cancelled_by: employeeId,
      cancelled_at: new Date().toISOString(),
      rejection_reason: "Cancelled by employee",
    }).eq("id", booking.id);

    setProcessingAction(false);
    if (error) return showToast("error", "Failed to cancel booking.");

    showToast("success", "Reservation cancelled.");
    state.setSelectedBooking(null);
    loadBookings();
  }, [employeeId, userEmail, showToast, loadBookings, state]);

  return {
    modalRoom: state.modalRoom,
    setModalRoom: state.setModalRoom,
    editingBooking: state.editingBooking,
    setEditingBooking: state.setEditingBooking,
    selectedBooking: state.selectedBooking,
    setSelectedBooking: state.setSelectedBooking,
    saving,
    processingAction,
    setProcessingAction,
    bookingForm: state.bookingForm,
    setBookingForm: state.setBookingForm,
    reasonModal: state.reasonModal,
    setReasonModal: state.setReasonModal,
    approvalModal: state.approvalModal,
    setApprovalModal: state.setApprovalModal,
    openBookModal: state.openBookModal,
    openEditModal: state.openEditModal,
    checkOverlap: state.checkOverlap,
    handleBook,
    handleCancelOwnBooking,
  };
}
