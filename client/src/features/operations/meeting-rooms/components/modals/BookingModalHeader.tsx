import { memo } from "react";
import type { MeetingRoom } from "../../types";
import { getRoomImage } from "../../roomUtils";

interface BookingModalHeaderProps {
  onClose: () => void;
  modalRoom: MeetingRoom;
  isEditing: boolean;
}

export const BookingModalHeader = memo(function BookingModalHeader({
  onClose,
  modalRoom,
  isEditing,
}: BookingModalHeaderProps) {
  const roomImage = getRoomImage(modalRoom);

  return (
    <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
      {/* Main Title Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all cursor-pointer active:scale-95 shrink-0"
            title="Back"
          >
            <i className="ri-arrow-left-line text-base sm:text-lg" />
          </button>

          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
              {isEditing ? "Update Meeting" : "Schedule Meeting"}
            </h2>
            <p className="text-[10.5px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 truncate">
              Safe and secure conference room &amp; facility reservation
            </p>
          </div>
        </div>

        {/* Room Photo Card (Visible on Tablet/Desktop) */}
        {modalRoom && (
          <div className="hidden sm:block relative w-32 h-14 rounded-xl overflow-hidden shadow-xs border border-slate-200/80 dark:border-slate-700 shrink-0">
            <img
              src={roomImage}
              alt={modalRoom.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end p-1">
              <span className="text-[9.5px] font-bold text-white px-1 py-0.5 rounded bg-black/40 backdrop-blur-xs truncate max-w-full">
                {modalRoom.name}
              </span>
            </div>
          </div>
        )}

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="flex sm:hidden w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shrink-0"
        >
          <i className="ri-close-line text-lg" />
        </button>
      </div>
    </div>
  );
});
