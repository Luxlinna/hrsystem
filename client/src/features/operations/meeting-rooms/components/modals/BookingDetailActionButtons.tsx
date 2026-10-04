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
    <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
      {/* Left side actions (Creator actions) */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {isCreator && isPending && (
          <>
            <button
              type="button"
              onClick={() => onCancelOwnBooking(booking)}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <i className="ri-delete-bin-line text-sm" />
              <span>Cancel Request</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenEditModal(booking)}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#253C7D] text-white hover:bg-[#1f336b] text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <i className="ri-edit-line text-sm" />
              <span>Edit Booking</span>
            </button>
          </>
        )}

        {canApprove && isApproved && (
          <button
            type="button"
            onClick={() => onOpenReasonModal(booking, "cancel")}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <i className="ri-close-circle-line text-sm" />
            <span>Cancel Reservation</span>
          </button>
        )}
      </div>

      {/* Right side actions (Admin/Approver actions) */}
      {canApprove && isPending && (
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => onOpenReasonModal(booking, "reject")}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <i className="ri-close-line text-sm" />
            <span>Decline</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenApprovalModal(booking)}
            className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5"
          >
            <i className="ri-checkbox-circle-line text-sm" />
            <span>Approve</span>
          </button>
        </div>
      )}
    </div>
  );
});
