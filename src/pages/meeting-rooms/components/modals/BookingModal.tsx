import { memo, useCallback } from "react";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-gray-900">
                {editingBooking ? "Edit Reservation" : "Reserve Meeting Room"}
              </h3>
              <FloorBadge floor={roomFloor} size="sm" isVIP={isVIP} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {modalRoom.name} &middot; Floor {roomFloor} &middot; Max {modalRoom.capacity || "—"} ppl
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4 text-xs"
        >
          <WorkspaceSelectDropdown
            rooms={rooms}
            selectedRoom={modalRoom}
            onSelectRoom={setModalRoom}
          />

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Meeting Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={bookingForm.title}
              onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
              placeholder="e.g., Weekly Product Alignment"
              className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-2xl text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:border-[#253C7D] transition-colors"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_TITLES.slice(0, 4).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setBookingForm({ ...bookingForm, title: t })}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-semibold text-gray-600 transition-colors cursor-pointer"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <BookingModalDateTimeInputs
            bookingForm={bookingForm}
            setBookingForm={setBookingForm}
          />

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Attendees Count
            </label>
            <input
              type="number"
              min={1}
              max={modalRoom.capacity || 100}
              value={bookingForm.attendees_count}
              onChange={(e) => setBookingForm({ ...bookingForm, attendees_count: Number(e.target.value) || 1 })}
              className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-2xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

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

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-[#253C7D] hover:bg-[#1f336b] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : editingBooking ? "Update Reservation" : "Request Reservation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
