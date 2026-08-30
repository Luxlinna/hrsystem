import { memo, useState, useRef, useEffect } from "react";
import type { AnnouncementFormState } from "../types";
import { CATEGORY_CONFIG } from "../constants";

interface AnnouncementCategoryPickerProps {
  form: AnnouncementFormState;
  setForm: React.Dispatch<React.SetStateAction<AnnouncementFormState>>;
}

export const AnnouncementCategoryPicker = memo(function AnnouncementCategoryPicker({
  form,
  setForm,
}: AnnouncementCategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [customCategory, setCustomCategory] = useState("");
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

  const getCategoryDisplay = (catKey: string) => {
    if (CATEGORY_CONFIG[catKey]) return CATEGORY_CONFIG[catKey];
    return {
      label: catKey || "General Notice",
      desc: "Custom Announcement Category",
      icon: "ri-price-tag-3-line",
      bg: "bg-slate-100 border-slate-200",
      color: "text-slate-700",
    };
  };

  const current = getCategoryDisplay(form.category);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
        Announcement Category <span className="text-rose-500">*</span>
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full px-3.5 py-2.5 bg-gray-50/80 hover:bg-white border rounded-xl text-xs text-left font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
          open ? "border-[#253C7D] ring-2 ring-[#253C7D]/10 bg-white" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 ${current.bg} ${current.color}`}>
            <i className={current.icon} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{current.label}</p>
            <p className="text-[10px] text-gray-400 truncate">{current.desc}</p>
          </div>
        </div>
        <i className={`ri-arrow-down-s-line text-gray-400 text-base transition-transform duration-200 shrink-0 ${open ? "rotate-180 text-[#253C7D]" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-2 space-y-1.5 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          <div className="relative">
            <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Filter category..."
              className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="space-y-1 max-h-44 overflow-y-auto">
            {Object.entries(CATEGORY_CONFIG)
              .filter(([_, cfg]) => cfg.label.toLowerCase().includes(categorySearch.toLowerCase()))
              .map(([key, cfg]) => {
                const isSelected = form.category === key;
                return (
                  <div
                    key={key}
                    onClick={() => {
                      setForm((prev) => ({ ...prev, category: key }));
                      setOpen(false);
                    }}
                    className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs ${
                      isSelected ? "bg-[#253C7D]/10 text-[#253C7D]" : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 ${cfg.bg} ${cfg.color}`}>
                        <i className={cfg.icon} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{cfg.label}</p>
                        <p className="text-[10px] text-gray-400 truncate">{cfg.desc}</p>
                      </div>
                    </div>
                    {isSelected && <i className="ri-checkbox-circle-fill text-[#253C7D] text-sm shrink-0" />}
                  </div>
                );
              })}
          </div>

          <div className="pt-2 border-t border-gray-100 bg-gray-50/70 p-2 rounded-xl space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Or Type Custom Category:</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (customCategory.trim()) {
                      setForm((prev) => ({ ...prev, category: customCategory.trim() }));
                      setCustomCategory("");
                      setOpen(false);
                    }
                  }
                }}
                placeholder="e.g. Training, Wellness..."
                className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#253C7D]"
              />
              <button
                type="button"
                onClick={() => {
                  if (customCategory.trim()) {
                    setForm((prev) => ({ ...prev, category: customCategory.trim() }));
                    setCustomCategory("");
                    setOpen(false);
                  }
                }}
                disabled={!customCategory.trim()}
                className="px-3 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Set
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
