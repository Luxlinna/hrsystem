import { memo, useState, useRef, useEffect } from "react";

interface HireSettingsDropdownProps {
  onOpenManageJd?: () => void;
  onOpenCvBank?: () => void;
  onOpenImportCandidates?: () => void;
}

export const HireSettingsDropdown = memo(function HireSettingsDropdown({
  onOpenManageJd,
  onOpenCvBank,
  onOpenImportCandidates,
}: HireSettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const hasAnyOption = Boolean(onOpenManageJd || onOpenCvBank || onOpenImportCandidates);
  if (!hasAnyOption) return null;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:border-[#253C7D] hover:bg-slate-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
        title="Recruitment configuration, JD Library, and CV Bank settings"
      >
        <i className="ri-settings-4-line text-sm text-[#253C7D]" />
        <span>Settings &amp; Tools</span>
        <i className={`ri-arrow-down-s-line text-xs text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 border-b border-gray-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
              Recruitment Controls
            </span>
          </div>

          <div className="p-1 space-y-0.5">
            {onOpenManageJd && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenManageJd();
                }}
                className="w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-50 transition-colors cursor-pointer text-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#253C7D] flex items-center justify-center shrink-0 mt-0.5">
                  <i className="ri-book-open-line text-sm" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">JD Library</p>
                  <p className="text-[11px] text-gray-400">Manage standard JD templates</p>
                </div>
              </button>
            )}

            {onOpenCvBank && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCvBank();
                }}
                className="w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-50 transition-colors cursor-pointer text-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <i className="ri-folder-user-line text-sm" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">CV Bank &amp; Settings</p>
                  <p className="text-[11px] text-gray-400">Candidate resumes &amp; OCR ingestion</p>
                </div>
              </button>
            )}

            {onOpenImportCandidates && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenImportCandidates();
                }}
                className="w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-50 transition-colors cursor-pointer text-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <i className="ri-upload-cloud-2-line text-sm" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">Import Hiring Info</p>
                  <p className="text-[11px] text-gray-400">Batch upload from CSV/Excel</p>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
