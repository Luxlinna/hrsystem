import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentPosition } from "@/lib/geo";
import { loadGoogleMaps } from "@/lib/geocode";
import { uploadFile } from "@/lib/storage";

const BUCKET = "outside-work-images";
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

async function compressImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Couldn't read image."));
      el.src = url;
    });
    const max = 1600;
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process image."))), "image/jpeg", 0.85)
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    await loadGoogleMaps();
    const geocoder = new (window as any).google.maps.Geocoder();
    return await new Promise<string>((resolve, reject) => {
      geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        if (status === "OK" && results?.[0]) resolve(results[0].formatted_address);
        else reject(new Error(status));
      });
    });
  } catch {
    return null;
  }
}

interface Props {
  taskId: string;
  mode: "check_in" | "check_out";
  onDone: () => void;
  onClose: () => void;
  showToast: (type: string, message: string) => void;
}

export default function CheckInOutModal({ taskId, mode, onDone, onClose, showToast }: Props) {
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number | null; address: string | null } | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const isCheckIn = mode === "check_in";
  const canSubmit = !!location && !!photo && !saving;

  const handleCaptureLocation = async () => {
    setLocating(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      const loc = {
        lat: Number(pos.coords.latitude.toFixed(6)),
        lng: Number(pos.coords.longitude.toFixed(6)),
        accuracy: Math.round(pos.coords.accuracy),
        address: null as string | null,
      };
      setLocation(loc);
      const address = await reverseGeocode(loc.lat, loc.lng);
      if (address) setLocation((prev) => (prev ? { ...prev, address } : prev));
    } catch (err: any) {
      setError(
        err?.code === 1
          ? "Location access denied — enable location permissions and try again."
          : "Couldn't get your location. Make sure location services are enabled."
      );
    } finally {
      setLocating(false);
    }
  };

  const handlePickPhoto = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("error", "Please choose an image file."); return; }
    if (file.size > MAX_PHOTO_BYTES) { showToast("error", "Photo must be under 10MB."); return; }
    setPhoto(file);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !location || !photo) return;
    setSaving(true);
    try {
      const blob = await compressImage(photo);
      const fileName = isCheckIn ? "check-in.jpg" : "check-out.jpg";
      const imageUrl = await uploadFile(
        BUCKET,
        `${taskId}/${isCheckIn ? "in" : "out"}/${Date.now()}.jpg`,
        new File([blob], fileName, { type: "image/jpeg" })
      );

      const data: Record<string, any> = {};
      if (isCheckIn) {
        data.work_lat = location.lat;
        data.work_lng = location.lng;
        data.work_accuracy_m = location.accuracy;
        data.work_address = location.address;
        data.work_image_url = imageUrl;
        data.work_status = "checked_in";
        data.work_checked_in_at = new Date().toISOString();
      } else {
        data.work_check_out_lat = location.lat;
        data.work_check_out_lng = location.lng;
        data.work_check_out_accuracy_m = location.accuracy;
        data.work_check_out_address = location.address;
        data.work_check_out_image_url = imageUrl;
        data.work_status = "checked_out";
        data.work_checked_out_at = new Date().toISOString();
      }

      const { error: dbError } = await supabase.from("tasks").update(data).eq("id", taskId);
      if (dbError) throw dbError;

      showToast("success", isCheckIn ? "Checked in — have a productive day!" : "Checked out — great work!");
      onDone();
      onClose();
    } catch {
      showToast("error", isCheckIn ? "Couldn't check in. Please try again." : "Couldn't check out. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100/80 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCheckIn ? "bg-emerald-100 text-emerald-700" : "bg-[#253C7D]/10 text-[#253C7D]"}`}>
              <i className={`text-base ${isCheckIn ? "ri-login-circle-line" : "ri-logout-circle-r-line"}`} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">{isCheckIn ? "Check In" : "Check Out"}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-base" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5">
          {/* Location */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Current Location <span className="text-rose-500">*</span>
            </label>
            {!location ? (
              <button
                type="button"
                onClick={handleCaptureLocation}
                disabled={locating}
                className={`w-full py-3 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-60 ${
                  locating
                    ? "border-[#253C7D]/40 bg-[#253C7D]/5 text-[#253C7D]"
                    : "border-gray-300 bg-gray-50/50 text-gray-500 hover:border-[#253C7D]/50 hover:bg-[#253C7D]/5 hover:text-[#253C7D]"
                }`}
              >
                {locating ? (
                  <>
                    <i className="ri-loader-4-line text-xl animate-spin" />
                    <span className="text-xs font-bold">Locating you…</span>
                  </>
                ) : (
                  <>
                    <i className="ri-map-pin-2-line text-xl" />
                    <span className="text-xs font-bold">Capture Current Location</span>
                  </>
                )}
              </button>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <i className="ri-map-pin-2-fill" />
                    {location.address || `${location.lat}, ${location.lng}`}
                  </p>
                  <p className="text-[11px] text-emerald-700/80 mt-0.5">
                    ±{location.accuracy ?? "?"}m accuracy
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCaptureLocation}
                  disabled={locating}
                  className="text-[11px] font-bold text-[#253C7D] hover:underline shrink-0 cursor-pointer disabled:opacity-50"
                >
                  Re-capture
                </button>
              </div>
            )}
            {error && (
              <p className="text-[11px] font-semibold text-rose-600 mt-1.5 flex items-start gap-1">
                <i className="ri-error-warning-line mt-px" />
                {error}
              </p>
            )}
          </div>

          {/* Photo */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Proof Photo <span className="text-rose-500">*</span>
            </label>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => { handlePickPhoto(e.target.files?.[0]); e.target.value = ""; }}
            />
            {!photo ? (
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 text-gray-500 hover:border-[#253C7D]/50 hover:bg-[#253C7D]/5 hover:text-[#253C7D] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <i className="ri-camera-line text-xl" />
                <span className="text-xs font-bold">Take a Photo</span>
              </button>
            ) : (
              <div className="rounded-xl border border-gray-200 overflow-hidden relative group">
                <img src={URL.createObjectURL(photo)} alt="Proof" className="w-full h-36 object-cover" />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => photoRef.current?.click()}
                    className="bg-white text-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md cursor-pointer"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="bg-white text-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
                <span className="absolute bottom-2 left-2 bg-slate-950/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <i className="ri-camera-fill" />
                  Ready
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 ${
              isCheckIn
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-[#253C7D] hover:bg-[#1E3064]"
            }`}
          >
            {saving ? (
              <>
                <i className="ri-loader-4-line animate-spin text-sm" />
                Saving…
              </>
            ) : (
              <>
                <i className={`text-sm ${isCheckIn ? "ri-login-circle-line" : "ri-logout-circle-r-line"}`} />
                {isCheckIn ? "Check In" : "Check Out"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
