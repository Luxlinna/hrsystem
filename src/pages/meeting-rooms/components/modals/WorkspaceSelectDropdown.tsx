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
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
        Select Workspace <span className="text-rose-500">*</span>
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 bg-gray-50/80 hover:bg-white border rounded-2xl text-xs text-left font-bold flex items-center justify-between gap-2 transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? "border-[#253C7D] ring-2 ring-[#253C7D]/10 bg-white"
            : "border-gray-200/80 hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-sm shrink-0">
            <i className="ri-door-open-line" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{selectedRoom.name}</p>
            <p className="text-[10px] text-gray-400 font-medium truncate">
              Floor {selectedFloor} &middot; Max {selectedRoom.capacity || "—"} ppl
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <FloorBadge floor={selectedFloor} size="sm" isVIP={isSelectedVIP} />
          <i
            className={`ri-arrow-down-s-line text-gray-400 text-base transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#253C7D]" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200/90 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
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
                className={`p-2.5 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  isSelected ? "bg-[#253C7D]/5 text-[#253C7D]" : "hover:bg-gray-50 text-gray-800"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                      isSelected ? "bg-[#253C7D] text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <i className="ri-door-open-line" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{r.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium truncate">
                      Floor {floor} &middot; Max {r.capacity || "—"} ppl
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <FloorBadge floor={floor} size="sm" isVIP={isVIP} />
                  {isSelected && <i className="ri-check-line text-base text-[#253C7D] font-bold" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
