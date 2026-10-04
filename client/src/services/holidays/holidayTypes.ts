export interface Holiday {
  id?: string;
  date: string; // YYYY-MM-DD
  name: string; // English name
  local_name?: string | null; // Khmer name
  year: number;
  is_paid: boolean;
  branch_id?: string | null;
  created_at?: string;
}

export interface KhmerLunarDayInfo {
  isSilDay: boolean;
  lunarDayShort: string; // e.g. "៦កើត", "១៥កើត", "៨រោច"
  khmerMonth: string; // e.g. "ភទ្របទ"
  animalYear: string; // e.g. "មមី"
  buddhistEraYear: number; // e.g. 2570
  fullText: string;
}
