import { memo, useState, useRef, useEffect } from "react";
import type { AnnouncementFormState } from "../types";
import { PRIORITY_CONFIG } from "../constants";

interface AnnouncementPriorityPickerProps {
  form: AnnouncementFormState;
  setForm: React.Dispatch<React.SetStateAction<AnnouncementFormState>>;
}

export const AnnouncementPriorityPicker = memo(function AnnouncementPriorityPicker({
  form,
  setForm,
}: AnnouncementPriorityPickerProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pri = PRIORITY_CONFIG[form.priority] || PRIORITY_CONFIG.normal;

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
        Priority & Urgency Level <span className="text-rose-500">*</span>
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full px-3.5 py-2.5 bg-gray-50/80 hover:bg-white border rounded-xl text-xs text-left font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
          open ? "border-[#253C7D] ring-2 ring-[#253C7D]/10 bg-white" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${pri.dot}`} />
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{pri.label}</p>
            <p className="text-[10px] text-gray-400 truncate">
              {form.priority === "urgent"
                ? "Immediate acknowledgment required"
                : form.priority === "high"
                ? "High visibility notice"
                : "Standard bulletin broadcast"}
            </p>
          </div>
        </div>
        <i className={`ri-arrow-down-s-line text-gray-400 text-base transition-transform duration-200 shrink-0 ${open ? "rotate-180 text-[#253C7D]" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => {
            const isSelected = form.priority === key;
            return (
              <div
                key={key}
                onClick={() => {
                  setForm((prev) => ({ ...prev, priority: key }));
                  setOpen(false);
                }}
                className={`p-2.5 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs ${
                  isSelected ? "bg-[#253C7D]/10 text-[#253C7D]" : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${cfg.dot}`} />
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900">{cfg.label}</p>
                    <p className="text-[10px] text-gray-400">
                      {key === "urgent" ? "Mandatory employee sign-off" : key === "high" ? "Prominent banner display" : "Standard announcement card"}
                    </p>
                  </div>
                </div>
                {isSelected && <i className="ri-checkbox-circle-fill text-[#253C7D] text-sm shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
