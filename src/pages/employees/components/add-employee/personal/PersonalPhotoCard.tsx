import { memo, useRef, useState, useEffect } from "react";
import type { PersonalSectionProps } from "./types";

export const PersonalPhotoCard = memo(function PersonalPhotoCard({
  form,
  onChange,
}: PersonalSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) onChange("avatar_url", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 400, facingMode: "user" },
      });
      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch {
      alert("Unable to access camera. Please check permissions or upload an image instead.");
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
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 300, 300);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      onChange("avatar_url", dataUrl);
    }
    stopCamera();
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center w-full max-w-[280px] mx-auto">
      {/* Avatar Circle Container */}
      <div className="w-48 h-48 rounded-full bg-slate-100/90 border-2 border-slate-200 flex items-center justify-center overflow-hidden shadow-inner relative group mb-5">
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
