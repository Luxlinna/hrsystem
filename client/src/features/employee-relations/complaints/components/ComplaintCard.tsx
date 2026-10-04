import { memo } from "react";
import type { ComplaintSuggestion, ComplaintStatus } from "../types";
import { COMPLAINT_TYPE_CONFIG, COMPLAINT_STATUS_CONFIG } from "../constants";

interface ComplaintCardProps {
  record: ComplaintSuggestion;
  onSelect: (record: ComplaintSuggestion) => void;
  onEdit: (record: ComplaintSuggestion) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: ComplaintStatus) => void;
  onPreviewAttachment: (url: string, name: string) => void;
}

export const ComplaintCard = memo(function ComplaintCard({
  record,
  onSelect,
  onEdit,
  onDelete,
  onUpdateStatus,
  onPreviewAttachment,
}: ComplaintCardProps) {
  const typeCfg = COMPLAINT_TYPE_CONFIG[record.type] ?? COMPLAINT_TYPE_CONFIG.complaint;
  const statusCfg = COMPLAINT_STATUS_CONFIG[record.status] ?? COMPLAINT_STATUS_CONFIG.pending;
  const targetCategory = record.target_category || "Business Unit";

  const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, "").trim();

  return (
    <div
      onClick={() => onSelect(record)}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group hover:border-sky-300"
    >
      <div>
        {/* Top Badges & Date */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${typeCfg.bg} ${typeCfg.text} ${typeCfg.border}`}>
              <i className={`${typeCfg.icon} text-[10px]`} />
              {typeCfg.label}
            </span>
            <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
              <i className={`${statusCfg.icon} text-[10px]`} />
              {statusCfg.label}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">
            {record.entry_date}
          </span>
        </div>

        {/* Subject */}
        <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-2 mb-2">
          {record.subject}
        </h4>

        {/* Snippet */}
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          {stripHtml(record.details)}
        </p>

        {/* Target & Submitter */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <i className={`text-slate-400 ${targetCategory === "Department" ? "ri-community-line" : targetCategory === "Employee" ? "ri-user-shared-line" : "ri-building-line"}`} />
            <span className="text-[11px] text-slate-400 font-medium">{targetCategory}:</span>
            <span className="font-semibold text-slate-800 truncate" title={record.target_to}>
              {record.target_to}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {record.show_identity === false ? (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                <i className="ri-shield-user-line text-[11px]" />
                Anonymous
              </span>
            ) : record.employees ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                <i className="ri-user-line text-slate-400" />
                <span className="truncate">
                  {record.employees.first_name} {record.employees.last_name}
                </span>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          {record.attachment_url ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreviewAttachment(record.attachment_url!, record.attachment_name || "Attachment");
              }}
              className="inline-flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-900 font-semibold bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-attachment-line" />
              <span>Attachment</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-300">No attachment</span>
          )}
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(record)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
            title="Edit record"
          >
            <i className="ri-edit-line text-sm" />
          </button>
          <button
            onClick={() => onDelete(record.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete record"
          >
            <i className="ri-delete-bin-line text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
});
