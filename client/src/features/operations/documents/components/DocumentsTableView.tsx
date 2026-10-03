import { memo } from "react";
import type { Document, DocumentFolder } from "../types";
import { FILE_TYPE_COLOR, FILE_TYPE_ICON, VISIBILITY_LABELS } from "../constants";
import { formatSize } from "../exportUtils";

interface DocumentsTableViewProps {
  documents: Document[];
  folders: DocumentFolder[];
  onSelectDoc: (doc: Document) => void;
  onDownload: (doc: Document) => void;
}

export const DocumentsTableView = memo(function DocumentsTableView({
  documents,
  folders,
  onSelectDoc,
  onDownload,
}: DocumentsTableViewProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="px-5 py-3.5">Document</th>
              <th className="px-5 py-3.5">Folder</th>
              <th className="px-5 py-3.5">Visibility</th>
              <th className="px-5 py-3.5">Version</th>
              <th className="px-5 py-3.5">Size</th>
              <th className="px-5 py-3.5">Downloads</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {documents.map((doc) => {
              const typeIcon = FILE_TYPE_ICON[doc.file_type] || "ri-file-line";
              const typeColor = FILE_TYPE_COLOR[doc.file_type] || "bg-gray-100 text-gray-600 border-gray-200";
              const vis = VISIBILITY_LABELS[doc.visibility] || VISIBILITY_LABELS.all;
              const folder = folders.find((f) => f.id === doc.category);
              const parentF = folder?.parent_id ? folders.find((f) => f.id === folder.parent_id) : null;

              return (
                <tr
                  key={doc.id}
                  onClick={() => onSelectDoc(doc)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-base font-bold border shrink-0 shadow-2xs ${typeColor}`}
                      >
                        <i className={typeIcon} />
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors text-xs sm:text-sm">
                          {doc.title}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate max-w-xs">{doc.author_name}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-700">
                    {parentF ? (
                      <span className="text-gray-400 text-[11px]">
                        {parentF.label} / <strong className="text-gray-800">{folder?.label}</strong>
                      </span>
                    ) : (
                      folder ? folder.label : doc.category
                    )}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${vis.color}`}>
                      {vis.label}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900">
                    v{doc.version}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 font-medium">
                    {formatSize(doc.file_size_kb)}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap font-black text-gray-900">
                    {doc.download_count}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        doc.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      ● {doc.status}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onDownload(doc)}
                        className="px-2.5 py-1 text-xs font-bold text-[#253C7D] bg-[#253C7D]/10 hover:bg-[#253C7D]/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <i className="ri-download-line text-xs" />
                        Download
                      </button>
                      <button
                        onClick={() => onSelectDoc(doc)}
                        className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Inspect Details"
                      >
                        <i className="ri-arrow-right-s-line text-base font-bold" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
