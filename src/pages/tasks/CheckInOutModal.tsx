import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentPosition } from "@/lib/geo";
import { loadGoogleMaps } from "@/lib/geocode";
import { uploadMediaToS3, type MediaItem } from "@/lib/s3-storage";
import { todayYMD } from "@/lib/date";

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const ACCEPTED = "image/*,video/*";

interface PendingFile {
  file: File;
  preview: string;
  type: "image" | "video";
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
  employeeId: string;
  mode: "check_in" | "check_out";
  onDone: () => void;
  onClose: () => void;
  showToast: (type: string, message: string) => void;
}

export default function CheckInOutModal({ taskId, employeeId, mode, onDone, onClose, showToast }: Props) {
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number | null; address: string | null } | null>(null);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isCheckIn = mode === "check_in";
  const canSubmit = isCheckIn ? !!location && !saving : files.length > 0 && !saving;

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

  const handlePickFiles = (inputFiles: FileList | undefined) => {
    if (!inputFiles) return;
    const next: PendingFile[] = [];
    for (let i = 0; i < inputFiles.length; i++) {
      const f = inputFiles[i];
      if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
        showToast("error", `"${f.name}" is not an image or video.`);
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        showToast("error", `"${f.name}" is too large (max 50MB).`);
        continue;
      }
      next.push({
        file: f,
        preview: URL.createObjectURL(f),
        type: f.type.startsWith("video/") ? "video" : "image",
      });
    }
    setFiles((prev) => [...prev, ...next]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const mediaItems: MediaItem[] = [];
      const folder = `outside-work/${taskId}/${isCheckIn ? "in" : "out"}`;

      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Uploading ${i + 1} of ${files.length}…`);
        const item = await uploadMediaToS3(files[i].file, folder);
        mediaItems.push(item);
      }

      setUploadProgress(null);

      const data: Record<string, any> = {};
      if (isCheckIn) {
        if (location) {
          data.work_lat = location.lat;
          data.work_lng = location.lng;
          data.work_accuracy_m = location.accuracy;
          data.work_address = location.address;
        }
        if (mediaItems.length > 0) {
          data.work_image_url = mediaItems[0].url;
          data.work_media_urls = mediaItems;
        }
        data.work_status = "checked_in";
        data.work_checked_in_at = new Date().toISOString();
      } else {
        if (location) {
          data.work_check_out_lat = location.lat;
          data.work_check_out_lng = location.lng;
          data.work_check_out_accuracy_m = location.accuracy;
          data.work_check_out_address = location.address;
        }
        if (mediaItems.length > 0) {
          data.work_check_out_image_url = mediaItems[0].url;
          data.work_check_out_media_urls = mediaItems;
        }
        data.work_status = "checked_out";
        data.work_checked_out_at = new Date().toISOString();
      }

      const { error: dbError } = await supabase.from("tasks").update(data).eq("id", taskId);
      if (dbError) throw dbError;

      // Sync to attendance_records so attendance history reflects outside work
      const today = todayYMD();
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      if (isCheckIn) {
        await supabase.from("attendance_records").upsert({
          employee_id: employeeId,
          date: today,
          clock_in: timeStr,
          status: "present",
          notes: `Outside work: check-in at ${location?.address || "unknown location"}`,
        }, { onConflict: "employee_id,date" });
      } else {
        // Update existing attendance record with clock_out
        const { data: attRec } = await supabase
          .from("attendance_records")
          .select("id, clock_in")
          .eq("employee_id", employeeId)
          .eq("date", today)
          .maybeSingle();
        if (attRec) {
          const [ciH, ciM, ciS] = (attRec.clock_in || "00:00:00").split(":").map(Number);
          const clockInMs = ciH * 3600000 + ciM * 60000 + ciS * 1000;
          const clockOutMs = now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000;
          const hoursWorked = Math.round(((clockOutMs - clockInMs) / 3600000) * 100) / 100;
          await supabase.from("attendance_records").update({
            clock_out: timeStr,
            hours_worked: hoursWorked > 0 ? hoursWorked : null,
          }).eq("id", attRec.id);
        }
      }

      showToast("success", isCheckIn ? "Checked in — have a productive day!" : "Checked out — great work!");
      onDone();
      onClose();
    } catch {
      showToast("error", isCheckIn ? "Couldn't check in. Please try again." : "Couldn't check out. Please try again.");
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100/80 overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
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
        <div className="p-5 space-y-3.5 overflow-y-auto flex-1 min-h-0">
          {/* Location */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Current Location {!isCheckIn && <span className="text-gray-400 font-normal normal-case">(optional)</span>}
              {isCheckIn && <span className="text-rose-500">*</span>}
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

          {/* Media */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Photos & Videos {!isCheckIn && <span className="text-rose-500">*</span>}
              {isCheckIn && <span className="text-gray-400 font-normal normal-case">(optional)</span>}
            </label>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED}
              multiple
              capture="environment"
              className="hidden"
              onChange={(e) => { handlePickFiles(e.target.files); e.target.value = ""; }}
            />

            {/* File grid */}
            {files.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {files.map((f, i) => (
                  <div key={i} className="relative group rounded-xl border border-gray-200 overflow-hidden aspect-square">
                    {f.type === "video" ? (
                      <video src={f.preview} preload="metadata" className="w-full h-full object-cover bg-black" />
                    ) : (
                      <img src={f.preview} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      disabled={saving}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-30"
                    >
                      <i className="ri-close-line text-[10px]" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={saving}
              className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 text-gray-500 hover:border-[#253C7D]/50 hover:bg-[#253C7D]/5 hover:text-[#253C7D] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-60"
            >
              <i className="ri-camera-line text-xl" />
              <span className="text-xs font-bold">
                {files.length > 0 ? "Add More" : "Take Photos or Videos"}
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2 shrink-0">
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
                {uploadProgress || "Saving…"}
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
