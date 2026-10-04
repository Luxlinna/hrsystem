import { memo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { DisciplinaryRecord } from "../types";
import { WarningDetailBody } from "./WarningDetailBody";
import { formatDateDMY } from "../utils/formatters";
import { exportWarningLetterPdf } from "../exports";

interface WarningDetailModalProps {
  record: DisciplinaryRecord | null;
  onClose: () => void;
  onDelete?: (record: DisciplinaryRecord) => void;
}

export const WarningDetailModal = memo(function WarningDetailModal({
  record,
  onClose,
  onDelete,
}: WarningDetailModalProps) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!record?.employee_id) return;
    let active = true;
    supabase
      .from("employees")
      .select("*, branches(name), work_locations:default_work_location_id(name), manager:reports_to(first_name, last_name, role)")
      .eq("id", record.employee_id)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) setProfile(data);
      });
    return () => {
      active = false;
    };
  }, [record?.employee_id]);

  if (!record) return null;

  const formattedDate = formatDateDMY(record.warning_date || record.incident_date);
  const isVoided =
    record.status === "voided" ||
    record.status === "void" ||
    (record.remark && record.remark.includes("[VOIDED]"));

  const handlePrint = () => {
    try {
      exportWarningLetterPdf(record, profile);
    } catch {
      window.print();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#253C7D] text-white flex items-center justify-center text-lg font-bold shadow-xs shrink-0">
              <i className="ri-file-warning-line" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">Employee Warning Detail</h3>
                {isVoided ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                    Voided
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#20B2AA] text-white">
                    Recorded
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Issued on {formattedDate} &bull; Recorded by {record.created_by || "HR Admin"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Content Body */}
        <WarningDetailBody record={record} />

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this warning record?")) {
                    onDelete(record);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <i className="ri-delete-bin-line mr-1" />
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <i className="ri-printer-line text-slate-500" />
              Print / PDF
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer shadow-xs hover:opacity-95"
            style={{ background: "#253C7D" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});
