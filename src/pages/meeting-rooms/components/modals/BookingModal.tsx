import { memo } from "react";
import type { MeetingRoom, Booking, BookingFormData } from "../../types";
import { FloorBadge } from "../FloorBadge";
import { getRoomFloor, addMinutesToTime } from "../../roomUtils";
import {
  QUICK_TITLES,
  DURATION_OPTIONS,
  SPECIAL_REQUIREMENTS_OPTIONS,
  REFRESHMENTS_OPTIONS,
} from "../../constants";

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
  if (!isOpen || !modalRoom) return null;

  const roomFloor = getRoomFloor(modalRoom);
  const isVIP = roomFloor === 5;

  const toggleReq = (label: string) => {
    setBookingForm((prev) => {
      const exists = prev.selected_requirements.includes(label);
      return {
        ...prev,
        selected_requirements: exists
          ? prev.selected_requirements.filter((r) => r !== label)
          : [...prev.selected_requirements, label],
      };
    });
  };

  const toggleRef = (label: string) => {
    setBookingForm((prev) => {
      const exists = prev.selected_refreshments.includes(label);
      return {
        ...prev,
        selected_refreshments: exists
          ? prev.selected_refreshments.filter((r) => r !== label)
          : [...prev.selected_refreshments, label],
      };
    });
  };

  const applyDuration = (mins: number) => {
    const newEnd = addMinutesToTime(bookingForm.start_time, mins);
    setBookingForm((prev) => ({ ...prev, end_time: newEnd }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-extrabold text-gray-900">
                {editingBooking ? "Edit Reservation" : "Reserve Meeting Room"}
              </h3>
              <FloorBadge floor={roomFloor} size="sm" isVIP={isVIP} />
            </div>
            <p className="text-xs text-gray-400">
              {modalRoom.name} &middot; Floor {roomFloor} &middot; Max {modalRoom.capacity || "—"} ppl
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          {/* Room Selector */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Select Workspace *
            </label>
            <select
              value={modalRoom.id}
              onChange={(e) => {
                const found = rooms.find((r) => r.id === e.target.value);
                if (found) setModalRoom(found);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-bold focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (Floor {r.floor || 3}, Max {r.capacity || "—"} ppl)
                </option>
              ))}
            </select>
          </div>

          {/* Meeting Title & Quick Presets */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Meeting Title *
            </label>
            <input
              type="text"
              required
              value={bookingForm.title}
              onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
              placeholder="e.g., Weekly Product Alignment"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {QUICK_TITLES.slice(0, 4).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setBookingForm({ ...bookingForm, title: t })}
                  className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[10px] font-bold text-gray-600 transition-colors cursor-pointer"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Attendees */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={bookingForm.date}
                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Attendees (ppl) *
              </label>
              <input
                type="number"
                min={1}
                max={modalRoom.capacity || 50}
                required
                value={bookingForm.attendees_count}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, attendees_count: parseInt(e.target.value, 10) || 1 })
                }
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          {/* Start & End Time + Duration Chips */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  required
                  value={bookingForm.start_time}
                  onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  required
                  value={bookingForm.end_time}
                  onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Duration:</span>
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => applyDuration(opt.mins)}
                  className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[10px] font-bold text-gray-600 transition-colors cursor-pointer"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Special Requirements */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Required Equipment / Support
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {SPECIAL_REQUIREMENTS_OPTIONS.map((req) => {
                const isSelected = bookingForm.selected_requirements.includes(req.label);
                return (
                  <button
                    key={req.label}
                    type="button"
                    onClick={() => toggleReq(req.label)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition-all text-[11px] font-bold cursor-pointer ${
                      isSelected
                        ? "bg-[#253C7D] text-white border-[#253C7D] shadow-2xs"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <i className={`${req.icon} text-xs`} />
                    <span className="truncate">{req.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Refreshments */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Refreshments / Catering
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {REFRESHMENTS_OPTIONS.map((ref) => {
                const isSelected = bookingForm.selected_refreshments.includes(ref.label);
                return (
                  <button
                    key={ref.label}
                    type="button"
                    onClick={() => toggleRef(ref.label)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition-all text-[11px] font-bold cursor-pointer ${
                      isSelected
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <i className={`${ref.icon} text-xs`} />
                    <span className="truncate">{ref.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {saving
                ? "Processing..."
                : editingBooking
                ? "Save Changes"
                : "Submit Reservation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
