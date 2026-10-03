import { memo } from "react";
import type { Document, DocumentFolder } from "../types";
import { DocumentCard } from "./DocumentCard";

interface DocumentsCardsViewProps {
  documents: Document[];
  folders: DocumentFolder[];
  selectedDocId: string | null;
  canManageDocs: boolean;
  activeCategory: string;
  onSelectDoc: (doc: Document) => void;
  onOpenNewFolder: (parentId?: string) => void;
  onOpenUploadModal: () => void;
}

export const DocumentsCardsView = memo(function DocumentsCardsView({
  documents,
  folders,
  selectedDocId,
  canManageDocs,
  activeCategory,
  onSelectDoc,
  onOpenNewFolder,
  onOpenUploadModal,
}: DocumentsCardsViewProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
        <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
          <i className="ri-folder-open-line" />
        </div>
        <h3 className="text-base font-bold text-gray-900">No Documents Found</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No corporate files match your selected folder, subfolder, filter, or search query.
        </p>
        {canManageDocs && (
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <button
              onClick={() => onOpenNewFolder(activeCategory !== "all" ? activeCategory : undefined)}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-xs hover:bg-gray-50 transition-all cursor-pointer"
            >
              + Create Subfolder
            </button>
            <button
              onClick={onOpenUploadModal}
              className="px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
            >
              + Upload Document Here
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {documents.map((doc) => {
        const folder = folders.find((f) => f.id === doc.category);
        const parentFolder = folder?.parent_id ? folders.find((f) => f.id === folder.parent_id) : null;

        return (
          <DocumentCard
            key={doc.id}
            doc={doc}
            folder={folder}
            parentFolder={parentFolder}
            isSelected={selectedDocId === doc.id}
            onSelect={onSelectDoc}
          />
        );
      })}
    </div>
  );
});
