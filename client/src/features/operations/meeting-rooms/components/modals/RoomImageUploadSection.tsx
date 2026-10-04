import { memo, useRef } from "react";

interface RoomImageUploadSectionProps {
  imageFile: File | null;
  imagePreview: string | null;
  uploading: boolean;
  uploadProgress: number;
  onSelectFile: (file: File | null) => void;
}

export const RoomImageUploadSection = memo(function RoomImageUploadSection({
  imageFile,
  imagePreview,
  uploading,
  uploadProgress,
  onSelectFile,
}: RoomImageUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSelectFile(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
        <span>Room Photo</span>
        <span className="text-[11px] text-slate-400 font-normal">AWS S3 · Max 5MB</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />

      {imagePreview ? (
        <div className="relative w-full h-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-between p-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <img src={imagePreview} alt="Room" className="w-16 h-16 object-cover rounded-xl shrink-0 border border-white/20 shadow-xs" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {imageFile?.name || "Room Photo"}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Ready to upload to Amazon AWS S3</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-600 shadow-2xs cursor-pointer"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={uploading}
              className="w-8 h-8 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center cursor-pointer"
              title="Remove"
            >
              <i className="ri-delete-bin-line text-sm" />
            </button>
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center gap-2.5 text-white text-sm font-bold">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Uploading to S3... {uploadProgress}%</span>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-20 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#253C7D] dark:hover:border-sky-400 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 rounded-2xl flex items-center justify-center gap-3 cursor-pointer transition-all px-4"
        >
          <div className="w-9 h-9 rounded-xl bg-[#253C7D]/10 dark:bg-sky-500/20 text-[#253C7D] dark:text-sky-400 flex items-center justify-center text-base shrink-0">
            <i className="ri-image-add-line" />
          </div>
          <div className="text-left">
            <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
              Click to upload room photo
            </p>
            <p className="text-[11px] text-slate-400">Stores safely in your Amazon S3 bucket</p>
          </div>
        </div>
      )}
    </div>
  );
});
