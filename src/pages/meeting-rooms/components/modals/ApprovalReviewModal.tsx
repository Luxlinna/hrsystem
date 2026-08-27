import { memo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/notify";
import { logActivity } from "@/lib/audit";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import type { Booking, MeetingRoom, ApprovalModalState, BookingEmployee } from "../../types";
import { FloorBadge } from "../FloorBadge";
import { getRoomFloor, fmtTime, formatDateDisplay } from "../../roomUtils";

interface ApprovalReviewModalProps {
  approvalModal: ApprovalModalState;
  onClose: () => void;
  rooms: MeetingRoom[];
  currentEmployee: BookingEmployee | null;
  roleName?: string;
  loadBookings: () => Promise<void>;
  showToast: (type: "success" | "error" | "info", message: string) => void;
}

export const ApprovalReviewModal = memo(function ApprovalReviewModal({
  approvalModal,
  onClose,
  rooms,
  currentEmployee,
  roleName = "Manager",
  loadBookings,
  showToast,
}: ApprovalReviewModalProps) {
  const { isOpen, booking } = approvalModal;
  const [approvedReqs, setApprovedReqs] = useState<string[]>([]);
  const [declinedReqs, setDeclinedReqs] = useState<string[]>([]);
  const [approvedRef, setApprovedRef] = useState<string[]>([]);
  const [declinedRef, setDeclinedRef] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (booking) {
      const rawReqs = (booking.special_requirements || "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s && s !== "None");
      setApprovedReqs(rawReqs);
      setDeclinedReqs([]);

      const rawRef = (booking.refreshments || "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s && s !== "None");
      setApprovedRef(rawRef);
      setDeclinedRef([]);
      setNotes("");
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const targetRoom = rooms.find((r) => r.id === booking.room_id);
  const roomFloor = getRoomFloor(targetRoom);
  const isVIP = roomFloor === 5;

  const handleConfirmApproval = async () => {
    setProcessing(true);
    const approverName = currentEmployee
      ? `${currentEmployee.first_name} ${currentEmployee.last_name}`
      : "Management";

    const { error } = await supabase
      .from("room_bookings")
      .update({
        status: "approved",
        approved_by: currentEmployee?.id,
        approved_at: new Date().toISOString(),
        approved_requirements: approvedReqs.join(", ") || "None",
        declined_requirements: declinedReqs.join(", ") || "None",
        approved_refreshments: approvedRef.join(", ") || "None",
        declined_refreshments: declinedRef.join(", ") || "None",
        approval_notes: notes.trim() || null,
      })
      .eq("id", booking.id);

    setProcessing(false);

    if (error) {
      showToast("error", "Failed to approve booking.");
      return;
    }

    await notify({
      source: "meeting_rooms",
      type: "info",
      title: "Meeting Room Booking Approved",
      message: `Your reservation for ${targetRoom?.name} on ${booking.date} (${fmtTime(booking.start_time)}–${fmtTime(booking.end_time)}) was approved.`,
      entityId: booking.id,
    });

    notifyTelegramEvent(
      `✅ <b>Room Booking Approved</b>\n\n🏢 <b>Room:</b> ${escapeTelegramHtml(targetRoom?.name || "")} (Floor ${roomFloor})\n📅 <b>When:</b> ${booking.date}, ${fmtTime(booking.start_time)}–${fmtTime(booking.end_time)}\n📌 <b>Title:</b> ${escapeTelegramHtml(booking.title)}\n👤 <b>Approved By:</b> ${escapeTelegramHtml(approverName)}`,
      { text: "Open in HR Nexus", url: hrNexusUrl("/meeting-rooms") }
    );

    logActivity({
      module: "meeting_rooms",
      action: "updated",
      entityType: "room_booking",
      entityId: booking.id,
      actorName: approverName,
      actorRole: roleName,
      description: `Approved booking for ${targetRoom?.name}: "${booking.title}"`,
    });

    showToast("success", "Reservation approved!");
    onClose();
    loadBookings();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-wider block">
              MANAGER APPROVAL REVIEW
            </span>
            <h3 className="text-base font-extrabold text-gray-900 mt-0.5">Approve Meeting Reservation</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Overview */}
        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 mb-4 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Workspace:</span>
            <div className="flex items-center gap-1.5 font-bold text-gray-900">
              <span>{targetRoom?.name}</span>
              <FloorBadge floor={roomFloor} size="sm" isVIP={isVIP} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Date & Time:</span>
            <span className="font-extrabold text-gray-900">
              {formatDateDisplay(booking.date)} ({fmtTime(booking.start_time)} - {fmtTime(booking.end_time)})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Organizer:</span>
            <span className="font-bold text-gray-900">
              {booking.employees?.first_name} {booking.employees?.last_name} ({booking.employees?.department})
            </span>
          </div>
        </div>

        {/* Requirements Selection */}
        {approvedReqs.length > 0 && (
          <div className="mb-3.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Equipment / IT Support Requested
            </label>
            <div className="flex flex-wrap gap-1.5">
              {approvedReqs.map((req) => (
                <span
                  key={req}
                  className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold"
                >
                  ✓ {req}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Refreshments Selection */}
        {approvedRef.length > 0 && (
          <div className="mb-3.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Refreshments / Catering Requested
            </label>
            <div className="flex flex-wrap gap-1.5">
              {approvedRef.map((ref) => (
                <span
                  key={ref}
                  className="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold"
                >
                  ✓ {ref}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Manager Notes */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Managerial Approval Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes for facilities or front desk staff..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={handleConfirmApproval}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {processing ? "Approving..." : "Confirm & Approve Reservation"}
          </button>
        </div>
      </div>
    </div>
  );
});
