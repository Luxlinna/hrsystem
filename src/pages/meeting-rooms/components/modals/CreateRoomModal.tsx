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
  branchId?: string | null;
  branchName?: string;
  branches?: { id: string; name: string }[];
  isSuperAdmin?: boolean;
}

const FLOOR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const CreateRoomModal = memo(function CreateRoomModal({
  isOpen,
  onClose,
  onCreated,
  showToast,
  branchId,
  branchName,
  branches = [],
  isSuperAdmin = false,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => branchId || (branches[0]?.id || ""));
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(10);
  const [floor, setFloor] = useState<number>(3);
  const [isOtherFloor, setIsOtherFloor] = useState(false);
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [customColor, setCustomColor] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "4K Display TV", "High-speed Wi-Fi", "AC Climate",
  ]);
  const [customAmenity, setCustomAmenity] = useState("");

  const reset = () => {
    setName(""); setCapacity(10); setFloor(3); setIsOtherFloor(false);
    setColor(COLOR_PRESETS[0]); setCustomColor("");
    setSelectedAmenities(["4K Display TV", "High-speed Wi-Fi", "AC Climate"]);
    setCustomAmenity("");
    setSelectedBranchId(branchId || (branches[0]?.id || ""));
  };

  const handleClose = () => { reset(); onClose(); };

  const toggleAmenity = (a: string) => {
    setSelectedAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
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
    const finalBranchId = selectedBranchId || branchId;
    if (!finalBranchId) {
      return showToast("error", "Branch assignment is required to create a room.");
    }

    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        capacity,
        floor,
        color: customColor || color,
        amenities: selectedAmenities,
        branch_id: finalBranchId,
      };

      const { error } = await supabase.from("meeting_rooms").insert(payload);
      if (error) throw error;
      
      const assignedBranchObj = branches.find((b) => b.id === finalBranchId);
      const displayBranchName = assignedBranchObj?.name || branchName;
      showToast("success", `Room "${name.trim()}" created successfully for ${displayBranchName || "your branch"}!`);
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
          {isSuperAdmin && branches.length > 1 ? (
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Branch Location <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-blue-950 font-medium">
              <i className="ri-building-line text-[#253C7D] text-base" />
              <span>
                Creating for Branch: <strong className="text-[#253C7D] font-bold">{branchName || "Current Branch"}</strong>
              </span>
            </div>
          )}

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
                value={isOtherFloor ? "other" : floor}
                onChange={(e) => {
                  if (e.target.value === "other") {
                    setIsOtherFloor(true);
                  } else {
                    setIsOtherFloor(false);
                    setFloor(Number(e.target.value) || 3);
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                {FLOOR_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    Floor {f}
                  </option>
                ))}
                <option value="other">Other...</option>
              </select>
              {isOtherFloor && (
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={floor}
                  onChange={(e) => setFloor(Number(e.target.value) || 1)}
                  placeholder="Enter floor number..."
                  className="w-full mt-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              )}
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
