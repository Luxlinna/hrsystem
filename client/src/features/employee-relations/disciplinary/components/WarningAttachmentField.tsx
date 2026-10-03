import React, { memo, useRef, useState } from "react";
import type { NewRecord } from "../types";
import { WarningFileViewerModal } from "./WarningFileViewerModal";

interface WarningAttachmentFieldProps {
  newRecord: NewRecord;
  handleFieldChange: (field: keyof NewRecord, value: any) => void;
}

export const WarningAttachmentField = memo(function WarningAttachmentField({
  newRecord,
  handleFieldChange,
}: WarningAttachmentFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewState, setPreviewState] = useState<{ url: string; name: string } | null>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFieldChange("document_file", e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="pt-2">
      <div className="text-sm font-bold text-[#0284c7] uppercase">
        ATTACHMENT INFO
      </div>
      <div className="border-b border-slate-200 mt-2 mb-6" />

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <label className="sm:w-52 text-xs font-semibold text-slate-700 sm:text-right">
          Attachment
        </label>
        <div className="flex-1 max-w-3xl">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFieldChange("document_file", e.target.files[0]);
              }
            }}
          />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded px-4 py-2 text-xs cursor-pointer transition-colors flex items-center justify-center gap-2 ${
              dragOver
                ? "border-sky-500 bg-sky-50/50"
                : "border-slate-300 hover:border-slate-400 bg-white"
            }`}
          >
            <i className="ri-upload-cloud-line text-sm text-slate-400" />
            <span className="text-slate-600">Drop file here or</span>
            <span className="text-[#0284c7] font-semibold hover:underline">Browse</span>
            {newRecord.document_file && (
              <span className="ml-2 font-bold text-slate-800 flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const objectUrl = URL.createObjectURL(newRecord.document_file!);
                    setPreviewState({ url: objectUrl, name: newRecord.document_file!.name });
                  }}
                  className="text-slate-800 hover:text-sky-600 underline cursor-pointer"
                  title="Click to view file"
                >
                  ({newRecord.document_file.name})
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFieldChange("document_file", undefined);
                  }}
                  className="text-rose-500 hover:text-rose-700 ml-0.5 cursor-pointer"
                  title="Remove file"
                >
                  <i className="ri-close-line" />
                </button>
              </span>
            )}
            {!newRecord.document_file && newRecord.document_url && (
              <span className="ml-2 font-bold text-slate-800 flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewState({ url: newRecord.document_url!, name: newRecord.document_name || "Attachment" });
                  }}
                  className="text-slate-800 hover:text-sky-600 underline cursor-pointer"
                  title="Click to view file"
                >
                  ({newRecord.document_name || "Attached File"})
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {previewState && (
        <WarningFileViewerModal
          url={previewState.url}
          fileName={previewState.name}
          onClose={() => setPreviewState(null)}
        />
      )}
    </div>
  );
});
