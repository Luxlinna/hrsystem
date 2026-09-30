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

  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200/80 flex flex-col items-center justify-center w-full max-w-[260px] mx-auto text-xs">
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
        onClick={() => !form.avatar_url && fileInputRef.current?.click()}
        className={`w-40 h-40 rounded-full bg-[#edf0f3] dark:bg-slate-800 border flex items-center justify-center overflow-hidden relative group mb-3.5 transition-all cursor-pointer shadow-2xs ${
          isDragOver
            ? "border-[#253C7D] ring-2 ring-blue-100 dark:ring-blue-900/40"
            : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
        }`}
      >
        {uploadingAvatar && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20">
            <i className="ri-loader-4-line text-2xl animate-spin text-blue-400 mb-1" />
            <span className="text-[10px] font-semibold text-blue-100">
              Saving to S3...
            </span>
          </div>
        )}

        {form.avatar_url ? (
          <>
            <img
              src={form.avatar_url}
              alt="Employee Profile"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("avatar_url", "");
              }}
              className="absolute inset-0 bg-slate-950/50 text-white font-semibold text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity cursor-pointer"
            >
              <i className="ri-delete-bin-line text-sm" />
              <span>Remove Photo</span>
            </button>
          </>
        ) : (
          <div className="w-full h-full relative flex items-center justify-center">
            {/* Exact ERP Silhouette Avatar Matching Reference */}
            <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="100" fill="#EDF0F3" />
              {/* Suit Shoulders */}
              <path
                d="M34 182 C44 146 72 130 90 125 L100 152 L110 125 C128 130 156 146 166 182 C148 198 125 200 100 200 C75 200 52 198 34 182 Z"
                fill="#CFD4DC"
              />
              {/* V-Collar Shirt Area */}
              <path d="M84 125 L116 125 L100 158 Z" fill="#EDF0F3" />
              {/* Necktie */}
              <path d="M96 128 L104 128 L106 137 L100 141 L94 137 Z" fill="#CFD4DC" />
              <path d="M97 141 L103 141 L106 172 L100 178 L94 172 Z" fill="#CFD4DC" />
              {/* Neck */}
              <path d="M86 106 C86 120 91 127 100 127 C109 127 114 120 114 106 Z" fill="#CFD4DC" />
              {/* Head Base */}
              <path
                d="M72 78 C72 98 83 113 100 113 C117 113 128 98 128 78 C128 58 117 44 100 44 C83 44 72 58 72 78 Z"
                fill="#CFD4DC"
              />
              {/* Hair & Ears Contour */}
              <path
                d="M68 76 C66 71 67 60 72 52 C77 43 86 37 98 37 C111 37 122 43 127 50 C132 56 133 67 129 76 C132 80 133 87 129 93 C127 96 124 97 121 97 C121 82 116 61 100 61 C86 61 80 72 79 97 C76 97 73 96 71 93 C67 87 68 80 68 76 Z"
                fill="#CFD4DC"
              />
            </svg>

            {/* Hover Camera Overlay */}
            <div className="absolute inset-0 bg-slate-900/40 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
              <i className="ri-camera-line text-2xl" />
              <span className="text-[10px] font-semibold">Upload Photo</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 w-full justify-center">
        <button
          type="button"
          onClick={() => setIsCameraOpen(true)}
          className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
        >
          <i className="ri-camera-line text-xs text-[#253C7D] dark:text-[#7ba3d4]" />
          <span>Camera</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 rounded bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
        >
          <i className="ri-upload-2-line text-xs" />
          <span>Upload</span>
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
