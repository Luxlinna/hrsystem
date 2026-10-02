import { memo, useState, useCallback } from "react";
import type { MeetingRoom, Booking, BookingFormData } from "../../types";
import { FloorBadge } from "../FloorBadge";
import { getRoomFloor } from "../../roomUtils";
import { QUICK_TITLES } from "../../constants";
import { WorkspaceSelectDropdown } from "./WorkspaceSelectDropdown";
import { RequirementsSelectDropdown } from "./RequirementsSelectDropdown";
import { RefreshmentsSelectDropdown } from "./RefreshmentsSelectDropdown";
import { BookingModalDateTimeInputs } from "./BookingModalDateTimeInputs";

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
  const [showExtras, setShowExtras] = useState(false);

  const toggleReq = useCallback((label: string) => {
    setBookingForm((prev) => {
      const exists = prev.selected_requirements.includes(label);
      return {
        ...prev,
        selected_requirements: exists
          ? prev.selected_requirements.filter((r) => r !== label)
          : [...prev.selected_requirements, label],
      };
    });
  }, [setBookingForm]);

  const setReqs = useCallback((reqs: string[]) => {
    setBookingForm((prev) => ({ ...prev, selected_requirements: reqs }));
  }, [setBookingForm]);

  const toggleRef = useCallback((label: string) => {
    setBookingForm((prev) => {
      const exists = prev.selected_refreshments.includes(label);
      return {
        ...prev,
        selected_refreshments: exists
          ? prev.selected_refreshments.filter((r) => r !== label)
          : [...prev.selected_refreshments, label],
      };
    });
  }, [setBookingForm]);

  const setRefs = useCallback((refs: string[]) => {
    setBookingForm((prev) => ({ ...prev, selected_refreshments: refs }));
  }, [setBookingForm]);

  if (!isOpen || !modalRoom) return null;

  const roomFloor = getRoomFloor(modalRoom);
  const isVIP = roomFloor === 5;
  const hasExtrasSelected =
    bookingForm.selected_requirements.length > 0 ||
    bookingForm.selected_refreshments.length > 0 ||
    bookingForm.custom_requirements ||
    bookingForm.custom_refreshments;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-in zoom-in-95 duration-150 max-h-[88vh] overflow-y-auto space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                {editingBooking ? "Edit Reservation" : "Book Meeting Room"}
              </h3>
              <FloorBadge floor={roomFloor} size="sm" isVIP={isVIP} />
            </div>
            <p className="text-[9.5px] text-slate-500 dark:text-slate-400">
              {modalRoom.name} &middot; Floor {roomFloor} &middot; Max {modalRoom.capacity || "—"} ppl
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-sm" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-2 text-xs"
        >
          {/* Room Selector */}
          <WorkspaceSelectDropdown
            rooms={rooms}
            selectedRoom={modalRoom}
            onSelectRoom={setModalRoom}
          />

          {/* Meeting Title & Attendees in 1 ultra-slim row */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="col-span-2">
              <label className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
                Meeting Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={bookingForm.title}
                onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                placeholder="e.g. Team Sync"
                className="w-full px-2 py-1 h-7 bg-slate-50/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-900 dark:text-slate-100 focus:bg-white focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
                Attendees
              </label>
              <input
                type="number"
                min={1}
                max={modalRoom.capacity || 100}
                value={bookingForm.attendees_count}
                onChange={(e) => setBookingForm({ ...bookingForm, attendees_count: Number(e.target.value) || 1 })}
                className="w-full px-1.5 py-1 h-7 bg-slate-50/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-900 dark:text-slate-100 focus:bg-white focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400 shadow-2xs text-center"
              />
            </div>
          </div>

          {/* Quick Titles */}
          <div className="flex flex-wrap gap-1">
            {QUICK_TITLES.slice(0, 4).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setBookingForm({ ...bookingForm, title: t })}
                className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[8.5px] font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {t}
              </button>
            ))}
          </div>

          {/* Date & Time */}
          <BookingModalDateTimeInputs
            bookingForm={bookingForm}
            setBookingForm={setBookingForm}
          />

          {/* Collapsible Additional Options */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowExtras(!showExtras)}
              className="w-full flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-[10px] font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <i className="ri-magic-line text-[#253C7D] dark:text-sky-400 text-xs" />
                <span>Equipment & Refreshments (Optional)</span>
                {hasExtrasSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </div>
              <i className={`ri-arrow-down-s-line text-xs transition-transform duration-200 ${showExtras ? "rotate-180" : ""}`} />
            </button>

            {showExtras && (
              <div className="mt-1.5 space-y-2 p-2 bg-slate-50/60 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700 animate-in fade-in duration-150">
                <RequirementsSelectDropdown
                  selectedReqs={bookingForm.selected_requirements}
                  onToggleReq={toggleReq}
                  onSetReqs={setReqs}
                  customReq={bookingForm.custom_requirements}
                  setCustomReq={(val) => setBookingForm({ ...bookingForm, custom_requirements: val })}
                />
                <RefreshmentsSelectDropdown
                  selectedRef={bookingForm.selected_refreshments}
                  onToggleRef={toggleRef}
                  onSetRefs={setRefs}
                  customRef={bookingForm.custom_refreshments}
                  setCustomRef={(val) => setBookingForm({ ...bookingForm, custom_refreshments: val })}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1 px-3.5 py-1 text-xs font-bold text-white bg-[#253C7D] hover:bg-[#1E3064] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <i className="ri-calendar-check-line text-xs" />
              <span>{saving ? "Saving..." : editingBooking ? "Update" : "Confirm"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
