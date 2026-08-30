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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider block">
              RESERVATION DETAILS
            </span>
            <h3 className="text-base font-extrabold text-gray-900 mt-0.5">{booking.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer">
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <p className="font-extrabold text-xs text-gray-900">{targetRoom?.name || "Meeting Room"}</p>
              <p className="text-[11px] text-gray-400 font-medium">Floor {roomFloor} Workspace</p>
            </div>
            <div className="flex items-center gap-1.5">
              <FloorBadge floor={roomFloor} size="sm" isVIP={isVIP} />
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
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50/70 rounded-2xl border border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-[#253C7D]/10 text-[#253C7D] font-bold text-xs flex items-center justify-center shrink-0">
              {booking.employees?.first_name?.[0]}
              {booking.employees?.last_name?.[0]}
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-xs text-gray-900 truncate">
                {booking.employees?.first_name} {booking.employees?.last_name}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                {booking.employees?.role || "Staff"} &middot; {booking.employees?.department || "General"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Date &amp; Time</span>
              <p className="font-extrabold text-gray-900 mt-0.5">{formatDateDisplay(booking.date)}</p>
              <p className="text-[11px] text-gray-500">{fmtTime(booking.start_time)} &rarr; {fmtTime(booking.end_time)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Attendees</span>
              <p className="font-extrabold text-gray-900 mt-0.5">{booking.attendees_count || 1} people</p>
              <p className="text-[11px] text-gray-500">Room Max: {targetRoom?.capacity || "—"}</p>
            </div>
          </div>

          {booking.special_requirements && booking.special_requirements !== "None" && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Requested Equipment</span>
              <p className="font-semibold text-gray-700">{booking.special_requirements}</p>
            </div>
          )}

          {booking.refreshments && booking.refreshments !== "None" && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Refreshments</span>
              <p className="font-semibold text-gray-700">{booking.refreshments}</p>
            </div>
          )}

          {booking.rejection_reason && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-800">
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5">Manager Notes / Cancellation Reason</span>
              <p className="font-semibold">{booking.rejection_reason}</p>
            </div>
          )}
        </div>

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
