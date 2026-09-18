import { memo, useRef, useState, useEffect, useCallback } from "react";
import { uploadMediaToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";
import type { PersonalSectionProps } from "./types";

export const PersonalPhotoCard = memo(function PersonalPhotoCard({
  form,
  onChange,
}: PersonalSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const processAndUploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast("Invalid File", "Please select an image file (JPG, PNG, WebP)", "error");
        return;
      }
      setUploadingAvatar(true);
      try {
        const media = await uploadMediaToS3(file, "employees/avatars");
        onChange("avatar_url", media.url);
        toast("Profile Image Saved", "Employee photo stored securely on AWS S3.", "success");
      } catch (err) {
        console.error("Avatar AWS S3 upload error:", err);
        toast("Upload Failed", err instanceof Error ? err.message : "Failed to upload employee photo to AWS S3.", "error");
      } finally {
        setUploadingAvatar(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [onChange]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processAndUploadFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processAndUploadFile(file);
    },
    [processAndUploadFile]
  );

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(
        "Camera access is blocked by the browser because this site is not using HTTPS (SSL).\n\n" +
        "To enable it in Chrome/Edge for this IP:\n" +
        "1. Open chrome://flags/#unsafely-treat-insecure-origin-as-secure in a new tab.\n" +
        "2. Add this website address (" + window.location.origin + ") and select Enabled.\n" +
        "3. Click Relaunch at the bottom of Chrome.\n\n" +
        "Alternatively, you can click 'Upload Photo' to select an image from your computer."
      );
      return;
    }

    try {
      // Try flexible resolution first, fallback to basic video if camera is strict
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch (err: any) {
      const errName = err?.name || "Error";
      if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
        alert(
          "Camera permission was blocked in Chrome for this site.\n\n" +
          "Click the Lock / Tune icon (🎚️) on the left side of the address bar at the top of your browser, and switch Camera to 'Allow'."
        );
      } else if (errName === "NotReadableError" || errName === "TrackStartError") {
        alert(
          "Your camera is currently in use by another app (such as Telegram Desktop, Zoom, or another browser window).\n\n" +
          "Please close the other app and try again."
        );
      } else {
        alert(`Unable to access camera (${errName}: ${err?.message || "Unknown error"}). Please check permissions or upload an image instead.`);
      }
    }
  };

  useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraOpen, cameraStream]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const minDim = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - minDim) / 2;
      const startY = (video.videoHeight - minDim) / 2;
      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, 400, 400);

      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `avatar_camera_${Date.now()}.jpg`, { type: "image/jpeg" });
          await processAndUploadFile(file);
        }
      }, "image/jpeg", 0.9);
    }
    stopCamera();
  };

  const isS3Avatar = form.avatar_url && (
    form.avatar_url.includes("s3") ||
    form.avatar_url.includes("amazonaws.com") ||
    form.avatar_url.startsWith("http")
  );

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center w-full max-w-[280px] mx-auto">
      {/* Avatar Circle Container with Drag-and-Drop and S3 Loader */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-48 h-48 rounded-full bg-slate-100/90 border-2 flex items-center justify-center overflow-hidden shadow-inner relative group mb-4 transition-all ${
          isDragOver
            ? "border-[#253C7D] ring-4 ring-blue-100 scale-105"
            : "border-slate-200"
        }`}
      >
        {uploadingAvatar && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20">
            <i className="ri-loader-4-line text-3xl animate-spin text-blue-400 mb-1" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-100">
              Saving to AWS S3...
            </span>
          </div>
        )}

        {form.avatar_url ? (
          <>
            <img
              src={form.avatar_url}
              alt="Employee Avatar"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => onChange("avatar_url", "")}
              className="absolute inset-0 bg-slate-950/40 text-white font-bold text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity cursor-pointer backdrop-blur-2xs"
            >
              <i className="ri-delete-bin-line" /> Remove
            </button>
          </>
        ) : (
          /* Exact Business Silhouette from Screenshot */
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="100" fill="#EFEFEF" />
            {/* Head */}
            <path
              d="M100 42 C85 42 74 53 74 69 C74 85 85 96 100 96 C115 96 126 85 126 69 C126 53 115 42 100 42 Z"
              fill="#D5D7DA"
            />
            {/* White Collar / Shirt V */}
            <polygon points="84,112 116,112 100,150" fill="#FFFFFF" />
            {/* Tie Knot & Body */}
            <polygon points="96,116 104,116 105,123 100,126 95,123" fill="#D5D7DA" />
            <polygon points="98,126 102,126 104,152 100,158 96,152" fill="#D5D7DA" />
            {/* Suit Shoulders */}
            <path
              d="M38 190 C42 140 68 118 86 114 L100 148 L114 114 C132 118 158 140 162 190 Z"
              fill="#D5D7DA"
            />
          </svg>
        )}
      </div>

      {/* Cloud S3 indicator badge */}
      {isS3Avatar && (
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/70 text-[10px] font-bold text-amber-700 shadow-2xs mb-3">
          <i className="ri-amazon-line text-xs text-amber-600" />
          <span>AWS S3 Cloud Avatar</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 w-full justify-center">
        {/* SNAP A PHOTO */}
        <button
          type="button"
          onClick={startCamera}
          className="px-3.5 py-2 rounded-full bg-[#22c3b8] hover:bg-[#1bb0a6] text-white text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <i className="ri-camera-line text-sm" />
          <span>Snap a Photo</span>
        </button>

        {/* UPLOAD AN IMAGE */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-2 rounded-full bg-[#ef4d56] hover:bg-[#dc3b44] text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <span>Upload an Image</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Camera Capture Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col items-center">
            <h4 className="text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">
              Take Profile Photo
            </h4>
            <div className="w-64 h-64 rounded-full overflow-hidden bg-black mb-4 relative shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            </div>
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={stopCamera}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 py-2 rounded-xl bg-[#22c3b8] hover:bg-[#1bb0a6] text-white text-xs font-bold shadow-sm"
              >
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
