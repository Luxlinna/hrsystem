import { memo, useState } from "react";
import type { MeetingRoom } from "../../types";

interface RoomFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: MeetingRoom[];
  selectedRoomTypes: string[];
  setSelectedRoomTypes: (types: string[]) => void;
  capacityFilter: string;
  setCapacityFilter: (cap: string) => void;
  availabilityFilter: string;
  setAvailabilityFilter: (avail: string) => void;
  onReset: () => void;
}

export const RoomFilterModal = memo(function RoomFilterModal({
  isOpen,
  onClose,
  rooms,
  selectedRoomTypes,
  setSelectedRoomTypes,
  capacityFilter,
  setCapacityFilter,
  availabilityFilter,
  setAvailabilityFilter,
  onReset,
}: RoomFilterModalProps) {
  const [localTypes, setLocalTypes] = useState<string[]>(selectedRoomTypes);
  const [localCap, setLocalCap] = useState<string>(capacityFilter);
  const [localAvail, setLocalAvail] = useState<string>(availabilityFilter);

  if (!isOpen) return null;

  const uniqueNames = Array.from(new Set(rooms.map((r) => r.name)));

  const handleApply = () => {
    setSelectedRoomTypes(localTypes);
    setCapacityFilter(localCap);
    setAvailabilityFilter(localAvail);
    onClose();
  };

  const handleReset = () => {
    setLocalTypes([]);
    setLocalCap("all");
    setLocalAvail("all");
    onReset();
    onClose();
  };

  const toggleType = (name: string) => {
    setLocalTypes((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border-t sm:border border-slate-200/80 dark:border-slate-800 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Room Filter</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Room Type */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Room Type</p>
          <div className="space-y-2">
            {uniqueNames.map((name) => {
              const checked = localTypes.includes(name);
              return (
                <label key={name} className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-200 select-none">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleType(name)}
                    className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <span>{name}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Capacity */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Capacity</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "all", label: "All" },
              { id: "1-6", label: "1-6" },
              { id: "7-12", label: "7-12" },
              { id: "13+", label: "13+" },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setLocalCap(c.id)}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  localCap === c.id
                    ? "bg-[#253C7D] text-white dark:bg-sky-500 dark:text-slate-950 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Availability</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "all", label: "All" },
              { id: "available", label: "Available" },
              { id: "booked", label: "Booked" },
            ].map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setLocalAvail(a.id)}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  localAvail === a.id
                    ? "bg-[#253C7D] text-white dark:bg-sky-500 dark:text-slate-950 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={handleApply}
            className="w-full py-3 bg-[#253C7D] hover:bg-[#1E3064] dark:bg-sky-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer active:scale-98"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
});
