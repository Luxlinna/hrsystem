import { memo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/notify";
import { logActivity } from "@/lib/audit";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import type { MeetingRoom, ApprovalModalState, BookingEmployee } from "../../types";
import { FloorBadge } from "../FloorBadge";
import { getRoomFloor, fmtTime, formatDateDisplay } from "../../roomUtils";
import { ApprovalReviewItemsList } from "./ApprovalReviewItemsList";

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
      const rawReqs = (booking.special_requirements || "").split(",").map((s) => s.trim()).filter((s) => s && s !== "None");
      setApprovedReqs(rawReqs);
      setDeclinedReqs([]);
      const rawRef = (booking.refreshments || "").split(",").map((s) => s.trim()).filter((s) => s && s !== "None");
      setApprovedRef(rawRef);
      setDeclinedRef([]);
      setNotes("");
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const targetRoom = rooms.find((r) => r.id === booking.room_id);
  const roomFloor = getRoomFloor(targetRoom);
  const isVIP = roomFloor === 5;

  const toggleReq = (item: string) => {
    if (approvedReqs.includes(item)) {
      setApprovedReqs((p) => p.filter((x) => x !== item));
      setDeclinedReqs((p) => [...p, item]);
    } else {
      setDeclinedReqs((p) => p.filter((x) => x !== item));
      setApprovedReqs((p) => [...p, item]);
    }
  };

  const toggleRef = (item: string) => {
    if (approvedRef.includes(item)) {
      setApprovedRef((p) => p.filter((x) => x !== item));
      setDeclinedRef((p) => [...p, item]);
    } else {
      setDeclinedRef((p) => p.filter((x) => x !== item));
      setApprovedRef((p) => [...p, item]);
    }
  };

  const handleConfirmApproval = async () => {
    setProcessing(true);
    const approverName = currentEmployee ? `${currentEmployee.first_name} ${currentEmployee.last_name}` : "Management";

    let targetBookingId = booking.id;
    const isSynthetic = booking.id.startsWith("training-");

    if (isSynthetic) {
      // Find matching real booking in database
      const { data: matched } = await supabase
        .from("room_bookings")
        .select("id")
        .eq("room_id", booking.room_id)
        .eq("date", booking.date)
        .maybeSingle();

      if (matched) {
        targetBookingId = matched.id;
      }
    }

    let error: any = null;

    if (!isSynthetic || targetBookingId !== booking.id) {
      const { error: updateErr } = await supabase
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
        .eq("id", targetBookingId);
      error = updateErr;
    } else {
      // If no database row existed yet, insert an approved reservation
      const { data: inserted, error: insertErr } = await supabase
        .from("room_bookings")
        .insert({
          room_id: booking.room_id,
          booked_by: booking.booked_by && !booking.booked_by.includes(" ") ? booking.booked_by : currentEmployee?.id,
          title: booking.title,
          date: booking.date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          attendees_count: booking.attendees_count || 10,
          status: "approved",
          approved_by: currentEmployee?.id,
          approved_at: new Date().toISOString(),
          approved_requirements: approvedReqs.join(", ") || "None",
          declined_requirements: declinedReqs.join(", ") || "None",
          approved_refreshments: approvedRef.join(", ") || "None",
          declined_refreshments: declinedRef.join(", ") || "None",
          approval_notes: notes.trim() || null,
        })
        .select()
        .single();
      error = insertErr;
      if (inserted) targetBookingId = inserted.id;
    }

    setProcessing(false);
    if (error) {
      console.error("Approval error:", error);
      return showToast("error", "Failed to approve booking.");
    }

    await notify({
      source: "meeting_rooms",
      type: "info",
      title: "Meeting Room Booking Approved",
      message: `Your reservation for ${targetRoom?.name} on ${booking.date} (${fmtTime(booking.start_time)}–${fmtTime(booking.end_time)}) was approved.`,
      entityId: targetBookingId,
    });

    notifyTelegramEvent(
      `✅ <b>Room Booking Approved</b>\n\n🏢 <b>Room:</b> ${escapeTelegramHtml(targetRoom?.name || "")} (Floor ${roomFloor})\n📅 <b>When:</b> ${booking.date}, ${fmtTime(booking.start_time)}–${fmtTime(booking.end_time)}\n📌 <b>Title:</b> ${escapeTelegramHtml(booking.title)}\n👤 <b>Approved By:</b> ${escapeTelegramHtml(approverName)}`,
      { text: "Open in HR Nexus", url: hrNexusUrl("/meeting-rooms") }
    );

    logActivity({
      module: "meeting_rooms",
      action: "updated",
      entityType: "room_booking",
      entityId: targetBookingId,
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
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-wider block">MANAGER APPROVAL REVIEW</span>
            <h3 className="text-base font-extrabold text-gray-900 mt-0.5">Approve Meeting Reservation</h3>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer">
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Workspace:</span>
            <div className="flex items-center gap-1.5 font-bold text-gray-900">
              <span>{targetRoom?.name}</span>
              <FloorBadge floor={roomFloor} size="sm" isVIP={isVIP} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Date &amp; Time:</span>
            <span className="font-bold text-gray-900">{formatDateDisplay(booking.date)} &middot; {fmtTime(booking.start_time)}–{fmtTime(booking.end_time)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Requested By:</span>
            <span className="font-bold text-gray-900">{booking.employees?.first_name} {booking.employees?.last_name}</span>
          </div>
        </div>

        <ApprovalReviewItemsList
          approvedReqs={approvedReqs}
          declinedReqs={declinedReqs}
          onToggleReq={toggleReq}
          approvedRef={approvedRef}
          declinedRef={declinedRef}
          onToggleRef={toggleRef}
        />

        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Approval Note / Instructions (Optional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Confirmed with Facilities team..."
            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-100 cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmApproval}
            disabled={processing}
            className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
          >
            {processing ? "Approving..." : "Confirm Approval"}
          </button>
        </div>
      </div>
    </div>
  );
});
