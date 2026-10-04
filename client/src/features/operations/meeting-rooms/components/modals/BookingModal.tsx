import { memo, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import type { MeetingRoom, Booking, BookingFormData } from "../../types";
import { WorkspaceSelectDropdown } from "./WorkspaceSelectDropdown";
import { BookingModalDateTimeInputs } from "./BookingModalDateTimeInputs";
import { BookingModalHeader } from "./BookingModalHeader";
import { BookingModalTitleAttendees } from "./BookingModalTitleAttendees";
import { BookingModalExtrasCard } from "./BookingModalExtrasCard";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalRoom: MeetingRoom | null;
  setModalRoom: (room: MeetingRoom | null) => void;
  rooms: MeetingRoom[];
  editingBooking: Booking | null;
  bookingForm: BookingFormData;
  setBookingForm: React.Dispatch<React.SetStateAction<BookingFormData>>;
  saving: boolean;
  onSubmit: () => Promise<void>;
}

export const BookingModal = memo(function BookingModal({
  isOpen,
  onClose,
  modalRoom,
  setModalRoom,
  rooms,
  editingBooking,
  bookingForm,
  setBookingForm,
  saving,
  onSubmit,
}: BookingModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [isOpen]);

  const handleAnimatedClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 260);
  }, [onClose]);

  if (!isOpen || !modalRoom) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden w-full max-w-full touch-none">
      {/* Clean semi-transparent backdrop */}
      <div
        className={`fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleAnimatedClose}
      />

      {/* Bottom Sheet Modal on Mobile / Centered Card on Tablet & Desktop */}
      <div
        className={`relative w-full max-w-full sm:max-w-xl md:max-w-2xl max-h-[92dvh] sm:max-h-[90vh] bg-white dark:bg-slate-900 rounded-t-[36px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl border-t sm:border border-slate-200/80 dark:border-slate-800 overflow-y-auto overflow-x-hidden space-y-4 pb-8 sm:pb-6 overscroll-contain touch-pan-y ${
          isClosing ? "animate-cover-down-exit" : "animate-cover-up"
        }`}
      >
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-1 block sm:hidden" />

        {/* Header */}
        <BookingModalHeader
          onClose={handleAnimatedClose}
          modalRoom={modalRoom}
          isEditing={Boolean(editingBooking)}
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-3.5 text-xs"
        >
          {/* Meeting Title & Attendees */}
          <BookingModalTitleAttendees
            modalRoom={modalRoom}
            bookingForm={bookingForm}
            setBookingForm={setBookingForm}
          />

          {/* Room Selector */}
          <WorkspaceSelectDropdown
            rooms={rooms}
            selectedRoom={modalRoom}
            onSelectRoom={setModalRoom}
          />

          {/* Date, Start Time & End Time */}
          <BookingModalDateTimeInputs
            bookingForm={bookingForm}
            setBookingForm={setBookingForm}
          />

          {/* Equipment & Refreshments Checklist Card */}
          <BookingModalExtrasCard
            bookingForm={bookingForm}
            setBookingForm={setBookingForm}
          />

          {/* Action Buttons */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleAnimatedClose}
              className="flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer text-center active:scale-95 shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider text-white bg-[#253C7D] hover:bg-[#1E3064] dark:bg-sky-600 dark:hover:bg-sky-500 rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer text-center disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
            >
              <i className="ri-calendar-check-line text-sm" />
              <span>
                {saving
                  ? "Saving..."
                  : editingBooking
                  ? "Update Meeting"
                  : "Schedule Meeting"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
});
