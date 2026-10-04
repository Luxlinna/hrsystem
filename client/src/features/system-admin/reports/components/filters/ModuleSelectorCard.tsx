import { memo, useState, useRef, useEffect } from "react";
import { MODULES } from "../../constants";

interface ModuleSelectorCardProps {
  activeModule: string;
  onSelectModule: (modId: string) => void;
}

export const ModuleSelectorCard = memo(function ModuleSelectorCard({
  activeModule,
  onSelectModule,
}: ModuleSelectorCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = MODULES.find((m) => m.id === activeModule) || MODULES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="p-4 relative" ref={dropdownRef}>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
        Report Module
      </label>

      {/* Dropdown Toggle Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 p-2.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D]"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center shrink-0">
            <i className={`${selected.icon} text-base`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-[13px] font-bold text-slate-900 truncate leading-tight">
              {selected.label}
            </p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">
              {selected.desc}
            </p>
          </div>
        </div>
        <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
          <i className={`ri-arrow-down-s-line text-sm transition-transform duration-200 ${isOpen ? "rotate-180 text-[#253C7D]" : ""}`} />
        </div>
      </button>

      {/* Dropdown Popover Menu */}
      {isOpen && (
        <div className="absolute left-4 right-4 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 max-h-80 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150">
          {MODULES.map((m) => {
            const isSelected = activeModule === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onSelectModule(m.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#253C7D] text-white shadow-xs"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <i className={`${m.icon} text-sm`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate leading-tight ${isSelected ? "text-white" : "text-slate-900"}`}>
                    {m.label}
                  </p>
                  <p className={`text-[10px] truncate mt-0.5 ${isSelected ? "text-white/80" : "text-slate-500"}`}>
                    {m.desc}
                  </p>
                </div>
                {isSelected && (
                  <i className="ri-check-line text-sm font-bold text-white shrink-0 pr-1" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
