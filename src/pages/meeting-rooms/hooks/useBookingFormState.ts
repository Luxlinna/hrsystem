import { useState, useCallback } from "react";
import type { MeetingRoom, Booking, BookingFormData, ReasonModalState, ApprovalModalState } from "../types";
import { SPECIAL_REQUIREMENTS_OPTIONS, REFRESHMENTS_OPTIONS, INITIAL_BOOKING_FORM } from "../constants";
import { addMinutesToTime } from "../roomUtils";

interface UseBookingFormStateProps {
  rooms: MeetingRoom[];
  bookings: Booking[];
  employeeId: string;
  selectedDate: string;
  userEmail?: string | null;
  showToast: (type: "success" | "error" | "info", message: string) => void;
}

export function useBookingFormState({
  rooms,
  bookings,
  employeeId,
  selectedDate,
  userEmail,
  showToast,
}: UseBookingFormStateProps) {
  const [modalRoom, setModalRoom] = useState<MeetingRoom | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

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

  const openBookModal = useCallback(
    (room?: MeetingRoom, date?: string, startTime?: string) => {
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
    },
    [rooms, selectedDate]
  );

  const openEditModal = useCallback(
    (booking: Booking) => {
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

      if (selectedBooking) setSelectedBooking(null);
    },
    [employeeId, userEmail, rooms, selectedBooking, showToast]
  );

  const checkOverlap = useCallback(
    (roomId: string, date: string, start: string, end: string, excludeBookingId?: string): Booking | undefined => {
      return bookings.find((b) => {
        if (b.room_id !== roomId || b.date !== date) return false;
        if (excludeBookingId && b.id === excludeBookingId) return false;
        if (b.status === "cancelled" || b.status === "rejected") return false;
        return start < b.end_time && end > b.start_time;
      });
    },
    [bookings]
  );

  return {
    modalRoom,
    setModalRoom,
    editingBooking,
    setEditingBooking,
    selectedBooking,
    setSelectedBooking,
    bookingForm,
    setBookingForm,
    reasonModal,
    setReasonModal,
    approvalModal,
    setApprovalModal,
    openBookModal,
    openEditModal,
    checkOverlap,
  };
}
