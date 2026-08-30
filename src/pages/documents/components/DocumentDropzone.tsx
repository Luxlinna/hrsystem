import { memo } from "react";
import { MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES } from "../constants";
import { toast } from "@/components/Toast";

interface DocumentDropzoneProps {
  fileUpload: File | null;
  setFileUpload: (file: File | null) => void;
  fileLink: string;
  setFileLink: (link: string) => void;
  dragOver: boolean;
  setDragOver: (drag: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const DocumentDropzone = memo(function DocumentDropzone({
  fileUpload,
  setFileUpload,
  fileLink,
  setFileLink,
  dragOver,
  setDragOver,
  fileInputRef,
}: DocumentDropzoneProps) {
  return (
    <div>
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
        Attach File or Resource
      </label>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) {
            if (dropped.size > MAX_FILE_SIZE_BYTES) {
              toast("File Too Large", `Maximum file size is ${MAX_FILE_SIZE_MB} MB.`, "error");
              return;
            }
            setFileUpload(dropped);
          }
        }}
        className={`w-full border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-[#253C7D] bg-[#253C7D]/10"
            : "border-gray-200 hover:border-[#253C7D]/40 hover:bg-slate-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && file.size > MAX_FILE_SIZE_BYTES) {
              toast("File Too Large", `Maximum file size is ${MAX_FILE_SIZE_MB} MB.`, "error");
              e.target.value = "";
              return;
            }
            setFileUpload(file || null);
          }}
        />

        {fileUpload ? (
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#253C7D]">
            <i className="ri-file-text-line text-lg" />
            <span className="truncate max-w-[200px]">{fileUpload.name}</span>
            <span className="text-[10px] text-gray-400">
              ({(fileUpload.size / (1024 * 1024)).toFixed(2)} MB)
            </span>
          </div>
        ) : (
          <div className="space-y-1">
            <i className="ri-upload-cloud-line text-2xl text-gray-400" />
            <p className="text-xs font-bold text-gray-700">Click to upload or drag &amp; drop</p>
            <p className="text-[10px] text-gray-400">PDF, DOCX, XLSX, PNG up to {MAX_FILE_SIZE_MB}MB</p>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase">Or Link:</span>
        <input
          type="url"
          value={fileLink}
          onChange={(e) => setFileLink(e.target.value)}
          placeholder="https://drive.google.com/... or public URL"
          className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
        />
      </div>
    </div>
  );
});
