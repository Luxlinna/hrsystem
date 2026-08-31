import { memo } from "react";
import type { MeetingRoom, Booking } from "../../types";
import { FloorBadge } from "../FloorBadge";
import { getRoomFloor, fmtTime, formatDateDisplay } from "../../roomUtils";
import { BookingDetailActionButtons } from "./BookingDetailActionButtons";

interface BookingDetailModalProps {
  booking: Booking | null;
  rooms: MeetingRoom[];
  onClose: () => void;
  employeeId: string;
  userEmail?: string | null;
  canApprove: boolean;
  onOpenEditModal: (b: Booking) => void;
  onCancelOwnBooking: (b: Booking) => void;
  onOpenApprovalModal: (b: Booking) => void;
  onOpenReasonModal: (b: Booking, action: "reject" | "cancel") => void;
}

export const BookingDetailModal = memo(function BookingDetailModal({
  booking,
  rooms,
  onClose,
  employeeId,
  userEmail,
  canApprove,
  onOpenEditModal,
  onCancelOwnBooking,
  onOpenApprovalModal,
  onOpenReasonModal,
}: BookingDetailModalProps) {
  if (!booking) return null;

  const targetRoom = rooms.find((r) => r.id === booking.room_id);
  const roomFloor = getRoomFloor(targetRoom);
  const isVIP = roomFloor === 5;

  const isCreator =
    booking.booked_by === employeeId ||
    (Boolean(userEmail) && booking.employees?.email === userEmail);
  const isPending = booking.status === "pending";
  const isApproved = booking.status === "approved";

  const rawReqs = (booking.special_requirements || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && s.toLowerCase() !== "none");

  const rawRef = (booking.refreshments || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && s.toLowerCase() !== "none");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto space-y-4 text-xs">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Reservation Details
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full capitalize ${
                  isApproved
                    ? "bg-emerald-100 text-emerald-800"
                    : isPending
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {booking.status}
              </span>
            </div>
            <h3 className="text-lg font-black text-gray-900 mt-1">{booking.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Room / Workplace Card */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base shadow-xs"
                style={{ backgroundColor: targetRoom?.color || "#253C7D" }}
              >
                <i className="ri-door-open-line" />
              </div>
              <div>
                <p className="font-extrabold text-xs text-gray-900">{targetRoom?.name || "Meeting Room"}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Floor {roomFloor} Workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FloorBadge floor={roomFloor} size="sm" isVIP={isVIP} />
              <span className="text-[11px] font-bold text-gray-500 bg-white px-2 py-1 rounded-lg border border-gray-200">
                Max {targetRoom?.capacity || "—"} ppl
              </span>
            </div>
          </div>

          {/* Organizer Card */}
          <div className="flex items-center gap-3 p-3 bg-gray-50/60 rounded-2xl border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#1a2b5a] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
              {booking.employees?.first_name?.[0]}
              {booking.employees?.last_name?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-xs text-gray-900 truncate">
                  {booking.employees?.first_name} {booking.employees?.last_name}
                </p>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Organizer
                </span>
              </div>
              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                {booking.employees?.role || "Staff"} &middot; {booking.employees?.department || "General"}
              </p>
            </div>
          </div>

          {/* Date & Time + Attendees Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50/60 rounded-2xl border border-gray-100 space-y-1">
              <div className="flex items-center gap-1.5 text-gray-400">
                <i className="ri-calendar-line text-xs" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Date &amp; Time</span>
              </div>
              <p className="font-extrabold text-gray-900 text-xs">{formatDateDisplay(booking.date)}</p>
              <p className="text-[11px] font-semibold text-[#253C7D] flex items-center gap-1">
                <i className="ri-time-line text-xs" />
                <span>{fmtTime(booking.start_time)} &rarr; {fmtTime(booking.end_time)}</span>
              </p>
            </div>

            <div className="p-3 bg-gray-50/60 rounded-2xl border border-gray-100 space-y-1">
              <div className="flex items-center gap-1.5 text-gray-400">
                <i className="ri-group-line text-xs" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Attendees</span>
              </div>
              <p className="font-extrabold text-gray-900 text-xs">{booking.attendees_count || 1} people</p>
              <p className="text-[11px] text-gray-500">Seating Limit: {targetRoom?.capacity || "—"} seats</p>
            </div>
          </div>

          {/* Requested Equipment */}
          {rawReqs.length > 0 && (
            <div className="p-3.5 bg-gray-50/60 rounded-2xl border border-gray-100 space-y-2">
              <div className="flex items-center gap-1.5 text-gray-400">
                <i className="ri-tools-line text-xs" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Requested Equipment</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {rawReqs.map((req) => (
                  <span
                    key={req}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 shadow-2xs"
                  >
                    <i className="ri-checkbox-circle-fill text-[#253C7D] text-xs" />
                    <span>{req}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Refreshments */}
          {rawRef.length > 0 && (
            <div className="p-3.5 bg-gray-50/60 rounded-2xl border border-gray-100 space-y-2">
              <div className="flex items-center gap-1.5 text-gray-400">
                <i className="ri-cup-line text-xs" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Refreshments &amp; Catering</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {rawRef.map((ref) => (
                  <span
                    key={ref}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 shadow-2xs"
                  >
                    <i className="ri-cup-fill text-amber-600 text-xs" />
                    <span>{ref}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rejection / Cancellation Reason */}
          {booking.rejection_reason && (
            <div className="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-200 text-rose-900 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-700">
                <i className="ri-error-warning-line text-xs" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Manager Notes / Reason</span>
              </div>
              <p className="font-semibold text-xs text-rose-800">{booking.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <BookingDetailActionButtons
          booking={booking}
          isCreator={isCreator}
          isPending={isPending}
          isApproved={isApproved}
          canApprove={canApprove}
          onOpenEditModal={onOpenEditModal}
          onCancelOwnBooking={onCancelOwnBooking}
          onOpenApprovalModal={onOpenApprovalModal}
          onOpenReasonModal={onOpenReasonModal}
        />
      </div>
    </div>
  );
});
