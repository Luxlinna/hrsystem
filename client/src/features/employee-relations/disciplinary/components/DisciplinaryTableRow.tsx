import { memo, useState, useRef } from "react";
import type { DisciplinaryRecord } from "../types";
import { formatDateDMY, formatMultilinePreview } from "../utils/formatters";
import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";
import { WarningRowMenu } from "./WarningRowMenu";

interface DisciplinaryTableRowProps {
  record: DisciplinaryRecord;
  index: number;
  onSelectRecord: (record: DisciplinaryRecord) => void;
  onEditRecord?: (record: DisciplinaryRecord) => void;
  onVoidRecord?: (record: DisciplinaryRecord) => void;
  onDeleteRecord?: (record: DisciplinaryRecord) => void;
}

export const DisciplinaryTableRow = memo(function DisciplinaryTableRow({
  record: r,
  index,
  onSelectRecord,
  onEditRecord,
  onVoidRecord,
  onDeleteRecord,
}: DisciplinaryTableRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const emp = r.employees;
  const warningType = r.warning_type || r.type || "Warning";
  const warningDate = formatDateDMY(r.warning_date || r.incident_date);
  const violationText = formatMultilinePreview(r.description);
  const promiseText = formatMultilinePreview(r.employee_promise);
  const isVoided = r.status === "voided" || r.status === "void";

  return (
    <tr
      onClick={() => onSelectRecord(r)}
      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
    >
      <td className="px-4 py-3 text-slate-500 font-semibold align-top">{index}</td>

      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap align-top">
        {warningType}
      </td>

      <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap align-top">
        {warningDate}
      </td>

      {/* Employee */}
      <td className="px-4 py-3 whitespace-nowrap align-top">
        <div className="flex items-center gap-2.5">
          {emp?.avatar_url ? (
            <img
              src={emp.avatar_url}
              alt=""
              className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#253C7D] text-white flex items-center justify-center text-xs font-black shrink-0">
              {emp ? (emp.last_name?.[0] || emp.first_name?.[0] || "?") : "?"}
            </div>
          )}
          <div>
            <p className="font-bold text-slate-900 group-hover:text-[#253C7D] transition-colors leading-tight">
              {emp ? formatKhmerFullName(emp) : "—"}
            </p>
            {emp?.employee_id && (
              <span className="inline-block mt-0.5 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border border-slate-200 text-slate-600 bg-white">
                {emp.employee_id}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Description of Violation */}
      <td className="px-4 py-3 max-w-xs align-top">
        <div className="text-slate-700 whitespace-pre-line line-clamp-3 leading-relaxed font-['Kantumruy_Pro',sans-serif]" title={violationText}>
          {violationText}
        </div>
      </td>

      {/* Employee Promise */}
      <td className="px-4 py-3 max-w-xs align-top">
        <div className="text-slate-700 whitespace-pre-line line-clamp-3 leading-relaxed font-['Kantumruy_Pro',sans-serif]" title={promiseText}>
          {promiseText}
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3 text-center whitespace-nowrap align-top">
        {isVoided ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-600">
            Voided
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#20B2AA] text-white">
            Recorded
          </span>
        )}
      </td>

      {/* Action Settings Menu */}
      <td
        className="px-4 py-3 text-right whitespace-nowrap relative align-top"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className={`w-7 h-7 inline-flex items-center justify-center rounded cursor-pointer transition-colors ${
            menuOpen
              ? "bg-[#253C7D] text-white border border-[#253C7D]"
              : "border border-sky-500 text-sky-500 hover:bg-sky-50"
          }`}
          title="Settings"
        >
          <i className="ri-settings-3-line text-sm" />
        </button>

        <WarningRowMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          buttonRef={buttonRef}
          record={r}
          onView={onSelectRecord}
          onEdit={onEditRecord}
          onVoid={onVoidRecord}
          onDelete={onDeleteRecord}
        />
      </td>
    </tr>
  );
});
