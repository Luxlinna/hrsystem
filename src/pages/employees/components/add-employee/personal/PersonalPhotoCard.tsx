import { memo, useRef, useState, useCallback } from "react";
import { uploadMediaToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";
import type { PersonalSectionProps } from "./types";
import { PersonalCameraModal } from "./PersonalCameraModal";

export const PersonalPhotoCard = memo(function PersonalPhotoCard({
  form,
  onChange,
}: PersonalSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
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
        toast("Upload Failed", err instanceof Error ? err.message : "Failed to upload photo.", "error");
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

  const isS3Avatar = form.avatar_url && (
    form.avatar_url.includes("s3") ||
    form.avatar_url.includes("amazonaws.com") ||
    form.avatar_url.startsWith("http")
  );

  return (
    <div className="bg-white rounded-lg p-4 border border-slate-100 flex flex-col items-center justify-center w-full max-w-[260px] mx-auto">
      {/* Avatar Circle */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) processAndUploadFile(file);
        }}
        className={`w-44 h-44 rounded-full bg-[#f1f3f5] border flex items-center justify-center overflow-hidden relative group mb-4 transition-all ${
          isDragOver ? "border-[#0088cc] ring-2 ring-blue-100" : "border-slate-200"
        }`}
      >
        {uploadingAvatar && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20">
            <i className="ri-loader-4-line text-2xl animate-spin text-blue-400 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
              Saving to S3...
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
              className="absolute inset-0 bg-slate-950/40 text-white font-bold text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity cursor-pointer"
            >
              <i className="ri-delete-bin-line" /> Remove
            </button>
          </>
        ) : (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="100" fill="#E8ECEF" />
            {/* Head */}
            <path
              d="M100 42 C85 42 74 53 74 69 C74 85 85 96 100 96 C115 96 126 85 126 69 C126 53 115 42 100 42 Z"
              fill="#BAC0C6"
            />
            {/* White Collar / Shirt V */}
            <polygon points="84,112 116,112 100,150" fill="#FFFFFF" />
            {/* Tie & Body */}
            <polygon points="96,116 104,116 105,123 100,126 95,123" fill="#BAC0C6" />
            <polygon points="98,126 102,126 104,152 100,158 96,152" fill="#BAC0C6" />
            {/* Suit Shoulders */}
            <path
              d="M38 190 C42 140 68 118 86 114 L100 148 L114 114 C132 118 158 140 162 190 Z"
              fill="#BAC0C6"
            />
          </svg>
        )}
      </div>

      {isS3Avatar && (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-[10px] font-semibold text-emerald-700 border border-emerald-200 mb-3">
          <i className="ri-checkbox-circle-line" /> S3 Avatar Attached
        </div>
      )}

      {/* Action Buttons: Teal Snap Photo & Coral Red Upload */}
      <div className="flex items-center gap-2 w-full justify-center">
        <button
          type="button"
          onClick={() => setIsCameraOpen(true)}
          className="px-3 py-1.5 rounded-full bg-[#17a2b8] hover:bg-[#138496] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
        >
          <i className="ri-camera-line text-xs" />
          <span>Snap a Photo</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 rounded-full bg-[#e84c3d] hover:bg-[#d43f30] text-white text-[10px] font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
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

      <PersonalCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={processAndUploadFile}
      />
    </div>
  );
});
