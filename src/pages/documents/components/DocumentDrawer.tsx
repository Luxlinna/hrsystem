import { memo } from "react";
import type { Document, DocumentFolder, DrawerTabKey } from "../types";
import { FILE_TYPE_COLOR, FILE_TYPE_ICON, VISIBILITY_LABELS } from "../constants";
import { formatSize, cleanFileName } from "../exportUtils";

interface DocumentDrawerProps {
  selectedDoc: Document | null;
  folders: DocumentFolder[];
  rootFolders: DocumentFolder[];
  drawerTab: DrawerTabKey;
  setDrawerTab: (tab: DrawerTabKey) => void;
  relatedDocuments: Document[];
  canManageDocs: boolean;
  onClose: () => void;
  onSelectDoc: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onCopyLink: (doc: Document) => void;
  onQuickMoveFolder: (docId: string, newCategoryId: string) => void;
  onOpenEdit: (doc: Document) => void;
  onArchive: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onSearchTag: (tag: string) => void;
}

export const DocumentDrawer = memo(function DocumentDrawer({
  selectedDoc,
  folders,
  rootFolders,
  drawerTab,
  setDrawerTab,
  relatedDocuments,
  canManageDocs,
  onClose,
  onSelectDoc,
  onDownload,
  onCopyLink,
  onQuickMoveFolder,
  onOpenEdit,
  onArchive,
  onDelete,
  onSearchTag,
}: DocumentDrawerProps) {
  if (!selectedDoc) return null;

  const folder = folders.find((f) => f.id === selectedDoc.category);
  const parentFolder = folder?.parent_id ? folders.find((f) => f.id === folder.parent_id) : null;
  const typeColor = FILE_TYPE_COLOR[selectedDoc.file_type] || "bg-gray-100 text-gray-600 border-gray-200";
  const typeIcon = FILE_TYPE_ICON[selectedDoc.file_type] || "ri-file-line";

  const getSubfolders = (parentId: string) => folders.filter((f) => f.parent_id === parentId);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full sm:w-[500px] bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 overflow-hidden">
        {/* Drawer Top Header */}
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
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer shrink-0"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Quick Action Buttons Strip */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-gray-100 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {selectedDoc.file_url ? (
              <a
                href={selectedDoc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <i className="ri-external-link-line text-emerald-600" />
                Open Preview
              </a>
            ) : null}

            <button
              type="button"
              onClick={() => onCopyLink(selectedDoc)}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <i className="ri-file-copy-line text-[#253C7D]" />
              Copy Link
            </button>
          </div>

          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${selectedDoc.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
            ● {selectedDoc.status}
          </span>
        </div>

        {/* Sub-Tabs Inside Drawer */}
        <div className="px-5 pt-3 shrink-0">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setDrawerTab("overview")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                drawerTab === "overview"
                  ? "bg-white text-[#253C7D] shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <i className="ri-information-line" />
              <span>File Details</span>
            </button>

            <button
              onClick={() => setDrawerTab("related")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                drawerTab === "related"
                  ? "bg-white text-[#253C7D] shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <i className="ri-folder-line" />
              <span>Folder Files ({relatedDocuments.length + 1})</span>
            </button>

            {canManageDocs && (
              <button
                onClick={() => setDrawerTab("move")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  drawerTab === "move"
                    ? "bg-white text-[#253C7D] shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <i className="ri-arrow-left-right-line" />
                <span>Move Folder</span>
              </button>
            )}
          </div>
        </div>

        {/* Drawer Middle Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: OVERVIEW & METADATA */}
          {drawerTab === "overview" && (
            <div className="space-y-4">
              {/* Clean Filename Banner */}
              <div className="p-3.5 bg-slate-50 border border-gray-200/80 rounded-2xl flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold border shrink-0 ${typeColor}`}>
                  <i className={typeIcon} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-gray-900 truncate">
                    {cleanFileName(selectedDoc.file_name)}
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                    {selectedDoc.file_type.toUpperCase()} File · {formatSize(selectedDoc.file_size_kb)}
                  </p>
                </div>
              </div>

              {/* Description Box */}
              {selectedDoc.description && (
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-700 leading-relaxed space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Summary & Purpose:
                  </span>
                  <p>{selectedDoc.description}</p>
                </div>
              )}

              {/* Structured Metadata Matrix */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100 space-y-2.5 text-xs">
                {[
                  {
                    label: "Folder Location",
                    value: (
                      <span className="inline-flex items-center gap-1 font-bold text-[#253C7D]">
                        <i className={folder?.icon || "ri-folder-line"} />
                        {parentFolder ? `${parentFolder.label} / ` : ""}
                        {folder?.label || selectedDoc.category}
                      </span>
                    ),
                  },
                  {
                    label: "Audience Visibility",
                    value: (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${VISIBILITY_LABELS[selectedDoc.visibility]?.color || "bg-gray-100 text-gray-600"}`}>
                        {VISIBILITY_LABELS[selectedDoc.visibility]?.label || selectedDoc.visibility}
                      </span>
                    ),
                  },
                  { label: "Document Version", value: `v${selectedDoc.version}` },
                  { label: "Author / Issuer", value: selectedDoc.author_name },
                  {
                    label: "Status",
                    value: (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${selectedDoc.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        ● {selectedDoc.status}
                      </span>
                    ),
                  },
                  {
                    label: "Created On",
                    value: new Date(selectedDoc.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }),
                  },
                  {
                    label: "Last Modified",
                    value: new Date(selectedDoc.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span className="text-gray-400 font-medium">{row.label}</span>
                    <span className="font-bold text-gray-800 text-right">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Tags */}
              {selectedDoc.tags && selectedDoc.tags.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Tags & Topics (Click to search):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoc.tags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => onSearchTag(t)}
                        className="text-xs font-bold px-2.5 py-1 bg-white hover:bg-slate-100 border border-gray-200 text-gray-700 rounded-xl transition-colors cursor-pointer"
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RELATED FILES IN SAME FOLDER */}
          {drawerTab === "related" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                <span>Files in <strong>{folder?.label || "this folder"}</strong>:</span>
                <span>{relatedDocuments.length + 1} Total</span>
              </div>

              {/* Current File Banner */}
              <div className="p-3 bg-[#253C7D]/5 border border-[#253C7D]/20 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border shrink-0 ${typeColor}`}>
                    <i className={typeIcon} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-[#253C7D] truncate">{selectedDoc.title}</p>
                    <p className="text-[10px] text-gray-400">Currently Viewing</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#253C7D] text-white rounded-md">
                  Active
                </span>
              </div>

              {/* Other Related Files */}
              {relatedDocuments.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">
                  No other files in this folder yet.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {relatedDocuments.map((rd) => {
                    const rdColor = FILE_TYPE_COLOR[rd.file_type] || "bg-gray-100 text-gray-600 border-gray-200";
                    const rdIcon = FILE_TYPE_ICON[rd.file_type] || "ri-file-line";
                    return (
                      <div
                        key={rd.id}
                        onClick={() => onSelectDoc(rd)}
                        className="p-2.5 bg-gray-50 hover:bg-slate-100 rounded-2xl border border-gray-100 flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border shrink-0 ${rdColor}`}>
                            <i className={rdIcon} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 group-hover:text-[#253C7D] transition-colors truncate">
                              {rd.title}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {rd.file_type.toUpperCase()} · v{rd.version} · {formatSize(rd.file_size_kb)}
                            </p>
                          </div>
                        </div>

                        <i className="ri-arrow-right-s-line text-gray-400 text-sm group-hover:text-[#253C7D] transition-colors" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QUICK RELOCATE FOLDER */}
          {drawerTab === "move" && canManageDocs && (
            <div className="space-y-4">
              <div className="p-3 bg-[#253C7D]/5 border border-[#253C7D]/15 rounded-2xl text-xs text-[#253C7D]">
                <p className="font-bold flex items-center gap-1 mb-1">
                  <i className="ri-information-line" />
                  Quick Move Destination:
                </p>
                <p className="text-[11px] text-[#253C7D]">
                  Select any category or subfolder to immediately reassign this document.
                </p>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {rootFolders.map((rf) => {
                  const subs = getSubfolders(rf.id);
                  const isCurrentRoot = selectedDoc.category === rf.id;

                  return (
                    <div key={rf.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => onQuickMoveFolder(selectedDoc.id, rf.id)}
                        className={`w-full p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isCurrentRoot
                            ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <i className={rf.icon || "ri-folder-line"} />
                          <span>{rf.label} (Main)</span>
                        </div>
                        {isCurrentRoot && <span className="text-[10px] bg-white/20 px-2 py-0.2 rounded-full">Current</span>}
                      </button>

                      {subs.map((s) => {
                        const isCurrentSub = selectedDoc.category === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => onQuickMoveFolder(selectedDoc.id, s.id)}
                            className={`w-[calc(100%-1.25rem)] ml-5 p-2 rounded-xl border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                              isCurrentSub
                                ? "bg-[#253C7D] text-white font-bold border-[#253C7D] shadow-xs"
                                : "bg-gray-50 border-gray-200/80 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <i className={s.icon || "ri-folder-2-line"} />
                              <span>↳ {s.label}</span>
                            </div>
                            {isCurrentSub && <span className="text-[10px] bg-white/20 px-2 py-0.2 rounded-full font-bold">Current</span>}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Fixed Bottom Actions Footer */}
        <div className="p-4 border-t border-gray-100 bg-white space-y-2 shrink-0">
          <button
            onClick={() => onDownload(selectedDoc)}
            className="w-full flex items-center justify-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <i className="ri-download-2-line text-sm" />
            Download Document
          </button>

          {canManageDocs && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onOpenEdit(selectedDoc)}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
              >
                <i className="ri-edit-line text-sm" />
                Edit Details
              </button>

              <button
                onClick={() => onArchive(selectedDoc)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                  selectedDoc.status === "active"
                    ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                <i
                  className={`text-sm ${
                    selectedDoc.status === "active" ? "ri-archive-line" : "ri-inbox-unarchive-line"
                  }`}
                />
                {selectedDoc.status === "active" ? "Archive" : "Restore"}
              </button>
            </div>
          )}

          {canManageDocs && (
            <button
              onClick={() => onDelete(selectedDoc)}
              className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <i className="ri-delete-bin-line text-xs" />
              Move to Recycle Bin
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
