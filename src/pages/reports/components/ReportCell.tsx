import type { ReportRow } from "../types";
import { STATUS_COLOR, COLUMN_KEY_MAP } from "../constants";

export function ReportCell({ col, row }: { col: string; row: ReportRow }) {
  const key = COLUMN_KEY_MAP[col] || col.toLowerCase().replace(/ /g, "_");
  const val = (row as any)[key] ?? "—";

  if (col === "Status" || col === "status") {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize whitespace-nowrap shadow-2xs ${STATUS_COLOR[String(val).toLowerCase()] || "bg-gray-100 text-gray-700"}`}>
        {String(val)}
      </span>
    );
  }
  if (col === "Deleted By") {
    return val && val !== "—" ? (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs whitespace-nowrap">
        <i className="ri-user-unfollow-line text-xs" />
        {String(val)}
      </span>
    ) : (
      <span className="text-gray-300 font-mono text-xs">—</span>
    );
  }
  if (col === "Deleted Date & Time" || col === "Deleted At") {
    return val && val !== "—" ? (
      <span className="text-[11px] text-rose-700 font-medium whitespace-nowrap inline-flex items-center gap-1">
        <i className="ri-calendar-close-line text-xs text-rose-500" />
        {String(val)}
      </span>
    ) : (
      <span className="text-gray-300 font-mono text-xs">—</span>
    );
  }
  if (col === "Priority") {
    const p = String(val).toLowerCase();
    const pBg =
      p === "high"
        ? "bg-red-50 text-red-700 border-red-200"
        : p === "medium"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";
    return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${pBg} uppercase whitespace-nowrap`}>{String(val)}</span>;
  }
  if (col === "Attendance Rate (%)") {
    const rate = Number(val) || 0;
    return (
      <div className="flex items-center gap-2 min-w-[110px]">
        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
          <div
            className={`h-full rounded-full ${rate >= 90 ? "bg-emerald-500" : rate >= 75 ? "bg-amber-500" : "bg-rose-500"}`}
            style={{ width: `${Math.min(rate, 100)}%` }}
          />
        </div>
        <span className="font-bold text-gray-800 text-[11px]">{rate}%</span>
      </div>
    );
  }
  if (col === "Late (Min)" || col === "Late Minutes") {
    const mins = Number(val) || 0;
    return mins > 0 ? (
      <span className="font-semibold text-amber-700 whitespace-nowrap">{mins}m</span>
    ) : (
      <span className="text-gray-300 font-mono text-xs">—</span>
    );
  }
  if (col === "Stage" || col === "Category") {
    return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200/60 whitespace-nowrap">{String(val)}</span>;
  }
  if (col === "Verified Docs") {
    return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-[#253C7D] border border-blue-200 shadow-2xs whitespace-nowrap">{String(val)}</span>;
  }
  if (col === "Verified Date & Time" || col === "Verified At") {
    return val && val !== "—" ? (
      <span className="text-[11px] text-slate-700 font-medium whitespace-nowrap">{String(val)}</span>
    ) : (
      <span className="text-gray-300 font-mono text-xs">—</span>
    );
  }
  if (col.includes("Salary") || col.includes("Pay") || col.includes("Bonus") || col.includes("Deduct") || col === "Amount") {
    return <span className="font-semibold text-slate-900">${Number(val || 0).toLocaleString()}</span>;
  }
  if (col === "Employee" || col === "Candidate") {
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-bold text-[10px] flex items-center justify-center shrink-0">
          {String(val).charAt(0).toUpperCase()}
        </div>
        <span className="font-semibold text-gray-900 whitespace-nowrap">{String(val)}</span>
      </div>
    );
  }
  return <span className="text-gray-700 whitespace-nowrap">{String(val ?? "—")}</span>;
}
