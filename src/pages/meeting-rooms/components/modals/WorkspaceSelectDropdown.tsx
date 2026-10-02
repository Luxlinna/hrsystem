import { memo, useState, useRef, useEffect } from "react";
import type { MeetingRoom } from "../../types";
import { FloorBadge } from "../FloorBadge";
import { getRoomFloor } from "../../roomUtils";

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
    <div className="relative" ref={dropdownRef}>
      <label className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
        Workspace <span className="text-rose-500">*</span>
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-2 py-1 h-7 bg-slate-50/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border rounded-lg text-xs text-left font-bold flex items-center justify-between gap-1.5 transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? "border-[#253C7D] ring-1 ring-[#253C7D]/20 bg-white"
            : "border-slate-200 dark:border-slate-700"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-4 h-4 rounded bg-[#253C7D]/10 dark:bg-sky-500/20 text-[#253C7D] dark:text-sky-400 flex items-center justify-center text-[10px] shrink-0">
            <i className="ri-door-open-line" />
          </div>
          <div className="min-w-0 flex items-center gap-1">
            <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">{selectedRoom.name}</p>
            <span className="text-[9.5px] text-slate-400 font-normal">
              (F{selectedFloor} &middot; {selectedRoom.capacity || "—"} ppl)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <FloorBadge floor={selectedFloor} size="sm" isVIP={isSelectedVIP} />
          <i className={`ri-arrow-down-s-line text-slate-400 text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-1 space-y-0.5 animate-in fade-in duration-100 max-h-44 overflow-y-auto">
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
                className={`p-1.5 rounded-lg flex items-center justify-between gap-1.5 cursor-pointer transition-colors ${
                  isSelected ? "bg-[#253C7D]/10 dark:bg-sky-500/20 text-[#253C7D] dark:text-sky-400" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className={`w-4 h-4 rounded flex items-center justify-center text-[9px] shrink-0 ${isSelected ? "bg-[#253C7D] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                    <i className="ri-door-open-line" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate">{r.name}</p>
                    <p className="text-[9px] text-slate-400 font-medium truncate">
                      Floor {floor} &middot; Max {r.capacity || "—"} ppl
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <FloorBadge floor={floor} size="sm" isVIP={isVIP} />
                  {isSelected && <i className="ri-check-line text-xs text-[#253C7D] font-bold" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
