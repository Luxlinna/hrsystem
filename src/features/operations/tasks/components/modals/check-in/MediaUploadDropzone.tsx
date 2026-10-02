import { memo, useRef } from "react";
import { MAX_FILE_BYTES, ACCEPTED_MEDIA_TYPES } from "../../../geoUtils";

export interface PendingFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

interface MediaUploadDropzoneProps {
  files: PendingFile[];
  onPickFiles: (files: FileList | undefined) => void;
  onRemoveFile: (index: number) => void;
  isCheckIn: boolean;
  disabled?: boolean;
}

export const MediaUploadDropzone = memo(function MediaUploadDropzone({
  files,
  onPickFiles,
  onRemoveFile,
  isCheckIn,
  disabled,
}: MediaUploadDropzoneProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800">
          Photos / Videos {!isCheckIn && <span className="text-rose-500">*</span>}
        </label>
        <span className="text-[11px] text-slate-400">Max 50MB per file</span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_MEDIA_TYPES}
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          onPickFiles(e.target.files || undefined);
          e.target.value = "";
        }}
      />

      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
          {files.map((item, idx) => (
            <div
              key={idx}
              className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-900"
            >
              {item.type === "image" ? (
                <img
                  src={item.preview}
                  alt="Upload preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video src={item.preview} className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => onRemoveFile(idx)}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-rose-600 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xs" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={disabled}
        className="w-full border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 text-center bg-slate-50/50 hover:bg-indigo-50/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5"
      >
        <i className="ri-camera-line text-xl text-slate-400" />
        <span className="text-xs font-semibold text-slate-700">
          Upload photo or video evidence
        </span>
        <span className="text-[10px] text-slate-400">Click to browse or take a photo</span>
      </button>
    </div>
  );
});
