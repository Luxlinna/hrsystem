import { memo, useState, useRef, useEffect } from "react";
import type { MeetingRoom } from "../../types";
import { FloorBadge } from "../FloorBadge";
import { getRoomFloor } from "../../roomUtils";
import { RoomGeometricIcon } from "@/components/icons/RoomGeometricIcon";

interface WorkspaceSelectDropdownProps {
  rooms: MeetingRoom[];
  selectedRoom: MeetingRoom;
  onSelectRoom: (room: MeetingRoom) => void;
}

export const WorkspaceSelectDropdown = memo(function WorkspaceSelectDropdown({
  rooms,
  selectedRoom,
  onSelectRoom,
}: WorkspaceSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedFloor = getRoomFloor(selectedRoom);
  const isSelectedVIP = selectedFloor === 5;

  return (
    <div className="relative space-y-1" ref={dropdownRef}>
      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
        Meeting Room <span className="text-rose-500">*</span>
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-2 py-1 h-8 bg-slate-50/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border rounded-xl text-xs text-left font-medium flex items-center justify-between gap-2 transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? "border-[#253C7D] ring-2 ring-[#253C7D]/20 bg-white dark:bg-slate-800"
            : "border-slate-200 dark:border-slate-700"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-[#253C7D]/10 dark:bg-sky-500/20 text-[#253C7D] dark:text-sky-400 flex items-center justify-center text-xs shrink-0">
            <RoomGeometricIcon className="w-3 h-3 text-[#253C7D] dark:text-sky-400" />
          </div>
          <div className="min-w-0 flex items-center gap-1.5 truncate">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {selectedRoom.name}
            </p>
            <span className="text-[9px] text-slate-400 font-normal">
              (Floor {selectedFloor} &middot; {selectedRoom.capacity || "—"} ppl)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <FloorBadge floor={selectedFloor} size="sm" isVIP={isSelectedVIP} />
          <i
            className={`ri-arrow-down-s-line text-slate-400 text-sm transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in duration-100 max-h-48 overflow-y-auto">
          {rooms.map((r) => {
            const floor = getRoomFloor(r);
            const isVIP = floor === 5;
            const isSelected = r.id === selectedRoom.id;

            return (
              <div
                key={r.id}
                onClick={() => {
                  onSelectRoom(r);
                  setIsOpen(false);
                }}
                className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[#253C7D]/10 dark:bg-sky-500/20 text-[#253C7D] dark:text-sky-400"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                      isSelected
                        ? "bg-[#253C7D] text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    <RoomGeometricIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{r.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      Floor {floor} &middot; Max {r.capacity || "—"} ppl
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <FloorBadge floor={floor} size="sm" isVIP={isVIP} />
                  {isSelected && (
                    <i className="ri-check-line text-sm text-[#253C7D] font-bold" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
