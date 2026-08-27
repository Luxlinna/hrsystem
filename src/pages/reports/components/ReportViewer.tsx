import type { ReportConfig, ReportRow } from "../types";
import { useReportViewerData } from "../hooks/useReportViewerData";
import { SummaryCards } from "./SummaryCards";
import { DataTable } from "./DataTable";

interface Props {
  config: ReportConfig;
  onDataReady: (rows: ReportRow[], columns: string[]) => void;
}

export default function ReportViewer({ config, onDataReady }: Props) {
  const { rows, columns, loading, summary } = useReportViewerData(config, onDataReady);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-56 bg-white rounded-2xl border border-gray-100 shadow-2xs">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-gray-400 font-medium">Loading report records...</p>
      </div>
    );
  }

  return (
    <div id="report-content" className="space-y-4">
      <SummaryCards summary={summary} />
      <DataTable rows={rows} columns={columns} />
    </div>
  );
}
