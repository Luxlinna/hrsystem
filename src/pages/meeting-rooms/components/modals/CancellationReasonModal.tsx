import { memo } from "react";
import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/notify";
import { logActivity } from "@/lib/audit";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import type { MeetingRoom, ReasonModalState, BookingEmployee } from "../../types";
import { PRESET_CANCELLATION_REASONS } from "../../constants";
import { fmtTime } from "../../roomUtils";

interface CancellationReasonModalProps {
  reasonModal: ReasonModalState;
  setReasonModal: React.Dispatch<React.SetStateAction<ReasonModalState>>;
  onClose: () => void;
  rooms: MeetingRoom[];
  currentEmployee: BookingEmployee | null;
  roleName?: string;
  loadBookings: () => Promise<void>;
  showToast: (type: "success" | "error" | "info", message: string) => void;
}

export const CancellationReasonModal = memo(function CancellationReasonModal({
  reasonModal,
  setReasonModal,
  onClose,
  rooms,
  currentEmployee,
  roleName = "Manager",
  loadBookings,
  showToast,
}: CancellationReasonModalProps) {
  const { isOpen, booking, action, reason } = reasonModal;
  if (!isOpen || !booking) return null;

  const isReject = action === "reject";
  const targetRoom = rooms.find((r) => r.id === booking.room_id);

  const handleConfirm = async () => {
    const finalReason = reason.trim() || (isReject ? "Rejected by Admin" : "Cancelled by Admin");
    const actorName = currentEmployee
      ? `${currentEmployee.first_name} ${currentEmployee.last_name}`
      : "Management";

    const { error } = await supabase
      .from("room_bookings")
      .update({
        status: isReject ? "rejected" : "cancelled",
        rejection_reason: finalReason,
        cancelled_by: isReject ? undefined : currentEmployee?.id,
        cancelled_at: isReject ? undefined : new Date().toISOString(),
      })
      .eq("id", booking.id);

    if (error) {
      showToast("error", `Failed to ${action} booking.`);
      return;
    }

    await notify({
      source: "meeting_rooms",
      type: isReject ? "warning" : "info",
      title: `Meeting Room Booking ${isReject ? "Rejected" : "Cancelled"}`,
      message: `Your booking for ${targetRoom?.name} on ${booking.date} (${fmtTime(booking.start_time)}–${fmtTime(booking.end_time)}) was ${isReject ? "rejected" : "cancelled"}. Reason: ${finalReason}`,
      entityId: booking.id,
    });

    notifyTelegramEvent(
      `❌ <b>Room Booking ${isReject ? "Rejected" : "Cancelled"}</b>\n\n🏢 <b>Room:</b> ${escapeTelegramHtml(targetRoom?.name || "")}\n📅 <b>When:</b> ${booking.date}, ${fmtTime(booking.start_time)}–${fmtTime(booking.end_time)}\n📌 <b>Title:</b> ${escapeTelegramHtml(booking.title)}\n📝 <b>Reason:</b> ${escapeTelegramHtml(finalReason)}\n👤 <b>By:</b> ${escapeTelegramHtml(actorName)}`,
      { text: "Open in HR Nexus", url: hrNexusUrl("/meeting-rooms") }
    );

    logActivity({
      module: "meeting_rooms",
      action: isReject ? "rejected" : "cancelled",
      entityType: "room_booking",
      entityId: booking.id,
      actorName,
      actorRole: roleName,
      description: `${isReject ? "Rejected" : "Cancelled"} booking for ${targetRoom?.name}: "${booking.title}". Reason: ${finalReason}`,
    });

    showToast("success", `Booking ${isReject ? "rejected" : "cancelled"}.`);
    onClose();
    loadBookings();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg">
              <i className="ri-error-warning-line" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">
              {isReject ? "Reject Reservation" : "Cancel Reservation"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          Please specify why this reservation for{" "}
          <strong className="text-gray-800">{targetRoom?.name}</strong> on{" "}
          <strong className="text-gray-800">{booking.date}</strong> is being {action}ed.
        </p>

        {/* Preset Reasons */}
        <div className="mb-3 space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Quick Reason Presets
          </span>
          <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
            {PRESET_CANCELLATION_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReasonModal((prev) => ({ ...prev, reason: r }))}
                className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 text-left text-[11px] font-medium text-gray-700 transition-colors cursor-pointer"
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Reason */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Custom Explanation
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReasonModal((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Type explanation..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Confirm {isReject ? "Rejection" : "Cancellation"}
          </button>
        </div>
      </div>
    </div>
  );
});
