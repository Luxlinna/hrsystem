import { memo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { COLOR_PRESETS, AMENITY_ITEMS } from "../../constants";
import { ColorPickerRadioGroup } from "./ColorPickerRadioGroup";
import { AmenitiesSelectDropdown } from "./AmenitiesSelectDropdown";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  showToast: (type: string, message: string) => void;
}

export const CreateRoomModal = memo(function CreateRoomModal({
  isOpen,
  onClose,
  onCreated,
  showToast,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(10);
  const [floor, setFloor] = useState<number>(3);
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [customColor, setCustomColor] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "4K Display TV",
    "High-speed Wi-Fi",
    "AC Climate",
  ]);
  const [customAmenity, setCustomAmenity] = useState("");

  const reset = () => {
    setName("");
    setCapacity(10);
    setFloor(3);
    setColor(COLOR_PRESETS[0]);
    setCustomColor("");
    setSelectedAmenities(["4K Display TV", "High-speed Wi-Fi", "AC Climate"]);
    setCustomAmenity("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleAmenity = (a: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !selectedAmenities.includes(trimmed)) {
      setSelectedAmenities((prev) => [...prev, trimmed]);
    }
    setCustomAmenity("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) return showToast("error", "Room name is required.");
    setSaving(true);
    try {
      const { error } = await supabase.from("meeting_rooms").insert({
        name: name.trim(),
        capacity,
        floor,
        color: customColor || color,
      });
      if (error) throw error;
      showToast("success", `Room "${name.trim()}" created successfully!`);
      reset();
      onCreated();
      onClose();
    } catch (err: any) {
      showToast("error", err?.message || "Failed to create room.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Add New Meeting Room</h3>
            <p className="text-xs text-gray-400 mt-0.5">Configure room specs, capacity, and floor workspace</p>
          </div>
          <button type="button" onClick={handleClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer">
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Room Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Executive Boardroom A"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Seating Capacity (ppl)
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Floor Location
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value) || 3)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value={3}>Floor 3 - Team Workspaces</option>
                <option value={5}>Floor 5 - Executive VIP</option>
                <option value={1}>Floor 1 - Main Hub</option>
                <option value={2}>Floor 2 - Conference Hall</option>
              </select>
            </div>
          </div>

          <ColorPickerRadioGroup color={color} setColor={setColor} customColor={customColor} setCustomColor={setCustomColor} />
          <AmenitiesSelectDropdown
            selectedAmenities={selectedAmenities}
            onToggleAmenity={toggleAmenity}
            onSelectAll={() => setSelectedAmenities(AMENITY_ITEMS.map((o) => o.label))}
            onClearAll={() => setSelectedAmenities([])}
            customAmenity={customAmenity}
            setCustomAmenity={setCustomAmenity}
            onAddCustomAmenity={addCustomAmenity}
          />
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button type="button" onClick={handleClose} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-100 cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 text-xs font-bold text-white bg-[#253C7D] hover:bg-[#1f336b] rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Room"}
          </button>
        </div>
      </div>
    </div>
  );
});
