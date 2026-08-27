import { memo } from "react";
import type { Document, DocumentFolder } from "../types";
import { FILE_TYPE_COLOR, FILE_TYPE_ICON, VISIBILITY_LABELS } from "../constants";
import { formatSize } from "../exportUtils";

interface DocumentCardProps {
  doc: Document;
  folder?: DocumentFolder;
  parentFolder?: DocumentFolder | null;
  isSelected: boolean;
  onSelect: (doc: Document) => void;
}

export const DocumentCard = memo(function DocumentCard({
  doc,
  folder,
  parentFolder,
  isSelected,
  onSelect,
}: DocumentCardProps) {
  const typeIcon = FILE_TYPE_ICON[doc.file_type] || "ri-file-line";
  const typeColor = FILE_TYPE_COLOR[doc.file_type] || "bg-gray-100 text-gray-600 border-gray-200";
  const vis = VISIBILITY_LABELS[doc.visibility] || VISIBILITY_LABELS.all;

  return (
    <div
      onClick={() => onSelect(doc)}
      className={`bg-white rounded-3xl border p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
        doc.status === "archived" ? "opacity-60 bg-gray-50/50" : "border-gray-200/80"
      } ${isSelected ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : ""}`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-bold border shrink-0 shadow-2xs ${typeColor}`}
          >
            <i className={typeIcon} />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {folder && (
              <span
                className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${folder.bg} ${folder.color} border-current/20 flex items-center gap-1`}
                title={parentFolder ? `${parentFolder.label} / ${folder.label}` : folder.label}
              >
                <i className={folder.icon || "ri-folder-line"} />
                {parentFolder ? `${parentFolder.label} / ${folder.label}` : folder.label}
              </span>
            )}
            {doc.is_template && (
              <span className="text-[9px] font-extrabold px-2 py-0.5 bg-[#253C7D]/10 text-[#253C7D] border border-[#253C7D]/20 rounded-full">
                Template
              </span>
            )}
            {doc.status === "archived" && (
              <span className="text-[9px] font-extrabold px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-full">
                Archived
              </span>
            )}
          </div>
        </div>

        <h4 className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors text-sm line-clamp-2 mb-1.5">
          {doc.title}
        </h4>

        {doc.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
            {doc.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${vis.color}`}>
            {vis.label}
          </span>
          <span className="text-[11px] font-bold text-gray-500">v{doc.version}</span>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-600">{doc.file_type.toUpperCase()}</span>
          <span>·</span>
          <span>{formatSize(doc.file_size_kb)}</span>
        </div>

        <div className="flex items-center gap-1 font-bold text-gray-600">
          <i className="ri-download-line text-xs" />
          <span>{doc.download_count}</span>
        </div>
      </div>
    </div>
  );
});
