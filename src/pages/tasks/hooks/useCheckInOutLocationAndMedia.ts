import { useState, useCallback } from "react";
import { getCurrentPosition } from "@/lib/geo";
import { reverseGeocode, MAX_FILE_BYTES } from "../geoUtils";
import type { PendingFile } from "../components/modals/check-in/MediaUploadDropzone";

export function useCheckInOutLocationAndMedia(showToast: (type: string, message: string) => void) {
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number | null;
    address: string | null;
  } | null>(null);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCaptureLocation = useCallback(async () => {
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
  }, []);

  const handlePickFiles = useCallback(
    (inputFiles: FileList | undefined) => {
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
    },
    [showToast]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  return {
    location,
    setLocation,
    files,
    setFiles,
    locating,
    error,
    setError,
    handleCaptureLocation,
    handlePickFiles,
    removeFile,
  };
}
