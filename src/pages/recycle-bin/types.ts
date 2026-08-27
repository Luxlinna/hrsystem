export interface BinItem {
  table: string;
  id: string | number;
  label: string;
  detail: string;
  deleted_at: string;
  deleted_by: string | null;
  raw?: any;
}

export interface ModuleConfig {
  table: string;
  name: string;
  icon: string;
  select: string;
  label: (r: any) => string;
  detail: (r: any) => string;
}

export interface ModuleCount extends ModuleConfig {
  count: number;
}
