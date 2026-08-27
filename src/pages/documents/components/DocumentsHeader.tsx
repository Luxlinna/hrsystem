import { memo } from "react";

interface DocumentsHeaderProps {
  totalFiles: number;
  canManageDocs: boolean;
  onExportCSV: () => void;
  onOpenNewFolder: () => void;
  onOpenUploadModal: () => void;
}

export const DocumentsHeader = memo(function DocumentsHeader({
  totalFiles,
  canManageDocs,
  onExportCSV,
  onOpenNewFolder,
  onOpenUploadModal,
}: DocumentsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Corporate Knowledge</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] font-bold">Document Hub</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          Corporate Knowledge & Files
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
            {totalFiles} Files
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Organize and browse company policies, departmental SOPs, subfolders, contracts, and templates.
        </p>
      </div>

      {/* Header Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <button
          onClick={onExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <i className="ri-file-excel-2-line text-emerald-600 text-sm" />
          Export Catalog
        </button>

        {canManageDocs && (
          <>
            <button
              onClick={onOpenNewFolder}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-[#253C7D] text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <i className="ri-folder-add-line text-sm" />
              + New Folder
            </button>

            <button
              onClick={onOpenUploadModal}
              className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
            >
              <i className="ri-upload-cloud-line text-base font-bold" />
              Upload Document
            </button>
          </>
        )}
      </div>
    </div>
  );
});
