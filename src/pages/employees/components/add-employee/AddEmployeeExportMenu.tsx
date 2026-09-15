import React, { useState, useRef, useEffect, memo } from "react";
import type { EmployeeFormState } from "../../types";
import { exportHiringInfoPdf } from "@/pages/hire/exports/exportHiringInfoPdf";
import { exportHiringInfoWord } from "@/pages/hire/exports/exportHiringInfoWord";

interface AddEmployeeExportMenuProps {
  form: EmployeeFormState;
}

export const AddEmployeeExportMenu: React.FC<AddEmployeeExportMenuProps> = memo(
  function AddEmployeeExportMenu({ form }) {
    const [isOpen, setIsOpen] = useState(false);
    const [exportingWord, setExportingWord] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      if (isOpen) document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const getExportPayload = () => {
      const name = form.full_name?.trim() || `${form.first_name || ""} ${form.last_name || ""}`.trim() || "Employee";
      return {
        ...form,
        id: form.employee_code || form.biometric_user_id || "NEW",
        candidate_code: form.employee_code || form.biometric_user_id || "NEW",
        full_name: name,
        job_title: form.position || form.role || "Staff",
        location: form.working_location || form.site || "",
      } as any;
    };

    const handlePdf = () => {
      setIsOpen(false);
      exportHiringInfoPdf(getExportPayload());
    };

    const handleWord = async () => {
      setExportingWord(true);
      setIsOpen(false);
      try {
        await exportHiringInfoWord(getExportPayload());
      } finally {
        setExportingWord(false);
      }
    };

    return (
      <div className="relative inline-block text-left" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={exportingWord}
          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-50"
          title="Export 33-Field Hiring Record"
        >
          <i className={exportingWord ? "ri-loader-4-line animate-spin text-sm" : "ri-download-2-line text-sm text-[#253C7D]"} />
          <span>{exportingWord ? "Exporting..." : "Export"}</span>
          <i className="ri-arrow-down-s-line text-xs text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute right-0 bottom-full mb-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Export 33-Field Record
            </div>
            <button
              type="button"
              onClick={handlePdf}
              className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <i className="ri-file-pdf-fill text-rose-500 text-sm" />
              <div>
                <p className="font-bold leading-tight">Export PDF</p>
                <p className="text-[10px] text-slate-400">Printable A4 Sheet</p>
              </div>
            </button>
            <button
              type="button"
              onClick={handleWord}
              className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <i className="ri-file-word-fill text-blue-600 text-sm" />
              <div>
                <p className="font-bold leading-tight">Export Word (.docx)</p>
                <p className="text-[10px] text-slate-400">Editable Document</p>
              </div>
            </button>
          </div>
        )}
      </div>
    );
  }
);
