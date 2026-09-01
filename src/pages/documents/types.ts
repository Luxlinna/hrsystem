export interface Document {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  department?: string | null;
  description: string | null;
  file_name: string | null;
  file_size?: string | null;
  file_size_kb: number | null;
  file_type: string;
  file_url: string | null;
  version: string;
  status: string;
  visibility: string;
  author_name: string;
  created_by?: string | null;
  requires_acknowledgment?: boolean;
  tags: string[];
  download_count: number;
  is_template: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentFolder {
  id: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  border?: string;
  description?: string | null;
  is_system?: boolean;
  sort_order?: number;
  parent_id?: string | null;
}

export interface FolderColorPreset {
  id: string;
  label: string;
  color: string;
  bg: string;
  border: string;
}

export interface FolderFormState {
  label: string;
  parentId: string;
  icon: string;
  colorPreset: string;
  description: string;
}

export interface DocFormState {
  title: string;
  category: string;
  subcategory: string;
  department?: string;
  description: string;
  file_name: string;
  file_type: string;
  version: string;
  status?: string;
  visibility: string;
  author_name: string;
  is_template: boolean;
  requires_acknowledgment?: boolean;
  tags: string;
  tagsInput?: string;
  change_summary?: string;
}

export type DrawerTabKey = "overview" | "related" | "move";
export type StatusFilter = "all" | "active" | "archived";
export type ViewMode = "cards" | "table";
