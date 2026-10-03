import { useState, useRef } from "react";
import { EXPECTED_HEADERS } from "./nssfImportParser";

interface NssfImportDropZoneProps {
  file: File | null;
  onFileSelect: (f: File | null) => void;
  onDownloadTemplate: () => void;
}

export function NssfImportDropZone({
  file,
  onFileSelect,
  onDownloadTemplate,
}: NssfImportDropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) onFileSelect(f);
  };

  return (
    <>
      {/* Template Download */}
      <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-3">
        <div className="flex items-center gap-2.5">
          <i className="ri-file-excel-2-line text-green-600 text-lg" />
          <div>
            <p className="text-xs font-semibold text-gray-800">Download Import Template</p>
            <p className="text-[11px] text-gray-500">Use this template to format your data correctly</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDownloadTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer shadow-xs"
        >
          <i className="ri-download-line" />
          Template
        </button>
      </div>

      {/* Required Columns */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
        <p className="text-[11px] font-bold text-gray-600 mb-2 uppercase tracking-wide">Required Columns</p>
        <div className="flex flex-wrap gap-1.5">
          {EXPECTED_HEADERS.map((h) => (
            <span key={h} className="text-[11px] bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md font-medium">
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver ? "border-[#253C7D] bg-[#253C7D]/5" : "border-gray-200 hover:border-[#253C7D]/50 hover:bg-gray-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)}
        />
        <div className="flex flex-col items-center gap-2">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${dragOver ? "bg-[#253C7D]/10" : "bg-gray-100"}`}>
            <i className={`ri-cloud-upload-line text-2xl ${dragOver ? "text-[#253C7D]" : "text-gray-400"}`} />
          </div>
          {file ? (
            <div>
              <p className="text-sm font-semibold text-gray-800">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-gray-700">Drop file here or click to browse</p>
              <p className="text-xs text-gray-400 mt-0.5">Supports .csv, .xlsx, .xls</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
