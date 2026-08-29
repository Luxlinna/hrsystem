import { memo, useState } from "react";
import { supabase } from "@/lib/supabase";

const AMENITY_OPTIONS = [
  "4K Display TV",
  "Polycom Conference Mic",
  "Whiteboard",
  "High-speed Wi-Fi",
  "AC Climate",
  'Dual 75" 4K Displays',
  "Cisco Video Conf System",
  "Interactive Smartboard",
  "Conference Mic Array",
  "Dual 4K Projector & Screens",
  "Wireless Mics & Audio PA",
  "Modular Desks & Chairs",
  "Trainer Podium & Clicker",
  "Video Conference (Zoom/Teams)",
  "Extra Power Outlets",
  "Extra Chairs",
];

const COLOR_PRESETS = [
  "#253C7D",
  "#7C3AED",
  "#059669",
  "#DC2626",
  "#D97706",
  "#0891B2",
  "#BE185D",
  "#16A34A",
  "#9333EA",
  "#1D4ED8",
];

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

  // All hooks must be called before any early return
  const finalColor = customColor || color;

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
    if (!name.trim()) {
      showToast("error", "Room name is required.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("meeting_rooms").insert({
        name: name.trim(),
        capacity,
        floor,
        color: finalColor,
      });
      if (error) throw error;
      showToast("success", `Room "${name.trim()}" created successfully!`);
      reset();
      onCreated();
      onClose();
    } catch (err: any) {
      showToast("error", err.message || "Failed to create room.");
    } finally {
      setSaving(false);
    }
  };

  // Safe early return AFTER all hooks
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-sm"
      onClick={() => !saving && handleClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${finalColor}22`, color: finalColor }}
            >
              <i className="ri-building-4-line text-base" />
            </div>
            <h3 className="text-sm font-extrabold text-gray-900">
              Create New Meeting Room
            </h3>
          </div>
          <button
            onClick={handleClose}
            disabled={saving}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Room Name */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Room Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Executive Boardroom, Innovation Lab..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#253C7D] transition-colors"
            />
          </div>

          {/* Capacity & Floor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Capacity (people)
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={capacity}
                onChange={(e) =>
                  setCapacity(Math.max(1, Number(e.target.value)))
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#253C7D] transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Floor
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((f) => (
                  <option key={f} value={f}>
                    Floor {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Room Color
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setColor(c);
                    setCustomColor("");
                  }}
                  className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                    color === c && !customColor
                      ? "border-gray-900 scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
              <div className="flex items-center gap-1.5 ml-1">
                <input
                  type="color"
                  value={customColor || color}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setColor("");
                  }}
                  className="w-7 h-7 rounded-full cursor-pointer border border-gray-200 p-0.5 bg-white"
                  title="Pick custom color"
                />
                <span className="text-[10px] text-gray-400 font-semibold">
                  Custom
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: finalColor }}
              />
              <span className="text-[11px] text-gray-500 font-semibold">
                {finalColor}
              </span>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Amenities & Equipment
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {AMENITY_OPTIONS.map((a) => {
                const active = selectedAmenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      active
                        ? "bg-[#253C7D] border-[#253C7D] text-white"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-[#253C7D]/40"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>

            {/* Custom amenity */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomAmenity();
                  }
                }}
                placeholder="Add custom amenity..."
                className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#253C7D] transition-colors"
              />
              <button
                type="button"
                onClick={addCustomAmenity}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>

            {selectedAmenities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedAmenities.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: `${finalColor}18`,
                      color: finalColor,
                    }}
                  >
                    {a}
                    <button
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className="hover:opacity-60 cursor-pointer ml-0.5"
                    >
                      <i className="ri-close-line text-xs" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            style={{ backgroundColor: finalColor }}
          >
            {saving && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            <i className="ri-add-line" />
            Create Room
          </button>
        </div>
      </div>
    </div>
  );
});
