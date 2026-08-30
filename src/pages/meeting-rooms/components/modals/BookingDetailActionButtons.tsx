import { memo } from "react";
import type { Booking } from "../../types";

interface BookingDetailActionButtonsProps {
  booking: Booking;
  isCreator: boolean;
  isPending: boolean;
  isApproved: boolean;
  canApprove: boolean;
  onOpenEditModal: (b: Booking) => void;
  onCancelOwnBooking: (b: Booking) => void;
  onOpenApprovalModal: (b: Booking) => void;
  onOpenReasonModal: (b: Booking, action: "reject" | "cancel") => void;
}

export const BookingDetailActionButtons = memo(function BookingDetailActionButtons({
  booking,
  isCreator,
  isPending,
  isApproved,
  canApprove,
  onOpenEditModal,
  onCancelOwnBooking,
  onOpenApprovalModal,
  onOpenReasonModal,
}: BookingDetailActionButtonsProps) {
  return (
    <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2 flex-wrap">
      {/* Creator actions for pending bookings */}
      {isCreator && isPending && (
        <>
          <button
            type="button"
            onClick={() => onCancelOwnBooking(booking)}
            className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel Request
          </button>
          <button
            type="button"
            onClick={() => onOpenEditModal(booking)}
            className="px-3.5 py-1.5 rounded-xl bg-[#253C7D] text-white hover:bg-[#1f336b] text-xs font-bold transition-colors cursor-pointer"
          >
            Edit Booking
          </button>
        </>
      )}

      {/* Admin / Manager Approval actions */}
      {canApprove && isPending && (
        <>
          <button
            type="button"
            onClick={() => onOpenReasonModal(booking, "reject")}
            className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => onOpenApprovalModal(booking)}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Approve
          </button>
        </>
      )}

      {/* Admin cancellation for approved bookings */}
      {canApprove && isApproved && (
        <button
          type="button"
          onClick={() => onOpenReasonModal(booking, "cancel")}
          className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
        >
          Cancel Reservation
        </button>
      )}
    </div>
  );
});
