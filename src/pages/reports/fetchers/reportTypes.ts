import type { ReportRow } from "../types";

export interface ReportResult {
  rows: ReportRow[];
  columns: string[];
  summary: Record<string, string | number>;
}
