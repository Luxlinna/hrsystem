import { memo } from "react";
import type { Document } from "../types";
import { FILE_TYPE_COLOR, FILE_TYPE_ICON } from "../constants";

interface DocumentDrawerRelatedProps {
  relatedDocuments: Document[];
  onSelectDoc: (doc: Document) => void;
}

export const DocumentDrawerRelated = memo(function DocumentDrawerRelated({
  relatedDocuments,
  onSelectDoc,
}: DocumentDrawerRelatedProps) {
  if (relatedDocuments.length === 0) {
    return (
      <div className="text-center py-10 text-xs text-gray-400">
        No other files in this folder.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
        Other Files In This Folder:
      </span>
      {relatedDocuments.map((rd) => {
        const typeColor = FILE_TYPE_COLOR[rd.file_type] || "bg-gray-100 text-gray-600 border-gray-200";
        const typeIcon = FILE_TYPE_ICON[rd.file_type] || "ri-file-line";

        return (
          <div
            key={rd.id}
            onClick={() => onSelectDoc(rd)}
            className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-[#253C7D]/30 hover:bg-slate-50 transition-all cursor-pointer group"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold border shrink-0 ${typeColor}`}>
              <i className={typeIcon} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 group-hover:text-[#253C7D] truncate">
                {rd.title}
              </p>
              <p className="text-[10px] text-gray-400">
                v{rd.version} &bull; {rd.file_size || (rd.file_size_kb ? `${rd.file_size_kb} KB` : "—")}
              </p>
            </div>
            <i className="ri-arrow-right-s-line text-gray-400 group-hover:text-[#253C7D]" />
          </div>
        );
      })}
    </div>
  );
});
