import { memo } from "react";
import type { Document, DocumentFolder } from "../types";

interface DocumentDrawerHeaderProps {
  selectedDoc: Document;
  folder?: DocumentFolder;
  parentFolder?: DocumentFolder | null;
  typeColor: string;
  typeIcon: string;
  onClose: () => void;
}

export const DocumentDrawerHeader = memo(function DocumentDrawerHeader({
  selectedDoc,
  folder,
  parentFolder,
  typeColor,
  typeIcon,
  onClose,
}: DocumentDrawerHeaderProps) {
  return (
    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-bold border shrink-0 shadow-2xs ${typeColor}`}>
          <i className={typeIcon} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <h3 className="text-base font-extrabold text-gray-900 truncate">{selectedDoc.title}</h3>
            <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-md bg-gray-100 text-gray-700">
              v{selectedDoc.version}
            </span>
            {selectedDoc.is_template && (
              <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-md bg-[#253C7D]/10 text-[#253C7D] border border-[#253C7D]/20">
                Template
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate flex items-center gap-1">
            <i className="ri-folder-line text-gray-400" />
            {parentFolder ? `${parentFolder.label} / ` : ""}
            <strong className="text-gray-700">{folder?.label || selectedDoc.category}</strong>
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer shrink-0"
      >
        <i className="ri-close-line text-lg" />
      </button>
    </div>
  );
});
