import { memo } from "react";
import type { MeetingRoom, Booking } from "../../types";
import { TimelineHeader } from "./TimelineHeader";
import { TimelineRoomRow } from "./TimelineRoomRow";
import { MobileRoomScheduleList } from "./MobileRoomScheduleList";
import { MobileDayTimelineView } from "./MobileDayTimelineView";

interface TimelineViewContentProps {
  rooms: MeetingRoom[];
  bookings: Booking[];
  selectedDate?: string;
  onSelectDate?: (d: string) => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  onOpenBookModal: (room?: MeetingRoom, startTime?: string) => void;
  onSelectBooking: (b: Booking) => void;
  onResetFilters?: () => void;
  onCreateRoom?: () => void;
  canManageRooms?: boolean;
  totalRoomsCount?: number;
  onOpenFilter?: () => void;
  onSelectRoomDetails?: (room: MeetingRoom) => void;
  mobileViewStyle?: "timeline" | "cards";
}

export const TimelineViewContent = memo(function TimelineViewContent({
  rooms,
  bookings,
  selectedDate,
  onSelectDate,
  searchQuery,
  setSearchQuery,
  onOpenBookModal,
  onSelectBooking,
  onResetFilters,
  onCreateRoom,
  canManageRooms,
  totalRoomsCount = 0,
  onOpenFilter,
  onSelectRoomDetails,
  mobileViewStyle = "cards",
}: TimelineViewContentProps) {
  if (rooms.length === 0) {
    const isFilteredOut = totalRoomsCount > 0;
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 text-center shadow-2xs">
        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2">
          <i className="ri-door-open-line" />
        </div>
        <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100">No Meeting Rooms Found</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto">
          {isFilteredOut
            ? "No meeting rooms match your floor or search filters for this branch."
            : "No meeting rooms have been created for this branch yet."}
        </p>

        <div className="flex items-center justify-center gap-2.5 mt-4">
          {isFilteredOut && onResetFilters && (
            <button
              onClick={onResetFilters}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}

          {canManageRooms && onCreateRoom && (
            <button
              onClick={onCreateRoom}
              className="px-4 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-add-circle-line text-sm" />
              <span>Create New Room</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile-Friendly Schedule (Timeline Week Slots or Room Cards List) */}
      <div className="block sm:hidden">
        {mobileViewStyle === "timeline" && selectedDate && onSelectDate ? (
          <MobileDayTimelineView
            rooms={rooms}
            bookings={bookings}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            onOpenBookModal={(r, start) => onOpenBookModal(r, start)}
            onSelectBooking={onSelectBooking}
            onOpenFilter={onOpenFilter || (() => {})}
          />
        ) : (
          <MobileRoomScheduleList
            rooms={rooms}
            bookings={bookings}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenBookModal={(r, start) => onOpenBookModal(r, start)}
            onSelectBooking={onSelectBooking}
            onOpenFilter={onOpenFilter}
            onSelectRoomDetails={onSelectRoomDetails}
          />
        )}
      </div>

      {/* Desktop Wide Timeline Grid */}
      <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <TimelineHeader />

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {rooms.map((room) => {
              const roomBookings = bookings.filter((b) => b.room_id === room.id);
              return (
                <TimelineRoomRow
                  key={room.id}
                  room={room}
                  bookings={roomBookings}
                  onOpenBookModal={(r, start) => onOpenBookModal(r, start)}
                  onSelectBooking={onSelectBooking}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
