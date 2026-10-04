import { memo, useRef, useState, useCallback } from "react";
import { uploadMediaToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";
import { DefaultAvatarSvg } from "@/components/DefaultAvatarSvg";
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
            <DefaultAvatarSvg />
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
