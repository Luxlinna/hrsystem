import { memo } from "react";
import { BookingModal } from "./BookingModal";
import { BookingDetailModal } from "./BookingDetailModal";
import { ApprovalReviewModal } from "./ApprovalReviewModal";
import { CancellationReasonModal } from "./CancellationReasonModal";
import { CreateRoomModal } from "./CreateRoomModal";
import { RoomDetailsModal } from "./RoomDetailsModal";
import { BookingSuccessModal } from "./BookingSuccessModal";
import { RoomFilterModal } from "./RoomFilterModal";
import type { MeetingRoom, Booking, BookingFormData, ReasonModalState, ApprovalModalState, BookingEmployee } from "../../types";

interface ModalsContainerProps {
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
  isHrDivisionScope?: boolean;
  selectedRoomDetails?: MeetingRoom | null;
  setSelectedRoomDetails?: (room: MeetingRoom | null) => void;
  successBooking?: { room: MeetingRoom; form: BookingFormData } | null;
  setSuccessBooking?: (val: { room: MeetingRoom; form: BookingFormData } | null) => void;
  filterModalOpen?: boolean;
  setFilterModalOpen?: (open: boolean) => void;
  selectedRoomTypes?: string[];
  setSelectedRoomTypes?: (types: string[]) => void;
  capacityFilter?: string;
  setCapacityFilter?: (cap: string) => void;
  availabilityFilter?: string;
  setAvailabilityFilter?: (avail: string) => void;
  onResetFilters?: () => void;
  bookings?: Booking[];
}

export const MeetingRoomsModalsContainer = memo(function MeetingRoomsModalsContainer(p: ModalsContainerProps) {
  return (
    <>
      <BookingModal
        isOpen={Boolean(p.modalRoom)}
        onClose={() => p.setModalRoom(null)}
        modalRoom={p.modalRoom}
        setModalRoom={p.setModalRoom}
        rooms={p.rooms}
        editingBooking={p.editingBooking}
        bookingForm={p.bookingForm}
        setBookingForm={p.setBookingForm}
        saving={p.saving}
        onSubmit={p.handleBook}
      />

      <RoomDetailsModal
        room={p.selectedRoomDetails || null}
        bookings={p.bookings || []}
        onClose={() => p.setSelectedRoomDetails && p.setSelectedRoomDetails(null)}
        onBookRoom={(r) => {
          p.setSelectedRoomDetails && p.setSelectedRoomDetails(null);
          p.setModalRoom(r);
        }}
      />

      {p.successBooking && (
        <BookingSuccessModal
          isOpen={Boolean(p.successBooking)}
          onClose={() => p.setSuccessBooking && p.setSuccessBooking(null)}
          room={p.successBooking.room}
          bookingForm={p.successBooking.form}
          onViewMyBookings={() => {
            p.setSuccessBooking && p.setSuccessBooking(null);
          }}
        />
      )}

      {p.filterModalOpen !== undefined && p.setFilterModalOpen && (
        <RoomFilterModal
          isOpen={p.filterModalOpen}
          onClose={() => p.setFilterModalOpen && p.setFilterModalOpen(false)}
          rooms={p.rooms}
          selectedRoomTypes={p.selectedRoomTypes || []}
          setSelectedRoomTypes={p.setSelectedRoomTypes || (() => {})}
          capacityFilter={p.capacityFilter || "all"}
          setCapacityFilter={p.setCapacityFilter || (() => {})}
          availabilityFilter={p.availabilityFilter || "all"}
          setAvailabilityFilter={p.setAvailabilityFilter || (() => {})}
          onReset={p.onResetFilters || (() => {})}
        />
      )}

      <BookingDetailModal
        booking={p.selectedBooking}
        rooms={p.rooms}
        onClose={() => p.setSelectedBooking(null)}
        employeeId={p.employeeId}
        userEmail={p.userEmail}
        canApprove={p.canApprove}
        onOpenEditModal={p.openEditModal}
        onCancelOwnBooking={p.handleCancelOwnBooking}
        onOpenApprovalModal={(b) => {
          p.setSelectedBooking(null);
          p.setApprovalModal({ isOpen: true, booking: b, approvedReqs: [], declinedReqs: [], approvedRef: [], declinedRef: [], notes: "" });
        }}
        onOpenReasonModal={(b, action) => {
          p.setSelectedBooking(null);
          p.setReasonModal({ isOpen: true, booking: b, action, reason: "" });
        }}
      />

      <ApprovalReviewModal
        approvalModal={p.approvalModal}
        onClose={() => p.setApprovalModal((prev) => ({ ...prev, isOpen: false, booking: null }))}
        rooms={p.rooms}
        currentEmployee={p.currentEmployee}
        roleName={p.roleName}
        loadBookings={p.loadBookings}
        showToast={p.showToast}
      />

      <CancellationReasonModal
        reasonModal={p.reasonModal}
        setReasonModal={p.setReasonModal}
        onClose={() => p.setReasonModal((prev) => ({ ...prev, isOpen: false, booking: null }))}
        rooms={p.rooms}
        currentEmployee={p.currentEmployee}
        roleName={p.roleName}
        loadBookings={p.loadBookings}
        showToast={p.showToast}
      />

      <CreateRoomModal
        isOpen={p.createRoomOpen}
        onClose={() => p.setCreateRoomOpen(false)}
        onCreated={() => p.loadRooms()}
        showToast={(type, msg) => p.showToast(type as any, msg)}
        branchId={p.targetBranch}
        branchName={p.effectiveBranchName || p.userBranchName || undefined}
        branches={p.isHrDivisionScope ? (p.branches || p.visibleBranches) : (p.branches || p.visibleBranches)?.filter((b: any) => b.id === p.targetBranch)}
        isSuperAdmin={Boolean(p.isHrDivisionScope)}
      />
    </>
  );
});
