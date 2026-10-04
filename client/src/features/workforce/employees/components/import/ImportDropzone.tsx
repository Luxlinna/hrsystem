import { memo, useRef, useState } from "react";

interface ImportDropzoneProps {
  file: File | null;
  onFileSelected: (file: File) => void;
}

export const ImportDropzone = memo(function ImportDropzone({
  file,
  onFileSelected,
}: ImportDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFileSelected(dropped);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
        isDragging
          ? "border-[#253C7D] bg-slate-50 dark:bg-slate-700/50"
          : file
          ? "border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20"
          : "border-slate-300 dark:border-slate-600 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-900/40"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelected(f);
        }}
        className="hidden"
      />
      <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-2.5 text-xl text-[#253C7D] dark:text-[#7ba3d4]">
        <i className={file ? "ri-file-excel-line text-emerald-600" : "ri-upload-cloud-line"} />
      </div>
      {file ? (
        <div>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{file.name}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {(file.size / 1024).toFixed(1)} KB &bull; Click to choose another file
          </p>
        </div>
      ) : (
        <div>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Drop your Excel or CSV file here, or <span className="text-[#253C7D] dark:text-[#7ba3d4] underline">Browse</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Supports .xlsx, .xls, and .csv with standard employee columns
          </p>
        </div>
      )}
    </div>
  );
});
