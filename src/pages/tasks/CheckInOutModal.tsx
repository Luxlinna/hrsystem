import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentPosition } from "@/lib/geo";
import { uploadMediaToS3, type MediaItem } from "@/lib/s3-storage";
import { todayYMD } from "@/lib/date";
import { reverseGeocode, MAX_FILE_BYTES } from "./geoUtils";
import { LocationCaptureCard } from "./components/modals/check-in/LocationCaptureCard";
import {
  MediaUploadDropzone,
  type PendingFile,
} from "./components/modals/check-in/MediaUploadDropzone";
import type { Task } from "./types";

interface Props {
  taskId: string;
  employeeId: string;
  mode: "check_in" | "check_out";
  onDone: () => void;
  onClose: () => void;
  showToast: (type: string, message: string) => void;
  task?: Task;
}

export default function CheckInOutModal({
  taskId,
  employeeId,
  mode,
  onDone,
  onClose,
  showToast,
  task,
}: Props) {
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number | null;
    address: string | null;
  } | null>(null);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCheckIn = mode === "check_in";
  const hasPredefinedLocation = !!task?.work_address || (task?.work_lat != null && task?.work_lng != null);
  const canSubmit = isCheckIn ? (hasPredefinedLocation || !!location) && !saving : files.length > 0 && !saving;

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

      // Sync to attendance_records
      const today = todayYMD();
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      if (isCheckIn) {
        let workLocationId: string | null = null;
        // Query assigned shift for today
        const { data: shiftAssignments } = await supabase
          .from("shift_assignments")
          .select("id, shift:shifts(start_time, shift_date)")
          .eq("employee_id", employeeId)
          .is("deleted_at", null);
        
        const match = (shiftAssignments as any[])?.find(
          (a) => a.shift && a.shift.shift_date === today
        );
        
        let startH = 8;
        let startM = 0;
        if (match?.shift?.start_time) {
          const [sh, sm] = match.shift.start_time.split(":").map(Number);
          startH = sh;
          startM = sm;
        } else {
          // Fallback to employee's branch work_start_time if available
          const { data: empData } = await supabase
            .from("employees")
            .select("branch_id, default_work_location_id, branches(work_start_time)")
            .eq("id", employeeId)
            .maybeSingle();
          const branchStartTime = (empData as any)?.branches?.work_start_time;
          if (branchStartTime) {
            const [bh, bm] = branchStartTime.split(":").map(Number);
            startH = bh;
            startM = bm;
          }

          // Resolve work_location_id
          let wlId = (empData as any)?.default_work_location_id || null;
          if (!wlId && (empData as any)?.branch_id) {
            const { data: defaultSite } = await supabase
              .from("work_locations")
              .select("id")
              .eq("branch_id", (empData as any).branch_id)
              .eq("is_default", true)
              .is("deleted_at", null)
              .maybeSingle();
            if (defaultSite) {
              wlId = defaultSite.id;
            } else {
              const { data: firstSite } = await supabase
                .from("work_locations")
                .select("id")
                .eq("branch_id", (empData as any).branch_id)
                .is("deleted_at", null)
                .limit(1)
                .maybeSingle();
              if (firstSite) wlId = firstSite.id;
            }
          }
          workLocationId = wlId;
        }

        const lateMinutes = Math.max(0, now.getHours() * 60 + now.getMinutes() - (startH * 60 + startM));
        const status = lateMinutes > 0 ? "late" : "ontime";
        await supabase.from("attendance_records").upsert(
          {
            employee_id: employeeId,
            date: today,
            clock_in: timeStr,
            status,
            late_minutes: lateMinutes,
            notes: `Outside work: check-in at ${location?.address || task?.work_address || "unknown location"}`,
            work_location_id: workLocationId,
          },
          { onConflict: "employee_id,date" }
        );
      } else {
        const { data: attRec } = await supabase
          .from("attendance_records")
          .select("id, clock_in")
          .eq("employee_id", employeeId)
          .eq("date", today)
          .maybeSingle();
        if (attRec) {
          const [ciH, ciM, ciS] = (attRec.clock_in || "00:00:00").split(":").map(Number);
          const clockInMs = ciH * 3600000 + ciM * 60000 + ciS * 1000;
          const clockOutMs =
            now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000;
          const hoursWorked = Math.round(((clockOutMs - clockInMs) / 3600000) * 100) / 100;
          await supabase
            .from("attendance_records")
            .update({
              clock_out: timeStr,
              hours_worked: hoursWorked > 0 ? hoursWorked : null,
            })
            .eq("id", attRec.id);
        }
      }

      showToast(
        "success",
        isCheckIn ? "Checked in — have a productive day!" : "Checked out — great work!"
      );
      onDone();
      onClose();
    } catch {
      showToast(
        "error",
        isCheckIn ? "Couldn't check in. Please try again." : "Couldn't check out. Please try again."
      );
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
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-xl text-white ${
                isCheckIn ? "bg-emerald-600" : "bg-indigo-600"
              }`}
            >
              <i className={isCheckIn ? "ri-login-box-line" : "ri-logout-box-line"} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isCheckIn ? "Check In to Outside Work" : "Check Out of Outside Work"}
              </h3>
              <p className="text-[11px] text-slate-500">Record GPS location &amp; photo evidence</p>
            </div>
          </div>
          <button
            onClick={() => !saving && onClose()}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <i className="ri-error-warning-line shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <LocationCaptureCard
          location={location}
          locating={locating}
          onCaptureLocation={handleCaptureLocation}
          isCheckIn={isCheckIn}
          isOptional={hasPredefinedLocation}
        />

        <MediaUploadDropzone
          files={files}
          onPickFiles={handlePickFiles}
          onRemoveFile={removeFile}
          isCheckIn={isCheckIn}
          disabled={saving}
        />

        {uploadProgress && (
          <p className="text-xs text-indigo-600 font-semibold animate-pulse">{uploadProgress}</p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#253C7D] hover:bg-[#1F336A] disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
          >
            {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {isCheckIn ? "Confirm Check In" : "Confirm Check Out"}
          </button>
        </div>
      </div>
    </div>
  );
}
