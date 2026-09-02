import React from "react";

interface MediaLightboxModalProps {
  lightbox: { url: string; type: "image" | "video" } | null;
  onClose: () => void;
}

export function MediaLightboxModal({ lightbox, onClose }: MediaLightboxModalProps) {
  if (!lightbox) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition cursor-pointer"
      >
        <i className="ri-close-line text-xl" />
      </button>
      <div className="max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {lightbox.type === "video" ? (
          <video src={lightbox.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg" />
        ) : (
          <img src={lightbox.url} alt="" className="max-w-full max-h-[85vh] rounded-lg object-contain" />
        )}
      </div>
    </div>
  );
}
