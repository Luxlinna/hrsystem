import { useState } from "react";
import { MeetingRoomsHeader } from "./components/MeetingRoomsHeader";
import { MeetingRoomsStatsRow } from "./components/MeetingRoomsStatsRow";
import { MeetingRoomsFilterBar } from "./components/MeetingRoomsFilterBar";
import { TimelineViewContent } from "./components/timeline/TimelineViewContent";
import { MonthViewContent } from "./components/month/MonthViewContent";
import { RoomsCardsViewContent } from "./components/cards/RoomsCardsViewContent";
import { MeetingRoomsModalsContainer } from "./components/modals/MeetingRoomsModalsContainer";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useMeetingRooms } from "./hooks/useMeetingRooms";

export default function MeetingRoomsPage() {
  const m = useMeetingRooms();
  const [createRoomOpen, setCreateRoomOpen] = useState(false);

  if (m.loading && m.rooms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (m.isPartnerBranchBlocked) {
    return (
      <div className="w-full min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
        <PartnerBranchPrivacyShield
          moduleName="Meeting Rooms & Reservations"
          userBranchName={m.userBranchName}
          hasNoBranch={!m.userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
      {m.toast && (
        <div
          className={`fixed top-4 left-4 right-4 sm:top-6 sm:right-6 sm:left-auto sm:max-w-sm z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md text-[13px] font-medium transition-all transform animate-in slide-in-from-top-4 duration-200 ${
            m.toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-700/50 text-emerald-100"
              : m.toast.type === "error"
              ? "bg-rose-950/90 border-rose-700/50 text-rose-100"
              : "bg-slate-900/90 border-slate-700/50 text-white"
          }`}
        >
          <i
            className={`${
              m.toast.type === "success"
                ? "ri-checkbox-circle-fill text-emerald-400"
                : m.toast.type === "error"
                ? "ri-error-warning-fill text-rose-400"
                : "ri-information-fill text-sky-400"
            } text-lg`}
          />
          <span>{m.toast.message}</span>
        </div>
      )}

      <MeetingRoomsHeader
        viewMode={m.viewMode}
        setViewMode={m.setViewMode}
        onOpenBookModal={() => m.openBookModal()}
        canManageRooms={m.canApprove}
        onCreateRoom={() => setCreateRoomOpen(true)}
      />

      <MeetingRoomsStatsRow
        totalRoomsCount={m.rooms.length}
        floor3Count={m.floor3RoomsCount}
        floor5Count={m.floor5RoomsCount}
        todayBookingsCount={m.todayBookingsCount}
        pendingCount={m.pendingCount}
        onFilterFloor={m.setFilterFloor}
        onSelectStatusTab={m.setStatusTab}
      />

      <MeetingRoomsFilterBar
        selectedDate={m.selectedDate}
        onShiftDate={m.shiftDate}
        onJumpToToday={m.jumpToToday}
        filterFloor={m.filterFloor}
        setFilterFloor={m.setFilterFloor}
        filterRoomId={m.filterRoomId}
        setFilterRoomId={m.setFilterRoomId}
        rooms={m.rooms}
        statusTab={m.statusTab}
        setStatusTab={m.setStatusTab}
        pendingCount={m.pendingCount}
        searchQuery={m.searchQuery}
        setSearchQuery={m.setSearchQuery}
      />

      {m.viewMode === "timeline" && (
        <TimelineViewContent
          rooms={m.filteredRooms}
          bookings={m.activeDateBookings}
          onOpenBookModal={(room, start) => m.openBookModal(room, m.selectedDate, start)}
          onSelectBooking={m.setSelectedBooking}
        />
      )}

      {m.viewMode === "month" && (
        <MonthViewContent
          selectedDate={m.selectedDate}
          setSelectedDate={m.setSelectedDate}
          onShiftMonth={m.shiftMonth}
          onJumpToToday={m.jumpToToday}
          bookings={m.bookings}
          rooms={m.rooms}
          onSelectBooking={m.setSelectedBooking}
          onOpenBookModal={() => m.openBookModal(undefined, m.selectedDate)}
        />
      )}

      {m.viewMode === "cards" && (
        <RoomsCardsViewContent
          rooms={m.filteredRooms}
          bookings={m.bookings}
          onOpenBookModal={(room) => m.openBookModal(room, m.selectedDate)}
          onSelectBooking={m.setSelectedBooking}
          canManageRooms={m.canApprove}
          onDeleteRoom={m.deleteRoom}
        />
      )}

      <MeetingRoomsModalsContainer
        {...m}
        createRoomOpen={createRoomOpen}
        setCreateRoomOpen={setCreateRoomOpen}
      />
    </div>
  );
}
