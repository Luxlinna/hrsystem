import { memo, useRef, useEffect } from "react";

interface PersonalCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const PersonalCameraModal = memo(function PersonalCameraModal({
  isOpen,
  onClose,
  onCapture,
}: PersonalCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let activeStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        activeStream = stream;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        alert("Unable to access camera. Please check camera permissions or upload an image instead.");
        onClose();
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, onClose]);

  const handleCapture = () => {
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

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `avatar_camera_${Date.now()}.jpg`, { type: "image/jpeg" });
          onCapture(file);
        }
      }, "image/jpeg", 0.9);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl flex flex-col items-center">
        <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">
          Take Profile Photo
        </h4>
        <div className="w-60 h-60 rounded-full overflow-hidden bg-black mb-4 relative shadow-inner">
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
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCapture}
            className="flex-1 py-2 rounded-lg bg-[#22c3b8] hover:bg-[#1bb0a6] text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            Capture Photo
          </button>
        </div>
      </div>
    </div>
  );
});
