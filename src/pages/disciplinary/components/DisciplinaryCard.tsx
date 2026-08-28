import { memo } from "react";
import type { DisciplinaryRecord } from "../types";
import { TYPE_CONFIG, SEVERITY_CONFIG, STATUS_CONFIG } from "../constants";

interface DisciplinaryCardProps {
  record: DisciplinaryRecord;
  isSelected: boolean;
  onSelect: (record: DisciplinaryRecord) => void;
}

export const DisciplinaryCard = memo(function DisciplinaryCard({
  record: r,
  isSelected,
  onSelect,
}: DisciplinaryCardProps) {
  const typeCfg = TYPE_CONFIG[r.type] || TYPE_CONFIG.verbal_warning;
  const sevCfg = SEVERITY_CONFIG[r.severity] || SEVERITY_CONFIG.medium;
  const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.open;
  const emp = r.employees;
  const isOverdue =
    r.follow_up_date &&
    r.status !== "resolved" &&
    r.status !== "closed" &&
    new Date(r.follow_up_date + "T00:00:00") < new Date();

  return (
    <div
      onClick={() => onSelect(r)}
      className={`bg-white rounded-3xl border p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
        r.severity === "critical"
          ? "border-rose-200/90 hover:border-rose-300"
          : "border-gray-200/80 hover:border-gray-300"
      } ${isSelected ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : ""}`}
    >
      {/* Severity Left Highlight Stripe */}
      <div
        className={`absolute top-0 left-0 bottom-0 w-1.5 ${
          r.severity === "critical"
            ? "bg-rose-600"
            : r.severity === "high"
            ? "bg-rose-500"
            : r.severity === "medium"
            ? "bg-amber-500"
            : "bg-slate-400"
        }`}
      />

      <div>
        {/* Top Bar: Badges + Overdue Flag */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${typeCfg.bg} ${typeCfg.color} flex items-center gap-1`}
            >
              <i className={typeCfg.icon} />
              {typeCfg.label}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${sevCfg.bg} ${sevCfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sevCfg.dot}`} />
              {sevCfg.label}
            </span>
          </div>

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusCfg.bg} ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
        </div>

        {/* Scope Pill */}
        <div className="mb-2.5">
          {!r.branch_id ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              <i className="ri-global-line text-[10px]" /> Company-Wide (Admin)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
              <i className="ri-building-line text-[10px]" /> {r.branches?.name || "Branch Case"}
            </span>
          )}
        </div>

        {/* Incident Title */}
        <h3 className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors text-sm sm:text-[15px] leading-snug line-clamp-1 mb-1.5">
          {r.title}
        </h3>

        {/* Employee Details Card */}
        <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-gray-100 rounded-2xl mb-3">
          {emp?.avatar_url ? (
            <img src={emp.avatar_url} alt="" className="w-8 h-8 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xs font-black shrink-0">
              {emp ? emp.first_name[0] + emp.last_name[0] : "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-900 truncate">
              {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
            </p>
            <p className="text-[10px] text-gray-400 truncate">
              {emp?.role || "Staff"} · {emp?.department || "Department"}
            </p>
          </div>
        </div>

        {/* Description Excerpt */}
        {r.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
            {r.description}
          </p>
        )}

        {/* Overdue Alert Banner */}
        {isOverdue && (
          <div className="mb-3 p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-[11px] font-bold">
            <i className="ri-alarm-warning-line text-xs shrink-0" />
            <span className="truncate">Follow-up target date is overdue!</span>
          </div>
        )}

        {/* PIP Progress Bar Preview */}
        {r.type === "pip" && r.pip_start_date && r.pip_end_date && (
          <div className="p-2.5 bg-[#253C7D]/5 border border-[#253C7D]/15 rounded-xl text-xs space-y-1 mb-3">
            <div className="flex items-center justify-between text-[10px] text-[#253C7D] font-bold">
              <span>PIP Duration</span>
              <span>{new Date(r.pip_end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
            <div className="w-full bg-[#253C7D]/20 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#253C7D] h-full w-2/3 rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Card Bottom Meta */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1.5 text-[11px]">
          <i className="ri-calendar-line text-gray-400" />
          <span>
            {r.incident_date
              ? new Date(r.incident_date + "T00:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </span>
        </div>

        <span className="text-[11px] font-medium text-gray-500">Logged by {r.created_by}</span>
      </div>
    </div>
  );
});
