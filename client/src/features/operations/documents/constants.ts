import type { DocumentFolder, FolderColorPreset, DocFormState, FolderFormState } from "./types";

export const DEFAULT_FOLDERS: DocumentFolder[] = [
  { id: "policy", label: "Policies", icon: "ri-file-text-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", is_system: true, sort_order: 1, parent_id: null },
  { id: "contract", label: "Contracts", icon: "ri-draft-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", is_system: true, sort_order: 2, parent_id: null },
  { id: "template", label: "Templates", icon: "ri-file-copy-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", is_system: true, sort_order: 3, parent_id: null },
  { id: "compliance", label: "Compliance", icon: "ri-shield-check-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", is_system: true, sort_order: 4, parent_id: null },
  { id: "benefits", label: "Benefits", icon: "ri-heart-pulse-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", is_system: true, sort_order: 5, parent_id: null },
  { id: "training", label: "Training", icon: "ri-graduation-cap-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", is_system: true, sort_order: 6, parent_id: null },
  { id: "org", label: "Org Docs", icon: "ri-organization-chart", color: "text-slate-600", bg: "bg-slate-100", is_system: true, sort_order: 7, parent_id: null },
];

export const FOLDER_COLOR_PRESETS: FolderColorPreset[] = [
  { id: "navy", label: "Navy", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", border: "border-[#253C7D]/20" },
  { id: "slate", label: "Slate", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
  { id: "emerald", label: "Emerald", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  { id: "amber", label: "Amber", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { id: "rose", label: "Rose", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
];

export const AVAILABLE_FOLDER_ICONS = [
  "ri-folder-line",
  "ri-folder-2-line",
  "ri-folder-user-line",
  "ri-folder-chart-line",
  "ri-folder-lock-line",
  "ri-folder-shared-line",
  "ri-folder-shield-line",
  "ri-file-text-line",
  "ri-draft-line",
  "ri-file-copy-line",
  "ri-shield-check-line",
  "ri-heart-pulse-line",
  "ri-graduation-cap-line",
  "ri-organization-chart",
  "ri-briefcase-line",
  "ri-booklet-line",
  "ri-award-line",
  "ri-scales-3-line",
  "ri-bank-card-line",
  "ri-building-line",
  "ri-settings-4-line",
  "ri-tools-line",
  "ri-customer-service-2-line",
  "ri-global-line",
];

export const FILE_TYPE_ICON: Record<string, string> = {
  pdf: "ri-file-pdf-line",
  doc: "ri-file-word-line",
  docx: "ri-file-word-line",
  xls: "ri-file-excel-line",
  xlsx: "ri-file-excel-line",
  csv: "ri-file-excel-line",
  ppt: "ri-file-ppt-line",
  pptx: "ri-file-ppt-line",
  jpg: "ri-image-line",
  jpeg: "ri-image-line",
  png: "ri-image-line",
  gif: "ri-image-line",
  webp: "ri-image-line",
  svg: "ri-image-line",
  txt: "ri-file-text-line",
  md: "ri-file-text-line",
  json: "ri-file-code-line",
  zip: "ri-file-zip-line",
  rar: "ri-file-zip-line",
  mp4: "ri-video-line",
  mp3: "ri-music-line",
};

export const FILE_TYPE_COLOR: Record<string, string> = {
  pdf: "bg-rose-50 text-rose-600 border-rose-200",
  doc: "bg-[#253C7D]/10 text-[#253C7D] border-[#253C7D]/20",
  docx: "bg-[#253C7D]/10 text-[#253C7D] border-[#253C7D]/20",
  xls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  xlsx: "bg-emerald-50 text-emerald-700 border-emerald-200",
  csv: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ppt: "bg-amber-50 text-amber-600 border-amber-200",
  pptx: "bg-amber-50 text-amber-600 border-amber-200",
  jpg: "bg-slate-100 text-slate-600 border-slate-200",
  jpeg: "bg-slate-100 text-slate-600 border-slate-200",
  png: "bg-slate-100 text-slate-600 border-slate-200",
  gif: "bg-slate-100 text-slate-600 border-slate-200",
  webp: "bg-slate-100 text-slate-600 border-slate-200",
  svg: "bg-slate-100 text-slate-600 border-slate-200",
  txt: "bg-slate-100 text-slate-600 border-slate-200",
  md: "bg-slate-100 text-slate-600 border-slate-200",
  json: "bg-slate-100 text-slate-600 border-slate-200",
  zip: "bg-slate-100 text-slate-600 border-slate-200",
  rar: "bg-slate-100 text-slate-600 border-slate-200",
  mp4: "bg-slate-100 text-slate-600 border-slate-200",
  mp3: "bg-slate-100 text-slate-600 border-slate-200",
};

export const MAX_FILE_SIZE_MB = 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const VISIBILITY_LABELS: Record<string, { label: string; color: string }> = {
  all: { label: "All Staff", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  hr_only: { label: "HR Only", color: "bg-amber-50 text-amber-700 border-amber-200" },
  managers: { label: "Managers Only", color: "bg-[#253C7D]/10 text-[#253C7D] border-[#253C7D]/20" },
};

export const INITIAL_DOC_FORM: DocFormState = {
  title: "",
  category: "policy",
  subcategory: "",
  description: "",
  file_name: "",
  file_type: "pdf",
  version: "1.0",
  visibility: "all",
  author_name: "HR Team",
  is_template: false,
  tags: "",
};

export const INITIAL_FOLDER_FORM: FolderFormState = {
  label: "",
  parentId: "",
  icon: "ri-folder-line",
  colorPreset: "navy",
  description: "",
};
