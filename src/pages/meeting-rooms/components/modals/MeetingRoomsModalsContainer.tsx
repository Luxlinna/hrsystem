import { memo } from "react";
import { BookingModal } from "./BookingModal";
import { BookingDetailModal } from "./BookingDetailModal";
import { ApprovalReviewModal } from "./ApprovalReviewModal";
import { CancellationReasonModal } from "./CancellationReasonModal";
import { CreateRoomModal } from "./CreateRoomModal";
import type { MeetingRoom, Booking, BookingFormData, ReasonModalState, ApprovalModalState, BookingEmployee } from "../../types";

interface MeetingRoomsModalsContainerProps {
  modalRoom: MeetingRoom | null;
  setModalRoom: (room: MeetingRoom | null) => void;
  rooms: MeetingRoom[];
  editingBooking: Booking | null;
  bookingForm: BookingFormData;
  setBookingForm: React.Dispatch<React.SetStateAction<BookingFormData>>;
  saving: boolean;
  handleBook: () => Promise<void>;

  selectedBooking: Booking | null;
  setSelectedBooking: (b: Booking | null) => void;
  employeeId: string;
  userEmail?: string | null;
  canApprove: boolean;
  openEditModal: (b: Booking) => void;
  handleCancelOwnBooking: (b: Booking) => Promise<void>;

  approvalModal: ApprovalModalState;
  setApprovalModal: React.Dispatch<React.SetStateAction<ApprovalModalState>>;
  reasonModal: ReasonModalState;
  setReasonModal: React.Dispatch<React.SetStateAction<ReasonModalState>>;

  currentEmployee: BookingEmployee | null;
  roleName?: string;
  loadBookings: () => Promise<void>;
  loadRooms: () => Promise<void>;
  showToast: (type: "success" | "error" | "info", message: string) => void;

  createRoomOpen: boolean;
  setCreateRoomOpen: (val: boolean) => void;
  targetBranch?: string | null;
  userBranchName?: string | null;
  effectiveBranchName?: string | null;
  branches?: any[];
  visibleBranches?: any[];
  isSuperAdmin?: boolean;
}

export const MeetingRoomsModalsContainer = memo(function MeetingRoomsModalsContainer({
  modalRoom,
  setModalRoom,
  rooms,
  editingBooking,
  bookingForm,
  setBookingForm,
  saving,
  handleBook,
  selectedBooking,
  setSelectedBooking,
  employeeId,
  userEmail,
  canApprove,
  openEditModal,
  handleCancelOwnBooking,
  approvalModal,
  setApprovalModal,
  reasonModal,
  setReasonModal,
  currentEmployee,
  roleName,
  loadBookings,
  loadRooms,
  showToast,
  createRoomOpen,
  setCreateRoomOpen,
  targetBranch,
  userBranchName,
  effectiveBranchName,
  branches,
  visibleBranches,
  isSuperAdmin,
}: MeetingRoomsModalsContainerProps) {
  return (
    <>
      <BookingModal
        isOpen={Boolean(modalRoom)}
        onClose={() => setModalRoom(null)}
        modalRoom={modalRoom}
        setModalRoom={setModalRoom}
        rooms={rooms}
        editingBooking={editingBooking}
        bookingForm={bookingForm}
        setBookingForm={setBookingForm}
        saving={saving}
        onSubmit={handleBook}
      />

      <BookingDetailModal
        booking={selectedBooking}
        rooms={rooms}
        onClose={() => setSelectedBooking(null)}
        employeeId={employeeId}
        userEmail={userEmail}
        canApprove={canApprove}
        onOpenEditModal={openEditModal}
        onCancelOwnBooking={handleCancelOwnBooking}
        onOpenApprovalModal={(b) => {
          setSelectedBooking(null);
          setApprovalModal({
            isOpen: true,
            booking: b,
            approvedReqs: [],
            declinedReqs: [],
            approvedRef: [],
            declinedRef: [],
            notes: "",
          });
        }}
        onOpenReasonModal={(b, action) => {
          setSelectedBooking(null);
          setReasonModal({ isOpen: true, booking: b, action, reason: "" });
        }}
      />

      <ApprovalReviewModal
        approvalModal={approvalModal}
        onClose={() => setApprovalModal((prev) => ({ ...prev, isOpen: false, booking: null }))}
        rooms={rooms}
        currentEmployee={currentEmployee}
        roleName={roleName}
        loadBookings={loadBookings}
        showToast={showToast}
      />

      <CancellationReasonModal
        reasonModal={reasonModal}
        setReasonModal={setReasonModal}
        onClose={() => setReasonModal((prev) => ({ ...prev, isOpen: false, booking: null }))}
        rooms={rooms}
        currentEmployee={currentEmployee}
        roleName={roleName}
        loadBookings={loadBookings}
        showToast={showToast}
      />

      <CreateRoomModal
        isOpen={createRoomOpen}
        onClose={() => setCreateRoomOpen(false)}
        onCreated={() => loadRooms()}
        showToast={(type, msg) => showToast(type as any, msg)}
        branchId={targetBranch}
        branchName={effectiveBranchName || userBranchName || undefined}
        branches={visibleBranches || branches}
        isSuperAdmin={isSuperAdmin}
      />
    </>
  );
});
