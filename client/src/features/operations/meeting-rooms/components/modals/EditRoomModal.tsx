import { memo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { uploadMediaToS3 } from "@/lib/s3-storage";
import { COLOR_PRESETS, AMENITY_ITEMS } from "../../constants";
import { ColorPickerRadioGroup } from "./ColorPickerRadioGroup";
import { AmenitiesSelectDropdown } from "./AmenitiesSelectDropdown";
import { RoomImageUploadSection } from "./RoomImageUploadSection";
import type { MeetingRoom } from "../../types";

interface Props {
  isOpen: boolean;
  room: MeetingRoom | null;
  onClose: () => void;
  onUpdated: () => void;
  showToast: (type: "success" | "error" | "info", message: string) => void;
  branches?: { id: string; name: string; is_site?: boolean }[];
  isSuperAdmin?: boolean;
}

const FLOOR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const EditRoomModal = memo(function EditRoomModal({
  isOpen, room, onClose, onUpdated, showToast, branches = [], isSuperAdmin = true,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [buList, setBuList] = useState<{ id: string; name: string }[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(10);
  const [floor, setFloor] = useState<number>(3);
  const [isOtherFloor, setIsOtherFloor] = useState(false);
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [customColor, setCustomColor] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    supabase.from("branches").select("id, name").is("deleted_at", null).order("name")
      .then(({ data }) => {
        if (data && data.length > 0) setBuList(data);
        else if (branches && branches.length > 0) setBuList(branches.filter((b) => !b.is_site && !b.id.startsWith("site:")));
      });
  }, [isOpen, branches]);

  useEffect(() => {
    if (room && isOpen) {
      setName(room.name || "");
      setCapacity(room.capacity || 10);
      setFloor(room.floor || 3);
      setIsOtherFloor(!FLOOR_OPTIONS.includes(room.floor || 3));
      setSelectedBranchId(room.branch_id || "all");
      setColor(COLOR_PRESETS.includes(room.color) ? room.color : COLOR_PRESETS[0]);
      setCustomColor(COLOR_PRESETS.includes(room.color) ? "" : room.color || "");
      setSelectedAmenities(Array.isArray(room.amenities) ? room.amenities : []);
      setImageFile(null);
      setImagePreview(room.image_url || null);
    }
  }, [room, isOpen]);

  const handleSelectFile = (file: File | null) => {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : (room?.image_url || null));
  };

  const toggleAmenity = (a: string) => setSelectedAmenities((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a]);
  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !selectedAmenities.includes(trimmed)) setSelectedAmenities((p) => [...p, trimmed]);
    setCustomAmenity("");
  };

  const handleSubmit = async () => {
    if (!room) return;
    if (!name.trim()) return showToast("error", "Room name is required.");
    const finalBranchId = selectedBranchId === "all" ? null : (selectedBranchId || null);

    setSaving(true);
    try {
      let s3ImageUrl: string | null = room.image_url || null;
      if (imageFile) {
        setUploadProgress(10);
        const uploaded = await uploadMediaToS3(imageFile, "meeting-rooms", (pct) => setUploadProgress(pct));
        s3ImageUrl = uploaded.url;
      }

      const payload: any = {
        name: name.trim(), capacity, floor, color: customColor || color,
        amenities: selectedAmenities, branch_id: finalBranchId, image_url: s3ImageUrl,
      };

      const { error } = await supabase.from("meeting_rooms").update(payload).eq("id", room.id);
      if (error) throw error;
      
      showToast("success", `Room "${name.trim()}" updated successfully!`);
      onUpdated();
      onClose();
    } catch (err: any) {
      showToast("error", err?.message || "Failed to update room.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !room) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 w-screen h-screen">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-xl sm:max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Edit Meeting Room</h3>
            <p className="text-xs text-slate-400 mt-0.5">Update room assets, BU location, equipment, and photo</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer">
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        <div className="space-y-3.5">
          {isSuperAdmin || buList.length > 0 ? (
            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Business Unit (BU) / Branch <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="all">🏢 All Business Units (Shared Company-wide)</option>
                {buList.map((b) => (<option key={b.id} value={b.id}>🏢 {b.name}</option>))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Room Name <span className="text-rose-500">*</span></label>
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Executive Boardroom A"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Seating Capacity</label>
              <input
                type="number" min={1} max={200} value={capacity} onChange={(e) => setCapacity(Number(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Floor Location</label>
              <select
                value={isOtherFloor ? "other" : floor}
                onChange={(e) => {
                  if (e.target.value === "other") setIsOtherFloor(true);
                  else { setIsOtherFloor(false); setFloor(Number(e.target.value) || 3); }
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                {FLOOR_OPTIONS.map((f) => (<option key={f} value={f}>Floor {f}</option>))}
                <option value="other">Other...</option>
              </select>
            </div>
          </div>

          <RoomImageUploadSection
            imageFile={imageFile} imagePreview={imagePreview}
            uploading={saving && Boolean(imageFile)} uploadProgress={uploadProgress}
            onSelectFile={handleSelectFile}
          />
          <ColorPickerRadioGroup color={color} setColor={setColor} customColor={customColor} setCustomColor={setCustomColor} />
          <AmenitiesSelectDropdown
            selectedAmenities={selectedAmenities} onToggleAmenity={toggleAmenity}
            onSelectAll={() => setSelectedAmenities(AMENITY_ITEMS.map((o) => o.label))}
            onClearAll={() => setSelectedAmenities([])}
            customAmenity={customAmenity} setCustomAmenity={setCustomAmenity} onAddCustomAmenity={addCustomAmenity}
          />
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">Cancel</button>
          <button
            type="button" onClick={handleSubmit} disabled={saving}
            className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#253C7D] hover:bg-[#1E3064] dark:bg-sky-600 dark:hover:bg-sky-500 rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <><i className="ri-loader-4-line animate-spin" /> Saving...</> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
});
