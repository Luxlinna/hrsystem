import { memo } from "react";
import type { DisciplinaryRecord } from "../types";
import { TYPE_CONFIG } from "../constants";
import {
  exportDisciplinaryXLSX,
  exportDisciplinaryCSV,
  exportWarningLetterPdf,
} from "../exportUtils";

interface DisciplinaryDrawerBodyProps {
  record: DisciplinaryRecord;
  isOverdue: boolean;
}

export const DisciplinaryDrawerBody = memo(function DisciplinaryDrawerBody({
  record,
  isOverdue,
}: DisciplinaryDrawerBodyProps) {
  const emp = record.employees;
  const warningTypeKey = record.warning_type || record.type;
  const warningConfig = TYPE_CONFIG[warningTypeKey] || TYPE_CONFIG.written_warning;

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
      {/* Employee Profile Card */}
      {emp && (
        <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700 rounded-2xl">
          {emp.avatar_url ? (
            <img src={emp.avatar_url} alt="" className="w-11 h-11 rounded-2xl object-cover shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-[#253C7D] text-white flex items-center justify-center text-sm font-black shrink-0">
              {emp.first_name[0]}{emp.last_name[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <p className="text-sm font-black text-gray-900 dark:text-white truncate">
                {emp.first_name} {emp.last_name}
              </p>
              {emp.employee_id && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 shrink-0">
                  {emp.employee_id}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{emp.role}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{emp.department}</p>
          </div>
        </div>
      )}

      {/* Case Title & Warning Badge */}
      <div>
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase ${warningConfig?.bg || "bg-gray-100"} ${warningConfig?.color || "text-gray-700"}`}>
            {warningConfig?.label || record.type}
          </span>
          {record.warning_date && (
            <span className="text-[11px] font-mono text-gray-400">
              Issued: {new Date(record.warning_date + "T00:00:00").toLocaleDateString()}
            </span>
          )}
        </div>
        <h3 className="text-base font-black text-gray-900 dark:text-white">{record.title}</h3>
      </div>

      {/* Incident Description */}
      {record.description && (
        <div className="p-3.5 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-700/80 space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Description of Warning &amp; Infraction:
          </span>
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {record.description}
          </p>
        </div>
      )}

      {/* Action to Take */}
      {(record.action_to_take || record.action_taken) && (
        <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 space-y-1">
          <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider">
            <i className="ri-shield-flash-line" />
            <span>Action to Take / Corrective Measure</span>
          </div>
          <p className="text-xs font-semibold text-rose-900 dark:text-rose-200 leading-relaxed whitespace-pre-line">
            {record.action_to_take || record.action_taken}
          </p>
        </div>
      )}

      {/* Employee Promise */}
      {record.employee_promise && (
        <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <i className="ri-hand-heart-line" />
            <span>Employee Promise (Rectification Commitment)</span>
          </div>
          <p className="text-xs italic text-emerald-900 dark:text-emerald-200 leading-relaxed whitespace-pre-line">
            "{record.employee_promise}"
          </p>
        </div>
      )}

      {/* Remark */}
      {(record.remark || record.notes) && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-700 text-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Remark / Notes:
          </span>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{record.remark || record.notes}</p>
        </div>
      )}

      {/* Supporting Attachment */}
      {record.document_url && (
        <div className="p-3 bg-blue-50/40 dark:bg-blue-950/20 rounded-2xl border border-blue-200/50 dark:border-blue-900/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#253C7D] text-white flex items-center justify-center shrink-0 text-sm">
              <i className="ri-attachment-line" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {record.document_name || "Signed Warning Document"}
              </div>
              <div className="text-[10px] text-gray-400">Attached Evidence &bull; Verified</div>
            </div>
          </div>
          <a
            href={record.document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors shrink-0"
          >
            <i className="ri-external-link-line" />
            <span>View</span>
          </a>
        </div>
      )}

      {/* Export Options for this Record */}
      <div className="pt-1 space-y-2">
        <button
          type="button"
          onClick={() => exportWarningLetterPdf(record)}
          className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-98"
        >
          <i className="ri-file-pdf-2-line text-sm text-rose-600 dark:text-rose-400" />
          <span>Download / Print PDF Warning Letter</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportDisciplinaryXLSX([record])}
            className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98"
          >
            <i className="ri-file-excel-2-line text-sm text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            type="button"
            onClick={() => exportDisciplinaryCSV([record])}
            className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98"
          >
            <i className="ri-file-text-line text-sm text-blue-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">Incident / Warning Date:</span>
          <span className="font-bold text-gray-800 dark:text-gray-200">
            {record.warning_date || record.incident_date
              ? new Date((record.warning_date || record.incident_date) + "T00:00:00").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "—"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">Follow-up Target Date:</span>
          <span className={isOverdue ? "text-rose-600 font-black flex items-center gap-1" : "font-bold text-gray-800 dark:text-gray-200"}>
            {record.follow_up_date
              ? new Date(record.follow_up_date + "T00:00:00").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "None set"}
            {isOverdue && " (Overdue)"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">Logged By:</span>
          <span className="font-bold text-gray-800 dark:text-gray-200">{record.created_by}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">Created On:</span>
          <span className="font-bold text-gray-800 dark:text-gray-200">
            {new Date(record.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
});

