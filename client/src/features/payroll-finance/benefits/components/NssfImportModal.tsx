import { useState, useCallback } from "react";
import type { NssfEmployee } from "../types";
import { NssfImportDropZone } from "./NssfImportDropZone";
import { NssfImportPreviewTable } from "./NssfImportPreviewTable";
import { parseNssfFile, downloadNssfTemplate, type ImportRow } from "./nssfImportParser";

interface NssfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rows: Partial<NssfEmployee>[]) => Promise<void>;
  saving: boolean;
}

export function NssfImportModal({ isOpen, onClose, onImport, saving }: NssfImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (f: File | null) => {
    setFile(f);
    setParseError(null);
    setPreview([]);

    if (!f) return;

    const result = await parseNssfFile(f);
    if (result.error) {
      setParseError(result.error);
    } else if (result.rows) {
      setPreview(result.rows);
    }
  }, []);

  const handleSubmit = async () => {
    if (preview.length === 0) return;
    await onImport(preview);
    setFile(null);
    setPreview([]);
    onClose();
  };

  const handleDownloadTemplate = () => {
    downloadNssfTemplate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#253C7D]/10 flex items-center justify-center">
              <i className="ri-upload-cloud-2-line text-[#253C7D] text-lg" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Import NSSF Data</h2>
              <p className="text-xs text-gray-500">Upload Excel or CSV file to update employee NSSF records</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-gray-500 text-lg" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <NssfImportDropZone
            file={file}
            onFileSelect={handleFileSelect}
            onDownloadTemplate={handleDownloadTemplate}
          />

          {/* Error */}
          {parseError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <i className="ri-error-warning-line text-red-500 mt-0.5" />
              <p className="text-xs text-red-700">{parseError}</p>
            </div>
          )}

          <NssfImportPreviewTable preview={preview} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={preview.length === 0 || saving}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#253C7D] rounded-xl hover:bg-[#1e3167] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <i className="ri-check-line" />
                Import {preview.length > 0 ? `${preview.length} Records` : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
