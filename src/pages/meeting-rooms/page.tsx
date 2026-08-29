import { MeetingRoomsHeader } from "./components/MeetingRoomsHeader";
import { MeetingRoomsStatsRow } from "./components/MeetingRoomsStatsRow";
import { MeetingRoomsFilterBar } from "./components/MeetingRoomsFilterBar";
import { TimelineViewContent } from "./components/timeline/TimelineViewContent";
import { MonthViewContent } from "./components/month/MonthViewContent";
import { RoomsCardsViewContent } from "./components/cards/RoomsCardsViewContent";
import { BookingModal } from "./components/modals/BookingModal";
import { BookingDetailModal } from "./components/modals/BookingDetailModal";
import { ApprovalReviewModal } from "./components/modals/ApprovalReviewModal";
import { CancellationReasonModal } from "./components/modals/CancellationReasonModal";
import { CreateRoomModal } from "./components/modals/CreateRoomModal";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useMeetingRooms } from "./hooks/useMeetingRooms";
import { useState } from "react";

export default function MeetingRoomsPage() {
  const {
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    canApprove,
    rooms,
    bookings,
    employeeId,
    currentEmployee,
    loading,
    role,
    user,
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    filterFloor,
    setFilterFloor,
    filterRoomId,
    setFilterRoomId,
    searchQuery,
    setSearchQuery,
    statusTab,
    setStatusTab,
    shiftDate,
    shiftMonth,
    jumpToToday,
    filteredRooms,
    activeDateBookings,
    pendingCount,
    todayBookingsCount,
    floor3RoomsCount,
    floor5RoomsCount,
    modalRoom,
    setModalRoom,
    editingBooking,
    selectedBooking,
    setSelectedBooking,
    saving,
    bookingForm,
    setBookingForm,
    reasonModal,
    setReasonModal,
    approvalModal,
    setApprovalModal,
    openBookModal,
    openEditModal,
    handleBook,
    handleCancelOwnBooking,
    loadBookings,
    toast,
    showToast,
  } = useMeetingRooms();

  const [createRoomOpen, setCreateRoomOpen] = useState(false);

  if (loading && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="w-full min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
        <PartnerBranchPrivacyShield
          moduleName="Meeting Rooms & Reservations"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 left-4 right-4 sm:top-6 sm:right-6 sm:left-auto sm:max-w-sm z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md text-[13px] font-medium transition-all transform animate-in slide-in-from-top-4 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-700/50 text-emerald-100"
              : toast.type === "error"
              ? "bg-rose-950/90 border-rose-700/50 text-rose-100"
              : "bg-slate-900/90 border-slate-700/50 text-white"
          }`}
        >
          <i
            className={`${
              toast.type === "success"
                ? "ri-checkbox-circle-fill text-emerald-400"
                : toast.type === "error"
                ? "ri-error-warning-fill text-rose-400"
                : "ri-information-fill text-sky-400"
            } text-lg`}
          />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <MeetingRoomsHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenBookModal={() => openBookModal()}
        canManageRooms={canApprove}
        onCreateRoom={() => setCreateRoomOpen(true)}
      />

      {/* Stats Row */}
      <MeetingRoomsStatsRow
        totalRoomsCount={rooms.length}
        floor3Count={floor3RoomsCount}
        floor5Count={floor5RoomsCount}
        todayBookingsCount={todayBookingsCount}
        pendingCount={pendingCount}
        onFilterFloor={setFilterFloor}
        onSelectStatusTab={setStatusTab}
      />

      {/* Filters & Date Bar */}
      <MeetingRoomsFilterBar
        selectedDate={selectedDate}
        onShiftDate={shiftDate}
        onJumpToToday={jumpToToday}
        filterFloor={filterFloor}
        setFilterFloor={setFilterFloor}
        filterRoomId={filterRoomId}
        setFilterRoomId={setFilterRoomId}
        rooms={rooms}
        statusTab={statusTab}
        setStatusTab={setStatusTab}
        pendingCount={pendingCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* View 1: Timeline Grid */}
      {viewMode === "timeline" && (
        <TimelineViewContent
          rooms={filteredRooms}
          bookings={activeDateBookings}
          onOpenBookModal={(room, start) => openBookModal(room, selectedDate, start)}
          onSelectBooking={setSelectedBooking}
        />
      )}

      {/* View 2: Month Calendar Grid */}
      {viewMode === "month" && (
        <MonthViewContent
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onShiftMonth={shiftMonth}
          onJumpToToday={jumpToToday}
          bookings={bookings}
          rooms={rooms}
          onSelectBooking={setSelectedBooking}
          onOpenBookModal={() => openBookModal(undefined, selectedDate)}
        />
      )}

      {/* View 3: Room Overview Cards */}
      {viewMode === "cards" && (
        <RoomsCardsViewContent
          rooms={filteredRooms}
          bookings={bookings}
          onOpenBookModal={(room) => openBookModal(room, selectedDate)}
          onSelectBooking={setSelectedBooking}
        />
      )}

      {/* Booking Form Modal */}
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

      {/* Booking Drawer Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        rooms={rooms}
        onClose={() => setSelectedBooking(null)}
        employeeId={employeeId}
        userEmail={user?.email}
        canApprove={canApprove}
        onOpenEditModal={openEditModal}
        onCancelOwnBooking={handleCancelOwnBooking}
        onOpenApprovalModal={(b) =>
          setApprovalModal({
            isOpen: true,
            booking: b,
            approvedReqs: [],
            declinedReqs: [],
            approvedRef: [],
            declinedRef: [],
            notes: "",
          })
        }
        onOpenReasonModal={(b, action) =>
          setReasonModal({ isOpen: true, booking: b, action, reason: "" })
        }
      />

      {/* Manager Approval Modal */}
      <ApprovalReviewModal
        approvalModal={approvalModal}
        onClose={() => setApprovalModal((prev) => ({ ...prev, isOpen: false, booking: null }))}
        rooms={rooms}
        currentEmployee={currentEmployee}
        roleName={role?.name}
        loadBookings={loadBookings}
        showToast={showToast}
      />

      {/* Rejection / Cancellation Modal */}
      <CancellationReasonModal
        reasonModal={reasonModal}
        setReasonModal={setReasonModal}
        onClose={() => setReasonModal((prev) => ({ ...prev, isOpen: false, booking: null }))}
        rooms={rooms}
        currentEmployee={currentEmployee}
        roleName={role?.name}
        loadBookings={loadBookings}
        showToast={showToast}
      />
      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={createRoomOpen}
        onClose={() => setCreateRoomOpen(false)}
        onCreated={loadRooms}
        showToast={(type, msg) => showToast(type as any, msg)}
      />
    </div>
  );
}
